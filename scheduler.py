import logging
from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.jobstores.memory import MemoryJobStore
from flask import current_app

from restic_wrapper import ResticWrapper

logger = logging.getLogger(__name__)

# Create scheduler
scheduler = BackgroundScheduler(
    jobstores={'default': MemoryJobStore()},
    job_defaults={'coalesce': True, 'max_instances': 5},
    timezone='UTC'
)

def init_scheduler(app):
    """Initialize the scheduler with the Flask app context"""
    scheduler.start()
    logger.info("Scheduler started")
    
    # Register scheduler to be shut down when Flask exits
    app.teardown_appcontext(lambda _: safe_shutdown_scheduler())
    
    # Load scheduled tasks from database and add them to the scheduler
    with app.app_context():
        from models import ScheduledTask, Repository
        from sqlalchemy.exc import SQLAlchemyError
        
        try:
            tasks = ScheduledTask.query.filter_by(enabled=True).all()
            for task in tasks:
                schedule_backup_task(task)
            logger.info(f"Loaded {len(tasks)} scheduled tasks")
        except SQLAlchemyError as e:
            logger.error(f"Error loading scheduled tasks: {str(e)}")

def safe_shutdown_scheduler():
    """Safely shut down the scheduler"""
    try:
        if scheduler.running:
            scheduler.shutdown(wait=False)
    except:
        logger.warning("Error shutting down scheduler, possibly not running")

def run_backup_task(task_id):
    """
    Run a backup task
    
    Args:
        task_id (int): ID of the scheduled task
    """
    from app import app, db
    from models import ScheduledTask, Repository, Backup, Snapshot
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker, scoped_session
    import json
    
    logger.info(f"Starting scheduled backup task {task_id}")
    
    # 使用应用上下文
    with app.app_context():
        # 创建一个新的会话，确保线程安全
        engine = create_engine(app.config['SQLALCHEMY_DATABASE_URI'])
        session_factory = sessionmaker(bind=engine)
        Session = scoped_session(session_factory)
        session = Session()
        
        try:
            # 获取任务详情
            task = session.query(ScheduledTask).get(task_id)
            if not task:
                logger.error(f"Scheduled task {task_id} not found")
                return
            
            # 更新最后运行时间
            task.last_run = datetime.utcnow()
            session.commit()
            
            # 获取仓库
            repository = session.query(Repository).get(task.repository_id)
            if not repository:
                logger.error(f"Repository {task.repository_id} not found")
                return
            
            # 创建备份记录
            backup = Backup(
                repository_id=repository.id,
                source_path=task.source_path,
                status='running'
            )
            session.add(backup)
            session.commit()
            
            # 使用适当的仓库类型运行备份
            if repository.repo_type == 'rest-server':
                restic = ResticWrapper(
                    repository.location, 
                    repository.password, 
                    repo_type='rest-server',
                    rest_user=repository.rest_user,
                    rest_pass=repository.rest_pass
                )
            else:
                restic = ResticWrapper(
                    repository.location, 
                    repository.password, 
                    repo_type=repository.repo_type
                )
            
            # 处理标签
            tags = json.loads(task.tags) if task.tags else []
            success, result = restic.create_backup(task.source_path, tags)
            
            # 更新备份记录
            backup.end_time = datetime.utcnow()
            backup.status = 'completed' if success else 'failed'
            backup.message = result.get('message', '')
            
            if success:
                backup.files_new = result.get('files_new', 0)
                backup.files_changed = result.get('files_changed', 0)
                backup.bytes_added = result.get('bytes_added', 0)
                backup.snapshot_id = result.get('snapshot_id', '')
                
                # 如果有快照ID，也添加到快照表
                if backup.snapshot_id:
                    snapshot = Snapshot(
                        repository_id=repository.id,
                        snapshot_id=backup.snapshot_id,
                        created_at=backup.end_time,
                        hostname=result.get('hostname', ''),
                        paths=json.dumps([task.source_path]),
                        size=result.get('bytes_added', 0)
                    )
                    session.add(snapshot)
            
            session.commit()
            logger.info(f"Completed scheduled backup task {task_id}: {backup.status}")
        
        except Exception as e:
            logger.error(f"Error running scheduled backup task {task_id}: {str(e)}")
            try:
                session.rollback()
            except Exception as rollback_error:
                logger.error(f"Error rolling back session: {str(rollback_error)}")
        finally:
            # 清理会话
            session.close()
            Session.remove()

def schedule_backup_task(task):
    """
    Schedule a backup task
    
    Args:
        task: ScheduledTask object
        
    Returns:
        datetime: Next run time or None if scheduling failed
    """
    job_id = f'backup_task_{task.id}'
    
    # Remove existing job if it exists
    try:
        scheduler.remove_job(job_id)
    except:
        pass
    
    if not task.enabled:
        return None
    
    # Create trigger based on schedule type
    if task.schedule_type == 'cron' and task.cron_expression:
        try:
            trigger = CronTrigger.from_crontab(task.cron_expression)
        except Exception as e:
            logger.error(f"Invalid cron expression '{task.cron_expression}': {str(e)}")
            return None
    
    elif task.schedule_type == 'interval' and task.interval_seconds:
        trigger = IntervalTrigger(seconds=task.interval_seconds)
    
    else:
        logger.error(f"Invalid schedule configuration for task {task.id}")
        return None
    
    # Add the job to the scheduler
    job = scheduler.add_job(
        run_backup_task,
        trigger=trigger,
        args=[task.id],
        id=job_id,
        replace_existing=True
    )
    
    logger.info(f"Scheduled backup task {task.id} with next run at {job.next_run_time}")
    return job.next_run_time

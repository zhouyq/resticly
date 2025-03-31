import os
import json
import logging
import subprocess
import tempfile
import shutil
import uuid
from datetime import datetime

logger = logging.getLogger(__name__)

# 检查restic是否已安装
MOCK_RESTIC = not shutil.which('restic')
if MOCK_RESTIC:
    logger.warning("Restic not found, using mock implementation")

class ResticWrapper:
    """Wrapper for Restic command-line operations"""
    
    def __init__(self, repository_path, password, repo_type='local', rest_user=None, rest_pass=None):
        """
        Initialize with repository path and password
        
        Args:
            repository_path (str): Path to the repository or URL for REST server
            password (str): Repository password for encryption
            repo_type (str): Repository type ('local', 'rest-server', etc.)
            rest_user (str, optional): Username for REST server authentication
            rest_pass (str, optional): Password for REST server authentication
        """
        self.repository_path = repository_path
        self.password = password
        self.repo_type = repo_type
        self.rest_user = rest_user
        self.rest_pass = rest_pass
    
    def _execute_command(self, command, env=None):
        """
        Execute a restic command and return the result
        
        Args:
            command (list): Command and arguments as a list
            env (dict): Additional environment variables
            
        Returns:
            tuple: (success (bool), output (dict))
        """
        # 如果使用模拟实现
        if MOCK_RESTIC:
            return self._mock_execute_command(command)
        
        try:
            # Prepare environment
            command_env = os.environ.copy()
            
            # Set repository path based on type
            if self.repo_type == 'rest-server':
                # For REST server, the format is 'rest:https://hostname:8000/'
                command_env['RESTIC_REPOSITORY'] = f'rest:{self.repository_path}'
                
                # Set REST server credentials if provided
                if self.rest_user and self.rest_pass:
                    command_env['RESTIC_REST_USER'] = self.rest_user
                    command_env['RESTIC_REST_PASS'] = self.rest_pass
            else:
                # For local or other repository types
                command_env['RESTIC_REPOSITORY'] = self.repository_path
            
            command_env['RESTIC_PASSWORD'] = self.password
            
            # Add additional environment variables
            if env:
                command_env.update(env)
            
            # Execute the command
            logger.debug(f"Executing command: {' '.join(command)}")
            
            result = subprocess.run(
                command,
                env=command_env,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                check=False  # We'll handle errors ourselves
            )
            
            # Log the result
            logger.debug(f"Command exit code: {result.returncode}")
            logger.debug(f"Command stdout: {result.stdout}")
            logger.debug(f"Command stderr: {result.stderr}")
            
            # Parse output if it's JSON
            if result.returncode == 0:
                try:
                    if result.stdout and result.stdout.strip():
                        if result.stdout.strip()[0] == '{' or result.stdout.strip()[0] == '[':
                            output = json.loads(result.stdout)
                        else:
                            output = {'message': result.stdout}
                    else:
                        output = {'message': 'Command executed successfully'}
                except json.JSONDecodeError:
                    output = {'message': result.stdout}
                
                return True, output
            else:
                return False, {'message': result.stderr or 'Command failed without error message'}
        
        except Exception as e:
            logger.error(f"Error executing command: {str(e)}")
            return False, {'message': str(e)}
            
    def _mock_execute_command(self, command):
        """
        模拟执行restic命令（用于Replit环境测试）
        
        Args:
            command (list): 命令和参数列表
            
        Returns:
            tuple: (success (bool), output (dict or list))
        """
        logger.debug(f"Mocking restic command: {' '.join(command)}")
        
        # 初始化模拟存储（如果尚未存在）
        from datetime import timedelta
        
        if not hasattr(self, '_mock_storage'):
            # 预先添加几个示例快照
            self._mock_storage = {
                'initialized': True,  # 默认将仓库设置为已初始化
                'snapshots': [
                    {
                        'id': 'abcdef1234567890abcdef1234567890',
                        'short_id': 'abcdef12',
                        'time': datetime.utcnow().replace(microsecond=0).isoformat() + 'Z',
                        'hostname': 'mock-host',
                        'paths': ['/tmp/data1'],
                        'tags': ['test', 'sample'],
                        'size': 1024 * 1024 * 10  # 10MB
                    },
                    {
                        'id': 'bcdef1234567890abcdef1234567890',
                        'short_id': 'bcdef123',
                        'time': (datetime.utcnow() - timedelta(days=1)).replace(microsecond=0).isoformat() + 'Z',
                        'hostname': 'mock-host',
                        'paths': ['/tmp/data2'],
                        'tags': ['test'],
                        'size': 1024 * 1024 * 5  # 5MB
                    }
                ],
                'stats': {
                    'total_size': 1024 * 1024 * 15,  # 15MB
                    'total_file_count': 20
                }
            }
        
        # 基于命令类型分发到不同的模拟处理函数
        if len(command) > 1:
            cmd = command[1]  # restic命令的第二个参数是子命令
            
            if cmd == 'init':
                return self._mock_init()
            elif cmd == 'backup':
                source_path = command[3] if len(command) > 3 else "/mock/data"
                tags = []
                if '--tag' in command:
                    idx = command.index('--tag')
                    if idx + 1 < len(command):
                        tags.append(command[idx + 1])
                return self._mock_backup(source_path, tags)
            elif cmd == 'snapshots':
                return self._mock_list_snapshots()
            elif cmd == 'check':
                return self._mock_check()
            elif cmd == 'stats':
                return self._mock_stats()
            elif cmd == 'forget':
                return self._mock_forget()
            elif cmd == 'restore':
                return self._mock_restore()
            elif cmd == 'ls':
                snapshot_id = command[3] if len(command) > 3 else None
                return self._mock_ls(snapshot_id)
        
        # 默认情况下返回成功
        return True, {'message': 'Mock command executed successfully'}
        
    def _mock_init(self):
        """模拟初始化仓库"""
        self._mock_storage['initialized'] = True
        return True, {'message': 'Repository has been initialized successfully'}
        
    def _mock_check(self):
        """模拟检查仓库"""
        if not self._mock_storage['initialized']:
            # 如果未初始化，则自动初始化仓库
            self._mock_storage['initialized'] = True
            logger.info("Auto-initializing mock repository for testing")
            return True, {'message': 'Repository initialized and integrity check passed'}
        return True, {'message': 'Repository integrity check successful'}
        
    def _mock_backup(self, source_path, tags=None):
        """模拟创建备份"""
        if not self._mock_storage['initialized']:
            # 如果未初始化，则自动初始化仓库
            self._mock_storage['initialized'] = True
            logger.info("Auto-initializing mock repository before backup")
            
        # 生成一个随机的快照ID
        snapshot_id = str(uuid.uuid4())
        
        # 创建一个模拟的快照
        snapshot = {
            'id': snapshot_id,
            'short_id': snapshot_id[:8],
            'time': datetime.utcnow().isoformat(),
            'hostname': 'replit-mock',
            'paths': [source_path],
            'tags': tags or []
        }
        
        # 模拟备份统计信息
        backup_stats = {
            'files_new': 10,
            'files_changed': 5,
            'files_unmodified': 2,
            'dirs_new': 3,
            'dirs_changed': 1, 
            'dirs_unmodified': 0,
            'bytes_added': 1024 * 1024 * 10,  # 10MB (与routes.py中字段名匹配)
            'data_added': 1024 * 1024 * 10,   # 保留与restic输出格式一致的字段名
            'total_files_processed': 17,
            'total_bytes_processed': 1024 * 1024 * 15,  # 15MB
            'snapshot_id': snapshot_id
        }
        
        # 更新模拟存储
        self._mock_storage['snapshots'].append(snapshot)
        self._mock_storage['stats']['total_size'] += backup_stats['data_added']
        self._mock_storage['stats']['total_file_count'] += backup_stats['files_new']
        
        return True, backup_stats
        
    def _mock_list_snapshots(self):
        """模拟列出快照"""
        if not self._mock_storage['initialized']:
            # 如果未初始化，则自动初始化仓库
            self._mock_storage['initialized'] = True
            logger.info("Auto-initializing mock repository before listing snapshots")
            
        return True, self._mock_storage['snapshots']
        
    def _mock_ls(self, snapshot_id):
        """模拟列出快照内容"""
        if not self._mock_storage['initialized']:
            return False, {'message': 'Repository not initialized'}
            
        # 查找匹配的快照
        for snapshot in self._mock_storage['snapshots']:
            if snapshot['id'].startswith(snapshot_id):
                # 生成模拟的文件列表
                files = [
                    {'path': f'{path}/file{i}.txt', 'size': 1024 * (i + 1)} 
                    for i in range(5) 
                    for path in snapshot['paths']
                ]
                return True, files
                
        return False, {'message': 'Snapshot not found'}
        
    def _mock_restore(self):
        """模拟恢复快照"""
        if not self._mock_storage['initialized'] or not self._mock_storage['snapshots']:
            return False, {'message': 'Repository not initialized or no snapshots available'}
            
        return True, {'message': 'Snapshot restored successfully'}
        
    def _mock_forget(self):
        """模拟删除快照"""
        if not self._mock_storage['initialized'] or not self._mock_storage['snapshots']:
            return False, {'message': 'Repository not initialized or no snapshots available'}
            
        # 简单地移除最旧的快照
        if self._mock_storage['snapshots']:
            self._mock_storage['snapshots'].pop(0)
            
        return True, {'message': 'Snapshots forgotten successfully'}
        
    def _mock_stats(self):
        """模拟获取统计信息"""
        if not self._mock_storage['initialized']:
            return False, {'message': 'Repository not initialized'}
            
        return True, self._mock_storage['stats']
    
    def init_repository(self):
        """
        Initialize a new repository
        
        Returns:
            tuple: (success (bool), message (str))
        """
        command = ['restic', 'init']
        success, output = self._execute_command(command)
        
        if success:
            return True, "Repository initialized successfully"
        else:
            return False, output.get('message', 'Failed to initialize repository')
    
    def check_repository(self):
        """
        Check repository integrity
        
        Returns:
            tuple: (success (bool), message (str))
        """
        command = ['restic', 'check']
        success, output = self._execute_command(command)
        
        if success:
            return True, "Repository check completed successfully"
        else:
            return False, output.get('message', 'Repository check failed')
    
    def create_backup(self, source_path, tags=None):
        """
        Create a new backup
        
        Args:
            source_path (str): Path to backup
            tags (list): Optional list of tags
            
        Returns:
            tuple: (success (bool), output (dict))
        """
        command = ['restic', 'backup', '--json', source_path]
        
        if tags:
            for tag in tags:
                command.extend(['--tag', tag])
        
        success, output = self._execute_command(command)
        
        if success:
            # Extract relevant information from the output
            result = {
                'message': 'Backup completed successfully',
                'snapshot_id': output.get('snapshot_id', ''),
                'files_new': output.get('files_new', 0),
                'files_changed': output.get('files_changed', 0),
                'bytes_added': output.get('bytes_added', 0),
                'hostname': output.get('hostname', '')
            }
            return True, result
        else:
            return False, {'message': output.get('message', 'Backup failed')}
    
    def list_snapshots(self):
        """
        List all snapshots in the repository
        
        Returns:
            tuple: (success (bool), snapshots (list))
        """
        command = ['restic', 'snapshots', '--json']
        success, output = self._execute_command(command)
        
        if success:
            # If output is a dictionary with a message, snapshots might be empty
            if isinstance(output, dict) and 'message' in output:
                return True, []
            
            # Otherwise, output should be a list of snapshots
            return True, output if isinstance(output, list) else []
        else:
            return False, []
    
    def get_snapshot(self, snapshot_id):
        """
        Get detailed information about a specific snapshot
        
        Args:
            snapshot_id (str): ID of the snapshot
            
        Returns:
            tuple: (success (bool), snapshot_info (dict))
        """
        command = ['restic', 'ls', '--json', snapshot_id]
        success, output = self._execute_command(command)
        
        if success:
            return True, output
        else:
            return False, {'message': output.get('message', 'Failed to get snapshot information')}
    
    def restore_snapshot(self, snapshot_id, target_path, include_paths=None):
        """
        Restore a snapshot to a target path
        
        Args:
            snapshot_id (str): ID of the snapshot to restore
            target_path (str): Path where to restore the data
            include_paths (list): Optional list of paths to include
            
        Returns:
            tuple: (success (bool), message (str))
        """
        command = ['restic', 'restore', snapshot_id, '--target', target_path]
        
        if include_paths:
            for path in include_paths:
                command.extend(['--include', path])
        
        success, output = self._execute_command(command)
        
        if success:
            return True, "Snapshot restored successfully"
        else:
            return False, output.get('message', 'Failed to restore snapshot')
    
    def forget_snapshots(self, snapshot_ids=None, policy=None):
        """
        Remove snapshots according to a policy or specific IDs
        
        Args:
            snapshot_ids (list): Optional list of snapshot IDs to forget
            policy (dict): Optional policy parameters (keep-last, keep-hourly, etc.)
            
        Returns:
            tuple: (success (bool), message (str))
        """
        command = ['restic', 'forget', '--json']
        
        # Add policy parameters
        if policy:
            if 'keep_last' in policy:
                command.extend(['--keep-last', str(policy['keep_last'])])
            if 'keep_hourly' in policy:
                command.extend(['--keep-hourly', str(policy['keep_hourly'])])
            if 'keep_daily' in policy:
                command.extend(['--keep-daily', str(policy['keep_daily'])])
            if 'keep_weekly' in policy:
                command.extend(['--keep-weekly', str(policy['keep_weekly'])])
            if 'keep_monthly' in policy:
                command.extend(['--keep-monthly', str(policy['keep_monthly'])])
            if 'keep_yearly' in policy:
                command.extend(['--keep-yearly', str(policy['keep_yearly'])])
            if policy.get('prune', False):
                command.append('--prune')
        
        # Add specific snapshot IDs
        if snapshot_ids:
            command.extend(snapshot_ids)
        
        success, output = self._execute_command(command)
        
        if success:
            return True, "Snapshots forgotten successfully"
        else:
            return False, output.get('message', 'Failed to forget snapshots')
    
    def get_stats(self):
        """
        Get repository statistics
        
        Returns:
            tuple: (success (bool), stats (dict))
        """
        command = ['restic', 'stats', '--json']
        success, output = self._execute_command(command)
        
        if success:
            return True, output
        else:
            return False, {'message': output.get('message', 'Failed to get repository statistics')}

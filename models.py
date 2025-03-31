from datetime import datetime
from app import db

class Repository(db.Model):
    """Model for Restic repositories"""
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    repo_type = db.Column(db.String(50), default='local')  # local, rest-server, sftp, s3, etc.
    location = db.Column(db.String(500), nullable=False)
    password = db.Column(db.String(256), nullable=False)  # Password used for repository encryption
    rest_user = db.Column(db.String(100), nullable=True)  # REST server username (if applicable)
    rest_pass = db.Column(db.String(256), nullable=True)  # REST server password (if applicable)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_check = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(50), default='unknown')  # unknown, ok, error
    
    # Relationships
    backups = db.relationship('Backup', backref='repository', lazy=True, cascade="all, delete-orphan")
    snapshots = db.relationship('Snapshot', backref='repository', lazy=True, cascade="all, delete-orphan")
    scheduled_tasks = db.relationship('ScheduledTask', backref='repository', lazy=True, cascade="all, delete-orphan")

class Backup(db.Model):
    """Model for backup operations"""
    id = db.Column(db.Integer, primary_key=True)
    repository_id = db.Column(db.Integer, db.ForeignKey('repository.id'), nullable=False)
    source_path = db.Column(db.String(500), nullable=False)
    start_time = db.Column(db.DateTime, default=datetime.utcnow)
    end_time = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(50), default='running')  # running, completed, failed
    message = db.Column(db.Text, nullable=True)
    files_new = db.Column(db.Integer, default=0)
    files_changed = db.Column(db.Integer, default=0)
    bytes_added = db.Column(db.BigInteger, default=0)
    snapshot_id = db.Column(db.String(100), nullable=True)

class Snapshot(db.Model):
    """Model for Restic snapshots"""
    id = db.Column(db.Integer, primary_key=True)
    repository_id = db.Column(db.Integer, db.ForeignKey('repository.id'), nullable=False)
    snapshot_id = db.Column(db.String(100), nullable=False)  # Actual Restic snapshot ID
    created_at = db.Column(db.DateTime, nullable=False)
    hostname = db.Column(db.String(100), nullable=True)
    paths = db.Column(db.Text, nullable=True)  # Stored as JSON string
    tags = db.Column(db.Text, nullable=True)  # Stored as JSON string
    size = db.Column(db.BigInteger, nullable=True)

class ScheduledTask(db.Model):
    """Model for scheduled backup tasks"""
    id = db.Column(db.Integer, primary_key=True)
    repository_id = db.Column(db.Integer, db.ForeignKey('repository.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    source_path = db.Column(db.String(500), nullable=False)
    schedule_type = db.Column(db.String(50), nullable=False)  # cron, interval
    cron_expression = db.Column(db.String(100), nullable=True)
    interval_seconds = db.Column(db.Integer, nullable=True)
    enabled = db.Column(db.Boolean, default=True)
    last_run = db.Column(db.DateTime, nullable=True)
    next_run = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    tags = db.Column(db.Text, nullable=True)  # Stored as JSON string

class Settings(db.Model):
    """Model for application settings"""
    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(100), unique=True, nullable=False)
    value = db.Column(db.Text, nullable=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

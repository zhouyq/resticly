import os
import json
import logging
import subprocess
import tempfile
from datetime import datetime

logger = logging.getLogger(__name__)

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

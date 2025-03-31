/**
 * Backups page specific JavaScript
 */

/**
 * Initialize the backups page
 */
function initBackupsPage() {
  loadBackups();
  loadRepositoriesForSelector();
  setupBackupFormHandlers();
}

/**
 * Load backups from the API
 */
function loadBackups() {
  showLoading();
  
  apiRequest('/api/backups')
    .then(backups => {
      renderBackups(backups);
    })
    .catch(error => {
      console.error('Error loading backups:', error);
      showToast('Failed to load backups: ' + error.message, 'danger');
    })
    .finally(() => {
      hideLoading();
    });
}

/**
 * Render backups in the table
 * @param {Array} backups - List of backups
 */
function renderBackups(backups) {
  const tableBody = document.getElementById('backupsTableBody');
  if (!tableBody) return;
  
  if (backups.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center">No backups found</td>
      </tr>
    `;
    return;
  }
  
  tableBody.innerHTML = backups.map(backup => `
    <tr data-backup-id="${backup.id}">
      <td>${backup.repository_name}</td>
      <td><small class="text-muted">${backup.source_path}</small></td>
      <td>${formatDate(backup.start_time)}</td>
      <td>${backup.end_time ? formatDate(backup.end_time) : '-'}</td>
      <td>${createStatusBadge(backup.status)}</td>
      <td>
        ${backup.status === 'completed' ? 
          `<small>Files: ${backup.files_new} new, ${backup.files_changed} changed<br>
           Size: ${formatSize(backup.bytes_added)}</small>` : 
          (backup.status === 'failed' ? 
            `<small class="text-danger">${backup.message}</small>` : 
            '<small>Running...</small>')}
      </td>
      <td>
        ${backup.status === 'completed' ? 
          `<div class="btn-group btn-group-sm" role="group">
            <button type="button" class="btn btn-outline-secondary btn-view-snapshot" title="View snapshot" data-snapshot-id="${backup.snapshot_id}">
              <i class="bi bi-eye"></i>
            </button>
          </div>` : ''}
      </td>
    </tr>
  `).join('');
  
  // Add event listeners to buttons
  tableBody.querySelectorAll('.btn-view-snapshot').forEach(button => {
    button.addEventListener('click', () => {
      const snapshotId = button.dataset.snapshotId;
      if (snapshotId) {
        window.location.href = `/snapshots?id=${snapshotId}`;
      }
    });
  });
}

/**
 * Load repositories for the repository selector
 */
function loadRepositoriesForSelector() {
  const repositorySelect = document.getElementById('backupRepository');
  if (!repositorySelect) return;
  
  apiRequest('/api/repositories')
    .then(repositories => {
      repositorySelect.innerHTML = '<option value="">Select repository</option>';
      
      repositories.forEach(repo => {
        const option = document.createElement('option');
        option.value = repo.id;
        option.textContent = repo.name;
        repositorySelect.appendChild(option);
      });
    })
    .catch(error => {
      console.error('Error loading repositories for selector:', error);
      showToast('Failed to load repositories: ' + error.message, 'warning');
    });
}

/**
 * Setup handlers for backup forms
 */
function setupBackupFormHandlers() {
  const newBackupForm = document.getElementById('newBackupForm');
  if (newBackupForm) {
    newBackupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      createBackup();
    });
  }
  
  // Setup backup buttons
  const newBackupButton = document.getElementById('newBackupButton');
  if (newBackupButton) {
    newBackupButton.addEventListener('click', () => {
      const modal = new bootstrap.Modal(document.getElementById('newBackupModal'));
      modal.show();
    });
  }
}

/**
 * Create a new backup
 */
function createBackup() {
  const repositorySelect = document.getElementById('backupRepository');
  const sourcePath = document.getElementById('backupSourcePath');
  
  if (!repositorySelect || !sourcePath) return;
  
  const repositoryId = repositorySelect.value;
  const path = sourcePath.value.trim();
  
  if (!repositoryId || !path) {
    showToast('Please fill in all required fields', 'warning');
    return;
  }
  
  showLoading();
  
  apiRequest('/api/backups', {
    method: 'POST',
    body: JSON.stringify({
      repository_id: repositoryId,
      source_path: path
    })
  })
    .then(result => {
      showToast('Backup started successfully', 'success');
      
      // Reset form and hide modal
      repositorySelect.selectedIndex = 0;
      sourcePath.value = '';
      
      bootstrap.Modal.getInstance(document.getElementById('newBackupModal')).hide();
      
      // Reload backups
      loadBackups();
      
      // Set up refresh interval to show progress
      const refreshInterval = setInterval(() => {
        apiRequest(`/api/backups/${result.id}`)
          .then(backup => {
            if (backup.status !== 'running') {
              clearInterval(refreshInterval);
              showToast(`Backup ${backup.status}`, backup.status === 'completed' ? 'success' : 'danger');
              loadBackups();
            }
          })
          .catch(error => {
            console.error('Error checking backup status:', error);
            clearInterval(refreshInterval);
          });
      }, 5000);
    })
    .catch(error => {
      console.error('Error creating backup:', error);
      showToast('Failed to create backup: ' + error.message, 'danger');
    })
    .finally(() => {
      hideLoading();
    });
}

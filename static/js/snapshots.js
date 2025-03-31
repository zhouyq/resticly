/**
 * Snapshots page specific JavaScript
 */

/**
 * Initialize the snapshots page
 */
function initSnapshotsPage() {
  loadRepositoriesForSelector();
  setupSnapshotActions();
  
  // Check if we should filter by repository
  const urlParams = new URLSearchParams(window.location.search);
  const repoId = urlParams.get('repository');
  const snapshotId = urlParams.get('id');
  
  if (repoId) {
    // Select the repository in the dropdown
    const repoSelector = document.getElementById('repositorySelector');
    if (repoSelector) {
      repoSelector.value = repoId;
    }
  }
  
  // Initial load of snapshots
  loadSnapshots(repoId);
}

/**
 * Load repositories for the repository selector
 */
function loadRepositoriesForSelector() {
  const repositorySelect = document.getElementById('repositorySelector');
  if (!repositorySelect) return;
  
  apiRequest('/api/repositories')
    .then(repositories => {
      repositorySelect.innerHTML = '<option value="">All Repositories</option>';
      
      repositories.forEach(repo => {
        const option = document.createElement('option');
        option.value = repo.id;
        option.textContent = repo.name;
        repositorySelect.appendChild(option);
      });
      
      // Setup change event listener
      repositorySelect.addEventListener('change', () => {
        loadSnapshots(repositorySelect.value);
      });
    })
    .catch(error => {
      console.error('Error loading repositories for selector:', error);
      showToast('Failed to load repositories: ' + error.message, 'warning');
    });
}

/**
 * Load snapshots from the API
 * @param {string} repositoryId - Optional repository ID to filter by
 */
function loadSnapshots(repositoryId) {
  showLoading();
  
  const url = repositoryId ? 
    `/api/snapshots?repository_id=${repositoryId}` : 
    '/api/snapshots';
  
  apiRequest(url)
    .then(snapshots => {
      renderSnapshots(snapshots);
    })
    .catch(error => {
      console.error('Error loading snapshots:', error);
      showToast('Failed to load snapshots: ' + error.message, 'danger');
    })
    .finally(() => {
      hideLoading();
    });
}

/**
 * Render snapshots in the table
 * @param {Array} snapshots - List of snapshots
 */
function renderSnapshots(snapshots) {
  const tableBody = document.getElementById('snapshotsTableBody');
  if (!tableBody) return;
  
  if (snapshots.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center">No snapshots found</td>
      </tr>
    `;
    return;
  }
  
  tableBody.innerHTML = snapshots.map(snapshot => `
    <tr data-snapshot-id="${snapshot.snapshot_id}">
      <td>${snapshot.repository_name}</td>
      <td>${snapshot.hostname}</td>
      <td>${formatDate(snapshot.created_at)}</td>
      <td>${formatSize(snapshot.size)}</td>
      <td>
        <small class="text-muted">
          ${(snapshot.paths || []).join(', ')}
        </small>
      </td>
      <td>
        <div class="btn-group btn-group-sm" role="group">
          <button type="button" class="btn btn-outline-primary btn-details-snapshot" title="View details">
            <i class="bi bi-info-circle"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
  
  // Add event listeners to buttons
  tableBody.querySelectorAll('.btn-details-snapshot').forEach(button => {
    button.addEventListener('click', () => {
      const snapshotId = button.closest('tr').dataset.snapshotId;
      showSnapshotDetails(snapshotId);
    });
  });
}

/**
 * Setup snapshot action buttons
 */
function setupSnapshotActions() {
  const syncButton = document.getElementById('syncSnapshots');
  if (syncButton) {
    syncButton.addEventListener('click', () => {
      syncRepositorySnapshots();
    });
  }
}

/**
 * Sync snapshots from repository
 */
function syncRepositorySnapshots() {
  const repositorySelect = document.getElementById('repositorySelector');
  if (!repositorySelect || !repositorySelect.value) {
    showToast('Please select a repository first', 'warning');
    return;
  }
  
  const repositoryId = repositorySelect.value;
  
  showLoading();
  
  apiRequest(`/api/repositories/${repositoryId}/snapshots/sync`, {
    method: 'POST'
  })
    .then(result => {
      showToast(`Successfully synced ${result.count} snapshots`, 'success');
      loadSnapshots(repositoryId);
    })
    .catch(error => {
      console.error('Error syncing snapshots:', error);
      showToast('Failed to sync snapshots: ' + error.message, 'danger');
    })
    .finally(() => {
      hideLoading();
    });
}

/**
 * Show snapshot details in a modal
 * @param {string} snapshotId - Snapshot ID
 */
function showSnapshotDetails(snapshotId) {
  // Find the snapshot in the table
  const row = document.querySelector(`tr[data-snapshot-id="${snapshotId}"]`);
  if (!row) return;
  
  // Extract data from the row
  const repository = row.cells[0].textContent;
  const hostname = row.cells[1].textContent;
  const created = row.cells[2].textContent;
  const size = row.cells[3].textContent;
  const paths = row.cells[4].textContent;
  
  // Populate modal
  const modal = document.getElementById('snapshotDetailsModal');
  if (!modal) return;
  
  modal.querySelector('.modal-title').textContent = `Snapshot Details`;
  
  const modalBody = modal.querySelector('.modal-body');
  modalBody.innerHTML = `
    <div class="mb-3">
      <strong>Repository:</strong> ${repository}
    </div>
    <div class="mb-3">
      <strong>Snapshot ID:</strong> <code>${snapshotId}</code>
    </div>
    <div class="mb-3">
      <strong>Created:</strong> ${created}
    </div>
    <div class="mb-3">
      <strong>Hostname:</strong> ${hostname}
    </div>
    <div class="mb-3">
      <strong>Size:</strong> ${size}
    </div>
    <div class="mb-3">
      <strong>Paths:</strong>
      <div class="text-muted">${paths}</div>
    </div>
  `;
  
  // Show the modal
  const bsModal = new bootstrap.Modal(modal);
  bsModal.show();
}

/**
 * Repositories page specific JavaScript
 */

/**
 * Initialize the repositories page
 */
function initRepositoriesPage() {
  loadRepositories();
  setupRepositoryFormHandlers();
}

/**
 * Load repositories from the API
 */
function loadRepositories() {
  showLoading();
  
  apiRequest('/api/repositories')
    .then(repositories => {
      renderRepositories(repositories);
    })
    .catch(error => {
      console.error('Error loading repositories:', error);
      showToast('Failed to load repositories: ' + error.message, 'danger');
    })
    .finally(() => {
      hideLoading();
    });
}

/**
 * Render repositories in the table
 * @param {Array} repositories - List of repositories
 */
function renderRepositories(repositories) {
  const tableBody = document.getElementById('repositoriesTableBody');
  if (!tableBody) return;
  
  if (repositories.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center">No repositories found</td>
      </tr>
    `;
    return;
  }
  
  tableBody.innerHTML = repositories.map(repo => `
    <tr data-repo-id="${repo.id}">
      <td>${repo.name}</td>
      <td>
        <span class="badge bg-secondary me-1">${repo.repo_type}</span>
        <small class="text-muted">${repo.location}</small>
      </td>
      <td>${formatDate(repo.created_at)}</td>
      <td>${formatDate(repo.last_check)}</td>
      <td>${createStatusBadge(repo.status)}</td>
      <td>
        <div class="btn-group btn-group-sm" role="group">
          <button type="button" class="btn btn-outline-primary btn-check-repo" title="Check repository">
            <i class="bi bi-check-circle"></i>
          </button>
          <button type="button" class="btn btn-outline-danger btn-delete-repo" title="Delete repository">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
  
  // Add event listeners to buttons
  tableBody.querySelectorAll('.btn-check-repo').forEach(button => {
    button.addEventListener('click', () => {
      const repoId = button.closest('tr').dataset.repoId;
      checkRepository(repoId);
    });
  });
  
  tableBody.querySelectorAll('.btn-delete-repo').forEach(button => {
    button.addEventListener('click', () => {
      const repoId = button.closest('tr').dataset.repoId;
      const repoName = button.closest('tr').querySelector('td:first-child').textContent;
      confirmDeleteRepository(repoId, repoName);
    });
  });
}

/**
 * Setup handlers for repository forms
 */
function setupRepositoryFormHandlers() {
  const newRepoForm = document.getElementById('newRepositoryForm');
  if (newRepoForm) {
    newRepoForm.addEventListener('submit', (e) => {
      e.preventDefault();
      createRepository();
    });
  }
  
  // Setup repository type change handler
  const typeSelect = document.getElementById('repositoryType');
  if (typeSelect) {
    typeSelect.addEventListener('change', () => {
      toggleRestServerFields(typeSelect.value === 'rest-server');
    });
    
    // Initialize the visibility based on the default selection
    toggleRestServerFields(typeSelect.value === 'rest-server');
  }
  
  // Setup repository buttons
  const newRepoButton = document.getElementById('newRepositoryButton');
  if (newRepoButton) {
    newRepoButton.addEventListener('click', () => {
      const modal = new bootstrap.Modal(document.getElementById('newRepositoryModal'));
      modal.show();
    });
  }
}

/**
 * Toggle visibility of REST server specific fields
 * @param {boolean} show - Whether to show the fields
 */
function toggleRestServerFields(show) {
  const restServerFields = document.getElementById('restServerFields');
  if (restServerFields) {
    restServerFields.style.display = show ? 'block' : 'none';
  }
  
  // Update location field placeholder based on type
  const locationInput = document.getElementById('repositoryLocation');
  if (locationInput) {
    locationInput.placeholder = show ? 
      'https://your-rest-server:8000/' : 
      '/path/to/repository';
  }
  
  // Update help text
  const locationHelpText = document.getElementById('locationHelpText');
  if (locationHelpText) {
    if (show) {
      locationHelpText.innerHTML = 'Example: <code>https://rest-server.example.com:8000/</code>';
    } else {
      locationHelpText.innerHTML = 'Example: <code>/path/to/repo</code>';
    }
  }
}

/**
 * Create a new repository
 */
function createRepository() {
  const nameInput = document.getElementById('repositoryName');
  const typeSelect = document.getElementById('repositoryType');
  const locationInput = document.getElementById('repositoryLocation');
  const passwordInput = document.getElementById('repositoryPassword');
  const restUserInput = document.getElementById('restServerUsername');
  const restPassInput = document.getElementById('restServerPassword');
  
  if (!nameInput || !typeSelect || !locationInput || !passwordInput) return;
  
  const name = nameInput.value.trim();
  const repo_type = typeSelect.value;
  const location = locationInput.value.trim();
  const password = passwordInput.value;
  
  if (!name || !repo_type || !location || !password) {
    showToast('Please fill in all required fields', 'warning');
    return;
  }
  
  // For REST server, validate additional fields
  if (repo_type === 'rest-server') {
    if (!location.startsWith('http://') && !location.startsWith('https://')) {
      showToast('REST server URL must start with http:// or https://', 'warning');
      return;
    }
  }
  
  const repoData = {
    name: name,
    repo_type: repo_type,
    location: location,
    password: password
  };
  
  // Add REST server authentication if provided
  if (repo_type === 'rest-server' && restUserInput && restPassInput) {
    const rest_user = restUserInput.value.trim();
    const rest_pass = restPassInput.value;
    
    if (rest_user && rest_pass) {
      repoData.rest_user = rest_user;
      repoData.rest_pass = rest_pass;
    }
  }
  
  showLoading();
  
  apiRequest('/api/repositories', {
    method: 'POST',
    body: JSON.stringify(repoData)
  })
    .then(result => {
      showToast('Repository created successfully', 'success');
      
      // Reset form and hide modal
      nameInput.value = '';
      locationInput.value = '';
      passwordInput.value = '';
      
      // Reset type to default and reset REST server fields
      if (typeSelect) {
        typeSelect.value = 'local';
        toggleRestServerFields(false);
      }
      
      // Reset REST server fields if they exist
      if (restUserInput) restUserInput.value = '';
      if (restPassInput) restPassInput.value = '';
      
      bootstrap.Modal.getInstance(document.getElementById('newRepositoryModal')).hide();
      
      // Reload repositories
      loadRepositories();
    })
    .catch(error => {
      console.error('Error creating repository:', error);
      showToast('Failed to create repository: ' + error.message, 'danger');
    })
    .finally(() => {
      hideLoading();
    });
}

/**
 * Check repository health
 * @param {string} repoId - Repository ID
 */
function checkRepository(repoId) {
  showLoading();
  
  apiRequest(`/api/repositories/${repoId}/check`, { method: 'POST' })
    .then(result => {
      showToast(`Repository check completed: ${result.status}`, result.status === 'ok' ? 'success' : 'warning');
      loadRepositories();
    })
    .catch(error => {
      console.error('Error checking repository:', error);
      showToast('Failed to check repository: ' + error.message, 'danger');
    })
    .finally(() => {
      hideLoading();
    });
}

/**
 * Confirm repository deletion
 * @param {string} repoId - Repository ID
 * @param {string} repoName - Repository name
 */
function confirmDeleteRepository(repoId, repoName) {
  if (confirm(`Are you sure you want to delete repository "${repoName}"? This will only remove it from Resticly's database, not delete the actual repository data.`)) {
    deleteRepository(repoId);
  }
}

/**
 * Delete a repository
 * @param {string} repoId - Repository ID
 */
function deleteRepository(repoId) {
  showLoading();
  
  apiRequest(`/api/repositories/${repoId}`, { method: 'DELETE' })
    .then(result => {
      showToast('Repository deleted successfully', 'success');
      loadRepositories();
    })
    .catch(error => {
      console.error('Error deleting repository:', error);
      showToast('Failed to delete repository: ' + error.message, 'danger');
    })
    .finally(() => {
      hideLoading();
    });
}

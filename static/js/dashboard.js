/**
 * Dashboard page specific JavaScript
 */

/**
 * Initialize the dashboard page
 */
function initDashboardPage() {
  fetchDashboardData();
  setupCharts();
  
  // Set up auto-refresh every 30 seconds
  setInterval(fetchDashboardData, 30000);
}

/**
 * Fetch dashboard data from the API
 */
function fetchDashboardData() {
  // Fetch repositories
  apiRequest('/api/repositories')
    .then(repositories => {
      updateRepositoriesWidget(repositories);
    })
    .catch(error => {
      console.error('Error fetching repositories:', error);
    });
  
  // Fetch recent backups
  apiRequest('/api/backups')
    .then(backups => {
      updateRecentBackupsWidget(backups.slice(0, 5));
    })
    .catch(error => {
      console.error('Error fetching backups:', error);
    });
  
  // Fetch scheduled tasks
  apiRequest('/api/scheduled-tasks')
    .then(tasks => {
      updateScheduledTasksWidget(tasks);
    })
    .catch(error => {
      console.error('Error fetching scheduled tasks:', error);
    });
}

/**
 * Update the repositories widget
 * @param {Array} repositories - List of repositories
 */
function updateRepositoriesWidget(repositories) {
  const repoWidget = document.getElementById('repositoriesWidget');
  if (!repoWidget) return;
  
  const repoCount = document.getElementById('repoCount');
  if (repoCount) {
    repoCount.textContent = repositories.length;
  }
  
  const repoList = document.getElementById('repoList');
  if (repoList) {
    if (repositories.length === 0) {
      repoList.innerHTML = '<div class="text-center text-muted">No repositories found</div>';
      return;
    }
    
    repoList.innerHTML = repositories.map(repo => `
      <div class="d-flex justify-content-between align-items-center mb-2">
        <div>
          <strong>${repo.name}</strong>
          <small class="d-block text-muted">${repo.location}</small>
        </div>
        <div>${createStatusBadge(repo.status)}</div>
      </div>
    `).join('');
  }
}

/**
 * Update the recent backups widget
 * @param {Array} backups - List of backups
 */
function updateRecentBackupsWidget(backups) {
  const backupWidget = document.getElementById('recentBackupsWidget');
  if (!backupWidget) return;
  
  const backupCount = document.getElementById('backupCount');
  if (backupCount) {
    backupCount.textContent = backups.length;
  }
  
  const backupList = document.getElementById('backupList');
  if (backupList) {
    if (backups.length === 0) {
      backupList.innerHTML = '<div class="text-center text-muted">No backups found</div>';
      return;
    }
    
    backupList.innerHTML = backups.map(backup => `
      <div class="d-flex justify-content-between align-items-center mb-2">
        <div>
          <strong>${backup.repository_name}</strong>
          <small class="d-block text-muted">${backup.source_path}</small>
          <small class="d-block text-muted">${formatDate(backup.start_time)}</small>
        </div>
        <div>${createStatusBadge(backup.status)}</div>
      </div>
    `).join('');
  }
  
  // Update status counts
  const runningCount = document.getElementById('runningBackups');
  const completedCount = document.getElementById('completedBackups');
  const failedCount = document.getElementById('failedBackups');
  
  if (runningCount && completedCount && failedCount) {
    const running = backups.filter(b => b.status === 'running').length;
    const completed = backups.filter(b => b.status === 'completed').length;
    const failed = backups.filter(b => b.status === 'failed').length;
    
    runningCount.textContent = running;
    completedCount.textContent = completed;
    failedCount.textContent = failed;
  }
}

/**
 * Update the scheduled tasks widget
 * @param {Array} tasks - List of scheduled tasks
 */
function updateScheduledTasksWidget(tasks) {
  const tasksWidget = document.getElementById('scheduledTasksWidget');
  if (!tasksWidget) return;
  
  const taskCount = document.getElementById('scheduledCount');
  if (taskCount) {
    taskCount.textContent = tasks.length;
  }
  
  const tasksList = document.getElementById('scheduledTasksList');
  if (tasksList) {
    if (tasks.length === 0) {
      tasksList.innerHTML = '<div class="text-center text-muted">No scheduled tasks found</div>';
      return;
    }
    
    tasksList.innerHTML = tasks.map(task => `
      <div class="d-flex justify-content-between align-items-center mb-2">
        <div>
          <strong>${task.name}</strong>
          <small class="d-block text-muted">${task.repository_name}</small>
          <small class="d-block text-muted">Next run: ${formatDate(task.next_run)}</small>
        </div>
        <div>
          <span class="badge ${task.enabled ? 'bg-success' : 'bg-secondary'}">
            ${task.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      </div>
    `).join('');
  }
}

/**
 * Setup dashboard charts
 */
function setupCharts() {
  setupBackupStatusChart();
  setupBackupSizeChart();
}

/**
 * Setup the backup status chart
 */
function setupBackupStatusChart() {
  const chartCanvas = document.getElementById('backupStatusChart');
  if (!chartCanvas) return;
  
  // Fetch data for the chart
  apiRequest('/api/backups')
    .then(backups => {
      // Count backups by status
      const statusCounts = {
        completed: 0,
        running: 0,
        failed: 0
      };
      
      backups.forEach(backup => {
        if (backup.status in statusCounts) {
          statusCounts[backup.status]++;
        }
      });
      
      // Create the chart
      const ctx = chartCanvas.getContext('2d');
      new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Completed', 'Running', 'Failed'],
          datasets: [{
            data: [statusCounts.completed, statusCounts.running, statusCounts.failed],
            backgroundColor: ['#198754', '#0d6efd', '#dc3545'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      });
    })
    .catch(error => {
      console.error('Error fetching data for backup status chart:', error);
    });
}

/**
 * Setup the backup size chart
 */
function setupBackupSizeChart() {
  const chartCanvas = document.getElementById('backupSizeChart');
  if (!chartCanvas) return;
  
  // Fetch data for the chart
  apiRequest('/api/backups')
    .then(backups => {
      // Get the last 7 completed backups
      const recentBackups = backups
        .filter(b => b.status === 'completed')
        .sort((a, b) => new Date(b.end_time) - new Date(a.end_time))
        .slice(0, 7)
        .reverse();
      
      // Extract data for the chart
      const labels = recentBackups.map(b => new Date(b.end_time).toLocaleDateString());
      const data = recentBackups.map(b => b.bytes_added);
      
      // Create the chart
      const ctx = chartCanvas.getContext('2d');
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Backup Size (bytes)',
            data: data,
            backgroundColor: '#0d6efd',
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return formatSize(value);
                }
              }
            }
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: function(context) {
                  return formatSize(context.raw);
                }
              }
            },
            legend: {
              display: false
            }
          }
        }
      });
    })
    .catch(error => {
      console.error('Error fetching data for backup size chart:', error);
    });
}

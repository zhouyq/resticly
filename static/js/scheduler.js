/**
 * Scheduler page specific JavaScript
 */

/**
 * Initialize the scheduler page
 */
function initSchedulerPage() {
  loadScheduledTasks();
  loadRepositoriesForSelector();
  setupSchedulerFormHandlers();
}

/**
 * Load scheduled tasks from the API
 */
function loadScheduledTasks() {
  showLoading();
  
  apiRequest('/api/scheduled-tasks')
    .then(tasks => {
      renderScheduledTasks(tasks);
    })
    .catch(error => {
      console.error('Error loading scheduled tasks:', error);
      showToast('Failed to load scheduled tasks: ' + error.message, 'danger');
    })
    .finally(() => {
      hideLoading();
    });
}

/**
 * Render scheduled tasks in the table
 * @param {Array} tasks - List of scheduled tasks
 */
function renderScheduledTasks(tasks) {
  const tableBody = document.getElementById('schedulerTableBody');
  if (!tableBody) return;
  
  if (tasks.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center">No scheduled tasks found</td>
      </tr>
    `;
    return;
  }
  
  tableBody.innerHTML = tasks.map(task => `
    <tr data-task-id="${task.id}">
      <td>${task.name}</td>
      <td>${task.repository_name}</td>
      <td><small class="text-muted">${task.source_path}</small></td>
      <td>
        ${task.schedule_type === 'cron' ? 
          `<small>Cron: ${task.cron_expression}</small>` : 
          `<small>Interval: ${formatDuration(task.interval_seconds)}</small>`}
      </td>
      <td>${formatDate(task.next_run)}</td>
      <td>
        <div class="form-check form-switch">
          <input class="form-check-input task-enabled-toggle" type="checkbox" role="switch" 
                 id="enabledSwitch-${task.id}" ${task.enabled ? 'checked' : ''}>
        </div>
      </td>
      <td>
        <div class="btn-group btn-group-sm" role="group">
          <button type="button" class="btn btn-outline-danger btn-delete-task" title="Delete task">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
  
  // Add event listeners to buttons and switches
  tableBody.querySelectorAll('.btn-delete-task').forEach(button => {
    button.addEventListener('click', () => {
      const taskId = button.closest('tr').dataset.taskId;
      const taskName = button.closest('tr').querySelector('td:first-child').textContent;
      confirmDeleteTask(taskId, taskName);
    });
  });
  
  tableBody.querySelectorAll('.task-enabled-toggle').forEach(toggle => {
    toggle.addEventListener('change', () => {
      const taskId = toggle.closest('tr').dataset.taskId;
      updateTaskEnabled(taskId, toggle.checked);
    });
  });
}

/**
 * Load repositories for the repository selector
 */
function loadRepositoriesForSelector() {
  const repositorySelect = document.getElementById('taskRepository');
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
 * Setup handlers for scheduler forms
 */
function setupSchedulerFormHandlers() {
  const newTaskForm = document.getElementById('newTaskForm');
  if (newTaskForm) {
    newTaskForm.addEventListener('submit', (e) => {
      e.preventDefault();
      createScheduledTask();
    });
  }
  
  // Setup scheduler buttons
  const newTaskButton = document.getElementById('newTaskButton');
  if (newTaskButton) {
    newTaskButton.addEventListener('click', () => {
      const modal = new bootstrap.Modal(document.getElementById('newTaskModal'));
      modal.show();
    });
  }
  
  // Setup schedule type toggle
  const scheduleTypeSelect = document.getElementById('scheduleType');
  const cronExpressionGroup = document.getElementById('cronExpressionGroup');
  const intervalSecondsGroup = document.getElementById('intervalSecondsGroup');
  
  if (scheduleTypeSelect && cronExpressionGroup && intervalSecondsGroup) {
    scheduleTypeSelect.addEventListener('change', () => {
      if (scheduleTypeSelect.value === 'cron') {
        cronExpressionGroup.style.display = 'block';
        intervalSecondsGroup.style.display = 'none';
      } else if (scheduleTypeSelect.value === 'interval') {
        cronExpressionGroup.style.display = 'none';
        intervalSecondsGroup.style.display = 'block';
      }
    });
  }
}

/**
 * Create a new scheduled task
 */
function createScheduledTask() {
  const nameInput = document.getElementById('taskName');
  const repositorySelect = document.getElementById('taskRepository');
  const sourcePathInput = document.getElementById('taskSourcePath');
  const scheduleTypeSelect = document.getElementById('scheduleType');
  const cronExpressionInput = document.getElementById('cronExpression');
  const intervalHoursInput = document.getElementById('intervalHours');
  const intervalMinutesInput = document.getElementById('intervalMinutes');
  
  if (!nameInput || !repositorySelect || !sourcePathInput || !scheduleTypeSelect) return;
  
  const name = nameInput.value.trim();
  const repositoryId = repositorySelect.value;
  const sourcePath = sourcePathInput.value.trim();
  const scheduleType = scheduleTypeSelect.value;
  
  if (!name || !repositoryId || !sourcePath || !scheduleType) {
    showToast('Please fill in all required fields', 'warning');
    return;
  }
  
  const taskData = {
    name: name,
    repository_id: repositoryId,
    source_path: sourcePath,
    schedule_type: scheduleType,
    enabled: true
  };
  
  if (scheduleType === 'cron') {
    const cronExpression = cronExpressionInput.value.trim();
    if (!cronExpression) {
      showToast('Please enter a cron expression', 'warning');
      return;
    }
    taskData.cron_expression = cronExpression;
  } else if (scheduleType === 'interval') {
    const hours = parseInt(intervalHoursInput.value, 10) || 0;
    const minutes = parseInt(intervalMinutesInput.value, 10) || 0;
    
    if (hours === 0 && minutes === 0) {
      showToast('Please enter a valid interval', 'warning');
      return;
    }
    
    taskData.interval_seconds = (hours * 3600) + (minutes * 60);
  }
  
  showLoading();
  
  apiRequest('/api/scheduled-tasks', {
    method: 'POST',
    body: JSON.stringify(taskData)
  })
    .then(result => {
      showToast('Scheduled task created successfully', 'success');
      
      // Reset form and hide modal
      nameInput.value = '';
      repositorySelect.selectedIndex = 0;
      sourcePathInput.value = '';
      scheduleTypeSelect.selectedIndex = 0;
      cronExpressionInput.value = '';
      intervalHoursInput.value = '0';
      intervalMinutesInput.value = '0';
      
      bootstrap.Modal.getInstance(document.getElementById('newTaskModal')).hide();
      
      // Reload tasks
      loadScheduledTasks();
    })
    .catch(error => {
      console.error('Error creating scheduled task:', error);
      showToast('Failed to create scheduled task: ' + error.message, 'danger');
    })
    .finally(() => {
      hideLoading();
    });
}

/**
 * Update task enabled state
 * @param {string} taskId - Task ID
 * @param {boolean} enabled - New enabled state
 */
function updateTaskEnabled(taskId, enabled) {
  showLoading();
  
  apiRequest(`/api/scheduled-tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify({
      enabled: enabled
    })
  })
    .then(result => {
      showToast(`Task ${enabled ? 'enabled' : 'disabled'} successfully`, 'success');
      loadScheduledTasks();
    })
    .catch(error => {
      console.error('Error updating task:', error);
      showToast('Failed to update task: ' + error.message, 'danger');
      // Revert the toggle state
      const toggle = document.getElementById(`enabledSwitch-${taskId}`);
      if (toggle) {
        toggle.checked = !enabled;
      }
    })
    .finally(() => {
      hideLoading();
    });
}

/**
 * Confirm task deletion
 * @param {string} taskId - Task ID
 * @param {string} taskName - Task name
 */
function confirmDeleteTask(taskId, taskName) {
  if (confirm(`Are you sure you want to delete task "${taskName}"?`)) {
    deleteTask(taskId);
  }
}

/**
 * Delete a scheduled task
 * @param {string} taskId - Task ID
 */
function deleteTask(taskId) {
  showLoading();
  
  apiRequest(`/api/scheduled-tasks/${taskId}`, { method: 'DELETE' })
    .then(result => {
      showToast('Task deleted successfully', 'success');
      loadScheduledTasks();
    })
    .catch(error => {
      console.error('Error deleting task:', error);
      showToast('Failed to delete task: ' + error.message, 'danger');
    })
    .finally(() => {
      hideLoading();
    });
}

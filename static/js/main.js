/**
 * Main JavaScript file for Resticly
 * Contains global functionality used across the application
 */

// Global application state
const app = {
  currentLanguage: 'en',
  darkMode: true,
  apiBaseUrl: '', // Empty for relative paths
  loadingRequests: 0
};

// DOM Ready handler
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});

/**
 * Initialize the application
 */
function initializeApp() {
  // Load user preferences from localStorage
  loadUserPreferences();
  
  // Initialize language support
  initializeLanguage();
  
  // Initialize theme support
  initializeTheme();
  
  // Setup navigation and active page highlighting
  setupNavigation();
  
  // Setup global event handlers
  setupEventHandlers();
  
  // Initialize page-specific functionality
  initializeCurrentPage();
}

/**
 * Load user preferences from localStorage
 */
function loadUserPreferences() {
  // Load language preference
  const savedLanguage = localStorage.getItem('resticly_language');
  if (savedLanguage) {
    app.currentLanguage = savedLanguage;
  }
  
  // Load theme preference
  const savedTheme = localStorage.getItem('resticly_theme');
  if (savedTheme) {
    app.darkMode = savedTheme === 'dark';
  } else {
    // Default to user's system preference if available
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      app.darkMode = true;
    }
  }
}

/**
 * Initialize language support
 */
function initializeLanguage() {
  // Set language selector to current language
  const languageSelector = document.getElementById('languageSelector');
  if (languageSelector) {
    languageSelector.value = app.currentLanguage;
    languageSelector.addEventListener('change', (e) => {
      const language = e.target.value;
      changeLanguage(language);
    });
  }
  
  // Initial translation
  translatePage();
}

/**
 * Change the application language
 * @param {string} language - Language code ('en' or 'zh')
 */
function changeLanguage(language) {
  app.currentLanguage = language;
  localStorage.setItem('resticly_language', language);
  translatePage();
}

/**
 * Translate the current page content
 */
function translatePage() {
  const elements = document.querySelectorAll('[data-i18n]');
  
  // Fetch the language file
  fetch(`${app.apiBaseUrl}/static/locales/${app.currentLanguage}.json`)
    .then(response => response.json())
    .then(translations => {
      elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[key]) {
          element.textContent = translations[key];
        }
      });
    })
    .catch(error => {
      console.error('Error loading translations:', error);
    });
}

/**
 * Initialize theme support
 */
function initializeTheme() {
  // Set theme toggle to current state
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.checked = app.darkMode;
    themeToggle.addEventListener('change', (e) => {
      toggleTheme(e.target.checked);
    });
  }
  
  // Apply initial theme
  applyTheme();
}

/**
 * Toggle between light and dark theme
 * @param {boolean} darkMode - Whether to enable dark mode
 */
function toggleTheme(darkMode) {
  app.darkMode = darkMode;
  localStorage.setItem('resticly_theme', darkMode ? 'dark' : 'light');
  applyTheme();
}

/**
 * Apply the current theme to the document
 */
function applyTheme() {
  document.body.setAttribute('data-bs-theme', app.darkMode ? 'dark' : 'light');
  
  // Update theme toggle icon if it exists
  const themeIcon = document.getElementById('themeIcon');
  if (themeIcon) {
    themeIcon.className = app.darkMode ? 'bi bi-moon-fill' : 'bi bi-sun-fill';
  }
}

/**
 * Setup navigation and active page highlighting
 */
function setupNavigation() {
  // Get current page from URL path
  const path = window.location.pathname;
  const page = path.split('/').pop() || 'dashboard';
  
  // Highlight active navigation item
  const navItems = document.querySelectorAll('.nav-link');
  navItems.forEach(item => {
    const href = item.getAttribute('href');
    if (href === path || 
        (path === '/' && href.includes('dashboard')) || 
        (href && path.includes(href) && href !== '/')) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}

/**
 * Setup global event handlers
 */
function setupEventHandlers() {
  // Handle modal events
  document.addEventListener('click', (e) => {
    // Close dropdown menus when clicking outside
    if (!e.target.matches('.dropdown-toggle') && !e.target.closest('.dropdown-menu')) {
      const dropdowns = document.querySelectorAll('.dropdown-menu.show');
      dropdowns.forEach(dropdown => {
        dropdown.classList.remove('show');
      });
    }
  });
}

/**
 * Initialize page-specific functionality
 */
function initializeCurrentPage() {
  // Get current page from URL path
  const path = window.location.pathname;
  const page = path.split('/').pop() || 'dashboard';
  
  // Call page-specific initialization function if it exists
  if (typeof window[`init${capitalize(page)}Page`] === 'function') {
    window[`init${capitalize(page)}Page`]();
  }
}

/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type of toast (success, danger, warning, info)
 * @param {number} duration - Duration to show toast in ms (default: 3000)
 */
function showToast(message, type = 'info', duration = 3000) {
  // Create toast container if it doesn't exist
  let toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainer';
    toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    document.body.appendChild(toastContainer);
  }
  
  // Create toast element
  const toastId = `toast-${Date.now()}`;
  const toast = document.createElement('div');
  toast.id = toastId;
  toast.className = `toast text-bg-${type} border-0`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');
  toast.setAttribute('aria-atomic', 'true');
  
  // Create toast content
  toast.innerHTML = `
    <div class="toast-header text-bg-${type} border-0">
      <strong class="me-auto">${type.charAt(0).toUpperCase() + type.slice(1)}</strong>
      <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
    <div class="toast-body">
      ${message}
    </div>
  `;
  
  // Add toast to container
  toastContainer.appendChild(toast);
  
  // Initialize and show the toast
  const bsToast = new bootstrap.Toast(toast, {
    autohide: true,
    delay: duration
  });
  bsToast.show();
  
  // Remove toast element after it's hidden
  toast.addEventListener('hidden.bs.toast', () => {
    toast.remove();
  });
}

/**
 * Show loading spinner
 */
function showLoading() {
  app.loadingRequests++;
  updateLoadingState();
}

/**
 * Hide loading spinner
 */
function hideLoading() {
  app.loadingRequests = Math.max(0, app.loadingRequests - 1);
  updateLoadingState();
}

/**
 * Update the loading state based on current requests
 */
function updateLoadingState() {
  const loadingIndicator = document.getElementById('loadingIndicator');
  if (loadingIndicator) {
    loadingIndicator.style.display = app.loadingRequests > 0 ? 'block' : 'none';
  }
}

/**
 * Perform an API request with automatic loading indicator
 * @param {string} url - API URL
 * @param {Object} options - Fetch options
 * @returns {Promise} - Fetch promise
 */
function apiRequest(url, options = {}) {
  showLoading();
  
  // Set default headers if not provided
  if (!options.headers) {
    options.headers = {
      'Content-Type': 'application/json'
    };
  }
  
  return fetch(`${app.apiBaseUrl}${url}`, options)
    .then(response => {
      if (!response.ok) {
        return response.json().then(data => {
          throw new Error(data.error || `HTTP error ${response.status}`);
        });
      }
      return response.json();
    })
    .catch(error => {
      showToast(error.message, 'danger');
      throw error;
    })
    .finally(() => {
      hideLoading();
    });
}

/**
 * Format a date string in local format
 * @param {string} dateString - ISO date string
 * @returns {string} - Formatted date string
 */
function formatDate(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString();
}

/**
 * Format a file size in human-readable format
 * @param {number} bytes - Size in bytes
 * @returns {string} - Formatted size string
 */
function formatSize(bytes) {
  if (bytes === 0 || bytes === undefined || bytes === null) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

/**
 * Format a duration in human-readable format
 * @param {number} seconds - Duration in seconds
 * @returns {string} - Formatted duration string
 */
function formatDuration(seconds) {
  if (seconds === 0 || seconds === undefined || seconds === null) return '0s';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  let result = '';
  if (hours > 0) result += `${hours}h `;
  if (minutes > 0 || hours > 0) result += `${minutes}m `;
  result += `${remainingSeconds}s`;
  
  return result;
}

/**
 * Capitalize the first letter of a string
 * @param {string} string - Input string
 * @returns {string} - Capitalized string
 */
function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Create a status badge element with appropriate color
 * @param {string} status - Status string
 * @returns {string} - HTML for status badge
 */
function createStatusBadge(status) {
  let badgeClass = 'bg-secondary';
  
  switch (status.toLowerCase()) {
    case 'ok':
    case 'completed':
    case 'success':
      badgeClass = 'bg-success';
      break;
    case 'running':
    case 'pending':
      badgeClass = 'bg-primary';
      break;
    case 'error':
    case 'failed':
      badgeClass = 'bg-danger';
      break;
    case 'warning':
      badgeClass = 'bg-warning';
      break;
    case 'unknown':
      badgeClass = 'bg-secondary';
      break;
  }
  
  return `<span class="badge ${badgeClass}">${status}</span>`;
}

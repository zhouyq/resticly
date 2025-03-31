/**
 * Theme management for Resticly
 * Supports dark and light modes
 */

/**
 * Theme settings
 */
const themeSettings = {
  currentTheme: 'dark', // default theme
  
  // Dark theme colors
  darkTheme: {
    backgroundColor: '#121212',
    textColor: '#e0e0e0',
    primaryColor: '#0d6efd',
    secondaryColor: '#6c757d',
    borderColor: '#495057'
  },
  
  // Light theme colors
  lightTheme: {
    backgroundColor: '#ffffff',
    textColor: '#212529',
    primaryColor: '#0d6efd',
    secondaryColor: '#6c757d',
    borderColor: '#dee2e6'
  }
};

/**
 * Initialize theme functionality
 */
function initializeTheme() {
  // Load theme preference from localStorage
  const savedTheme = localStorage.getItem('resticly_theme');
  if (savedTheme) {
    themeSettings.currentTheme = savedTheme;
  } else {
    // Check for system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      themeSettings.currentTheme = 'dark';
    } else {
      themeSettings.currentTheme = 'light';
    }
  }
  
  // Set theme toggle value if it exists
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.checked = themeSettings.currentTheme === 'dark';
    
    // Remove any existing listeners
    themeToggle.removeEventListener('change', toggleTheme);
    
    // Add change event listener
    themeToggle.addEventListener('change', toggleTheme);
  }
  
  // Set initial theme
  applyTheme();
  
  // Listen for system preference changes
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      // Only change theme automatically if the user hasn't explicitly set a preference
      if (!localStorage.getItem('resticly_theme')) {
        const newTheme = e.matches ? 'dark' : 'light';
        setTheme(newTheme);
      }
    });
  }
}

/**
 * Set the application theme
 * @param {string} theme - Theme name ('dark' or 'light')
 */
function setTheme(theme) {
  themeSettings.currentTheme = theme;
  localStorage.setItem('resticly_theme', theme);
  applyTheme();
  
  // Update toggle if it exists
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.checked = theme === 'dark';
  }
}

// Make setTheme available globally
window.setTheme = setTheme;

/**
 * Apply the current theme to the document
 */
function applyTheme() {
  const isDarkTheme = themeSettings.currentTheme === 'dark';
  
  // Set the document theme
  document.body.setAttribute('data-bs-theme', themeSettings.currentTheme);
  
  // Update theme toggle icon if it exists
  const themeIcon = document.getElementById('themeIcon');
  if (themeIcon) {
    themeIcon.className = isDarkTheme ? 'bi bi-moon-fill' : 'bi bi-sun-fill';
  }
  
  // Update navbar classes - we're now using bg-body-tertiary with data-bs-theme
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    navbar.classList.add('bg-body-tertiary');
  }
  
  // Update footer classes - we're now using bg-body-tertiary with data-bs-theme
  const footer = document.querySelector('.footer');
  if (footer) {
    footer.classList.add('bg-body-tertiary');
  }
  
  // Sync with global app state if it exists
  if (typeof app !== 'undefined') {
    app.darkMode = isDarkTheme;
  }
  
  // Dispatch a custom event for components that need to react to theme changes
  const event = new CustomEvent('themeChanged', { 
    detail: { theme: themeSettings.currentTheme }
  });
  document.dispatchEvent(event);
}

/**
 * Toggle between dark and light themes
 * @param {Event} event - Optional click or change event
 */
function toggleTheme(event) {
  if (event && event.target && event.target.type === 'checkbox') {
    // If triggered by checkbox, use its checked state
    const newTheme = event.target.checked ? 'dark' : 'light';
    setTheme(newTheme);
  } else {
    // Otherwise just toggle the current theme
    const newTheme = themeSettings.currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  }
}

// Make toggleTheme available globally
window.toggleTheme = toggleTheme;

// Initialize when the DOM is ready
document.addEventListener('DOMContentLoaded', initializeTheme);

// Execute this immediately to prevent flash of unstyled content (FOUC)
(function() {
  // Get theme from localStorage
  const savedTheme = localStorage.getItem('resticly_theme');
  const theme = savedTheme || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  
  // Apply theme to body immediately
  document.body.setAttribute('data-bs-theme', theme);

  // Set theme setting for later use
  if (typeof themeSettings !== 'undefined') {
    themeSettings.currentTheme = theme;
  }
  
  // We need to wait for the DOM to be ready to modify navbar and footer
  document.addEventListener('DOMContentLoaded', function() {
    const isDarkTheme = theme === 'dark';
    
    // Update navbar classes - we're now using bg-body-tertiary with data-bs-theme
    const navbar = document.querySelector('.navbar');
    if (navbar) {
      navbar.classList.add('bg-body-tertiary');
    }
    
    // Update footer classes - we're now using bg-body-tertiary with data-bs-theme
    const footer = document.querySelector('.footer');
    if (footer) {
      footer.classList.add('bg-body-tertiary');
    }
  });
})();

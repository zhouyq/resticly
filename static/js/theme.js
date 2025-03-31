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
    
    // Add change event listener
    themeToggle.addEventListener('change', (e) => {
      const newTheme = e.target.checked ? 'dark' : 'light';
      setTheme(newTheme);
    });
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

/**
 * Apply the current theme to the document
 */
function applyTheme() {
  document.body.setAttribute('data-bs-theme', themeSettings.currentTheme);
  
  // Update theme toggle icon if it exists
  const themeIcon = document.getElementById('themeIcon');
  if (themeIcon) {
    themeIcon.className = themeSettings.currentTheme === 'dark' ? 
      'bi bi-moon-fill' : 'bi bi-sun-fill';
  }
  
  // Sync with global app state if it exists
  if (typeof app !== 'undefined') {
    app.darkMode = themeSettings.currentTheme === 'dark';
  }
  
  // Dispatch a custom event for components that need to react to theme changes
  const event = new CustomEvent('themeChanged', { 
    detail: { theme: themeSettings.currentTheme }
  });
  document.dispatchEvent(event);
}

/**
 * Toggle between dark and light themes
 */
function toggleTheme() {
  const newTheme = themeSettings.currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
}

// Initialize when the DOM is ready
document.addEventListener('DOMContentLoaded', initializeTheme);

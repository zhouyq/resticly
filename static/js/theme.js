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
  
  // Set the document theme - this is the main Bootstrap theme attribute
  document.body.setAttribute('data-bs-theme', themeSettings.currentTheme);
  
  // Update theme toggle icon if it exists
  const themeIcon = document.getElementById('themeIcon');
  if (themeIcon) {
    themeIcon.className = isDarkTheme ? 'bi bi-moon-fill' : 'bi bi-sun-fill';
  }
  
  // Update the body background color
  document.body.style.backgroundColor = isDarkTheme ? '#121212' : '#ffffff';
  document.body.style.color = isDarkTheme ? '#e6e6e6' : '#333333';
  
  // Update main content background
  const mainContent = document.querySelector('.main-content');
  if (mainContent) {
    mainContent.style.backgroundColor = isDarkTheme ? '#1e1e1e' : '#f8f9fa';
  }
  
  // Update navbar classes
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    navbar.classList.add('bg-body-tertiary');
    // Add additional custom background colors for better contrast
    navbar.style.backgroundColor = isDarkTheme ? '#212529' : '#f8f9fa';
  }
  
  // Update footer classes
  const footer = document.querySelector('.footer');
  if (footer) {
    footer.classList.add('bg-body-tertiary');
    // Add additional custom background colors for better contrast
    footer.style.backgroundColor = isDarkTheme ? '#212529' : '#f8f9fa';
  }
  
  // Update card backgrounds
  const cards = document.querySelectorAll('.card');
  cards.forEach(card => {
    card.style.backgroundColor = isDarkTheme ? '#2d2d2d' : '#ffffff';
    if (isDarkTheme) {
      card.style.borderColor = '#444';
    } else {
      card.style.borderColor = '#dee2e6';
    }
  });
  
  // Update inputs
  const inputs = document.querySelectorAll('.form-control, .form-select');
  inputs.forEach(input => {
    if (isDarkTheme) {
      input.style.backgroundColor = '#262626';
      input.style.borderColor = '#495057';
      input.style.color = '#e6e6e6';
    } else {
      input.style.backgroundColor = '#ffffff';
      input.style.borderColor = '#ced4da';
      input.style.color = '#333333';
    }
  });
  
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
  
  // Update theme icon immediately
  const themeIcon = document.getElementById('themeIcon');
  if (themeIcon) {
    themeIcon.className = theme === 'dark' ? 'bi bi-moon-fill' : 'bi bi-sun-fill';
  }

  // Set theme setting for later use
  if (typeof themeSettings !== 'undefined') {
    themeSettings.currentTheme = theme;
  }
  
  // We need to wait for the DOM to be ready to modify elements
  document.addEventListener('DOMContentLoaded', function() {
    const isDarkTheme = theme === 'dark';
    
    // Update the body background color
    document.body.style.backgroundColor = isDarkTheme ? '#121212' : '#ffffff';
    document.body.style.color = isDarkTheme ? '#e6e6e6' : '#333333';
    
    // Update main content background
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.style.backgroundColor = isDarkTheme ? '#1e1e1e' : '#f8f9fa';
    }
    
    // Update navbar classes
    const navbar = document.querySelector('.navbar');
    if (navbar) {
      navbar.classList.add('bg-body-tertiary');
      // Add additional custom background colors for better contrast
      navbar.style.backgroundColor = isDarkTheme ? '#212529' : '#f8f9fa';
    }
    
    // Update footer classes
    const footer = document.querySelector('.footer');
    if (footer) {
      footer.classList.add('bg-body-tertiary');
      // Add additional custom background colors for better contrast
      footer.style.backgroundColor = isDarkTheme ? '#212529' : '#f8f9fa';
    }
    
    // Update card backgrounds
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
      card.style.backgroundColor = isDarkTheme ? '#2d2d2d' : '#ffffff';
      if (isDarkTheme) {
        card.style.borderColor = '#444';
      } else {
        card.style.borderColor = '#dee2e6';
      }
    });
    
    // Update inputs
    const inputs = document.querySelectorAll('.form-control, .form-select');
    inputs.forEach(input => {
      if (isDarkTheme) {
        input.style.backgroundColor = '#262626';
        input.style.borderColor = '#495057';
        input.style.color = '#e6e6e6';
      } else {
        input.style.backgroundColor = '#ffffff';
        input.style.borderColor = '#ced4da';
        input.style.color = '#333333';
      }
    });
  });
})();

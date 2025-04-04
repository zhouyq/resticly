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
  // 为文档根添加CSS自定义属性（变量），以便在CSS中使用
  const root = document.documentElement;
  
  // 设置深色主题变量
  root.style.setProperty('--resticly-dark-bg', '#121212');
  root.style.setProperty('--resticly-dark-content-bg', '#1e1e1e');
  root.style.setProperty('--resticly-dark-card-bg', '#2d2d2d');
  root.style.setProperty('--resticly-dark-card-header-bg', '#212529');
  root.style.setProperty('--resticly-dark-input-bg', '#262626');
  root.style.setProperty('--resticly-dark-border', '#444');
  root.style.setProperty('--resticly-dark-text', '#e6e6e6');
  root.style.setProperty('--resticly-dark-text-secondary', 'rgba(255, 255, 255, 0.7)');
  
  // 设置浅色主题变量
  root.style.setProperty('--resticly-light-bg', '#ffffff');
  root.style.setProperty('--resticly-light-content-bg', '#f8f9fa');
  root.style.setProperty('--resticly-light-card-bg', '#ffffff');
  root.style.setProperty('--resticly-light-card-header-bg', '#f8f9fa');
  root.style.setProperty('--resticly-light-input-bg', '#ffffff');
  root.style.setProperty('--resticly-light-border', '#dee2e6');
  root.style.setProperty('--resticly-light-text', '#333333');
  root.style.setProperty('--resticly-light-text-secondary', 'rgba(0, 0, 0, 0.7)');
  
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
    themeIcon.style.color = isDarkTheme ? '#ffffff' : '#000000';
  }
  
  // Update language dropdown button
  const languageDropdown = document.getElementById('languageDropdown');
  if (languageDropdown) {
    if (isDarkTheme) {
      languageDropdown.classList.remove('btn-outline-dark');
      languageDropdown.classList.add('btn-outline-secondary');
    } else {
      languageDropdown.classList.remove('btn-outline-secondary');
      languageDropdown.classList.add('btn-outline-dark');
    }
  }
  
  // Update the body background color
  document.body.style.backgroundColor = isDarkTheme ? '#121212' : '#ffffff';
  document.body.style.color = isDarkTheme ? '#e6e6e6' : '#333333';
  
  // Update main content background
  const mainContent = document.querySelector('.main-content');
  if (mainContent) {
    mainContent.style.backgroundColor = isDarkTheme ? '#1e1e1e' : '#f8f9fa';
  }
  
  // Update navbar classes and ensure proper text contrast
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    // First remove any theme-specific classes
    navbar.classList.remove('navbar-dark', 'navbar-light');
    // Then add the appropriate ones
    navbar.classList.add(isDarkTheme ? 'navbar-dark' : 'navbar-light');
    navbar.classList.add('bg-body-tertiary');
    
    // Add additional custom background colors for better contrast
    navbar.style.backgroundColor = isDarkTheme ? '#212529' : '#f8f9fa';
    
    // Ensure proper text colors for all navbar elements
    const navLinks = navbar.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.style.color = isDarkTheme ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)';
    });
    
    const navbarBrand = navbar.querySelector('.navbar-brand');
    if (navbarBrand) {
      navbarBrand.style.color = isDarkTheme ? '#ffffff' : '#000000';
    }
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
    
    // Update card-header elements inside this card
    const cardHeaders = card.querySelectorAll('.card-header');
    cardHeaders.forEach(header => {
      header.style.backgroundColor = isDarkTheme ? '#212529' : '#f8f9fa';
      header.style.borderColor = isDarkTheme ? '#444' : '#dee2e6';
      header.style.color = isDarkTheme ? '#e6e6e6' : '#333333';
    });
    
    // Update text colors in card bodies
    const cardTexts = card.querySelectorAll('.card-title, .card-text, .card-body');
    cardTexts.forEach(text => {
      text.style.color = isDarkTheme ? '#e6e6e6' : '#333333';
    });
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
  
  // Update tables for better contrast
  const tables = document.querySelectorAll('.table');
  tables.forEach(table => {
    if (isDarkTheme) {
      table.classList.add('table-dark');
      table.classList.remove('table-light');
    } else {
      table.classList.add('table-light');
      table.classList.remove('table-dark');
    }
    
    // Update table cells and headers
    const tableCells = table.querySelectorAll('td, th');
    tableCells.forEach(cell => {
      cell.style.color = isDarkTheme ? '#e6e6e6' : '#333333';
      cell.style.borderColor = isDarkTheme ? '#444' : '#dee2e6';
    });
  });
  
  // Update buttons for better visibility
  const buttons = document.querySelectorAll('.btn');
  buttons.forEach(button => {
    // Skip buttons that already have specific colors
    if (!button.classList.contains('btn-primary') && 
        !button.classList.contains('btn-success') && 
        !button.classList.contains('btn-danger') && 
        !button.classList.contains('btn-warning') && 
        !button.classList.contains('btn-info')) {
      
      // For outline buttons in light mode, ensure good contrast
      if (button.classList.contains('btn-outline-secondary') && !isDarkTheme) {
        button.classList.remove('btn-outline-secondary');
        button.classList.add('btn-outline-dark');
      }
      
      // For outline buttons in dark mode
      if (button.classList.contains('btn-outline-dark') && isDarkTheme) {
        button.classList.remove('btn-outline-dark');
        button.classList.add('btn-outline-secondary');
      }
    }
  });
  
  // Update list groups
  const listGroups = document.querySelectorAll('.list-group-item');
  listGroups.forEach(item => {
    item.style.backgroundColor = isDarkTheme ? '#2d2d2d' : '#ffffff';
    item.style.borderColor = isDarkTheme ? '#444' : '#dee2e6';
    item.style.color = isDarkTheme ? '#e6e6e6' : '#333333';
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
  // 为文档根添加CSS自定义属性（变量），以便在CSS中使用
  const root = document.documentElement;
  
  // 设置深色主题变量
  root.style.setProperty('--resticly-dark-bg', '#121212');
  root.style.setProperty('--resticly-dark-content-bg', '#1e1e1e');
  root.style.setProperty('--resticly-dark-card-bg', '#2d2d2d');
  root.style.setProperty('--resticly-dark-card-header-bg', '#212529');
  root.style.setProperty('--resticly-dark-input-bg', '#262626');
  root.style.setProperty('--resticly-dark-border', '#444');
  root.style.setProperty('--resticly-dark-text', '#e6e6e6');
  root.style.setProperty('--resticly-dark-text-secondary', 'rgba(255, 255, 255, 0.7)');
  
  // 设置浅色主题变量
  root.style.setProperty('--resticly-light-bg', '#ffffff');
  root.style.setProperty('--resticly-light-content-bg', '#f8f9fa');
  root.style.setProperty('--resticly-light-card-bg', '#ffffff');
  root.style.setProperty('--resticly-light-card-header-bg', '#f8f9fa');
  root.style.setProperty('--resticly-light-input-bg', '#ffffff');
  root.style.setProperty('--resticly-light-border', '#dee2e6');
  root.style.setProperty('--resticly-light-text', '#333333');
  root.style.setProperty('--resticly-light-text-secondary', 'rgba(0, 0, 0, 0.7)');
  
  // Get theme from localStorage
  const savedTheme = localStorage.getItem('resticly_theme');
  const theme = savedTheme || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  
  // Apply theme to body immediately
  document.body.setAttribute('data-bs-theme', theme);
  
  // Update theme icon immediately
  const themeIcon = document.getElementById('themeIcon');
  if (themeIcon) {
    themeIcon.className = theme === 'dark' ? 'bi bi-moon-fill' : 'bi bi-sun-fill';
    themeIcon.style.color = theme === 'dark' ? '#ffffff' : '#000000';
  }
  
  // Update language dropdown button
  const languageDropdown = document.getElementById('languageDropdown');
  if (languageDropdown) {
    if (theme === 'dark') {
      languageDropdown.classList.remove('btn-outline-dark');
      languageDropdown.classList.add('btn-outline-secondary');
    } else {
      languageDropdown.classList.remove('btn-outline-secondary');
      languageDropdown.classList.add('btn-outline-dark');
    }
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
    
    // Update navbar classes and ensure proper text contrast
    const navbar = document.querySelector('.navbar');
    if (navbar) {
      // First remove any theme-specific classes
      navbar.classList.remove('navbar-dark', 'navbar-light');
      // Then add the appropriate ones
      navbar.classList.add(isDarkTheme ? 'navbar-dark' : 'navbar-light');
      navbar.classList.add('bg-body-tertiary');
      
      // Add additional custom background colors for better contrast
      navbar.style.backgroundColor = isDarkTheme ? '#212529' : '#f8f9fa';
      
      // Ensure proper text colors for all navbar elements
      const navLinks = navbar.querySelectorAll('.nav-link');
      navLinks.forEach(link => {
        link.style.color = isDarkTheme ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)';
      });
      
      const navbarBrand = navbar.querySelector('.navbar-brand');
      if (navbarBrand) {
        navbarBrand.style.color = isDarkTheme ? '#ffffff' : '#000000';
      }
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
      
      // Update card-header elements inside this card
      const cardHeaders = card.querySelectorAll('.card-header');
      cardHeaders.forEach(header => {
        header.style.backgroundColor = isDarkTheme ? '#212529' : '#f8f9fa';
        header.style.borderColor = isDarkTheme ? '#444' : '#dee2e6';
        header.style.color = isDarkTheme ? '#e6e6e6' : '#333333';
      });
      
      // Update text colors in card bodies
      const cardTexts = card.querySelectorAll('.card-title, .card-text, .card-body');
      cardTexts.forEach(text => {
        text.style.color = isDarkTheme ? '#e6e6e6' : '#333333';
      });
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
    
    // Update tables for better contrast
    const tables = document.querySelectorAll('.table');
    tables.forEach(table => {
      if (isDarkTheme) {
        table.classList.add('table-dark');
        table.classList.remove('table-light');
      } else {
        table.classList.add('table-light');
        table.classList.remove('table-dark');
      }
      
      // Update table cells and headers
      const tableCells = table.querySelectorAll('td, th');
      tableCells.forEach(cell => {
        cell.style.color = isDarkTheme ? '#e6e6e6' : '#333333';
        cell.style.borderColor = isDarkTheme ? '#444' : '#dee2e6';
      });
    });
    
    // Update buttons for better visibility
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
      // Skip buttons that already have specific colors
      if (!button.classList.contains('btn-primary') && 
          !button.classList.contains('btn-success') && 
          !button.classList.contains('btn-danger') && 
          !button.classList.contains('btn-warning') && 
          !button.classList.contains('btn-info')) {
        
        // For outline buttons in light mode, ensure good contrast
        if (button.classList.contains('btn-outline-secondary') && !isDarkTheme) {
          button.classList.remove('btn-outline-secondary');
          button.classList.add('btn-outline-dark');
        }
        
        // For outline buttons in dark mode
        if (button.classList.contains('btn-outline-dark') && isDarkTheme) {
          button.classList.remove('btn-outline-dark');
          button.classList.add('btn-outline-secondary');
        }
      }
    });
    
    // Update list groups
    const listGroups = document.querySelectorAll('.list-group-item');
    listGroups.forEach(item => {
      item.style.backgroundColor = isDarkTheme ? '#2d2d2d' : '#ffffff';
      item.style.borderColor = isDarkTheme ? '#444' : '#dee2e6';
      item.style.color = isDarkTheme ? '#e6e6e6' : '#333333';
    });
  });
})();

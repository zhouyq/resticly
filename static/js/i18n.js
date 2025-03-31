/**
 * Internationalization (i18n) support for Resticly
 */

/**
 * Load translations for a specific language
 * @param {string} language - Language code (e.g., 'en', 'zh')
 * @returns {Promise} - Resolves to translations object
 */
function loadTranslations(language) {
  return fetch(`/static/locales/${language}.json`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to load translations for ${language}`);
      }
      return response.json();
    });
}

/**
 * Translate the page using data-i18n attributes
 * @param {Object} translations - Translations object
 */
function translatePageElements(translations) {
  const elements = document.querySelectorAll('[data-i18n]');
  
  elements.forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (translations[key]) {
      element.textContent = translations[key];
    }
  });
  
  // Also translate placeholder attributes
  const placeholders = document.querySelectorAll('[data-i18n-placeholder]');
  placeholders.forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    if (translations[key]) {
      element.setAttribute('placeholder', translations[key]);
    }
  });
  
  // Also translate button and title attributes
  const titles = document.querySelectorAll('[data-i18n-title]');
  titles.forEach(element => {
    const key = element.getAttribute('data-i18n-title');
    if (translations[key]) {
      element.setAttribute('title', translations[key]);
    }
  });
}

/**
 * Get browser language preference
 * @returns {string} - Language code
 */
function getBrowserLanguage() {
  const nav = window.navigator;
  const browserLang = (nav.languages && nav.languages[0]) || 
                       nav.language || 
                       nav.userLanguage || 
                       nav.browserLanguage || 
                       'en';
  
  // Return 'zh' for any Chinese variant, 'en' for everything else
  if (browserLang.startsWith('zh')) {
    return 'zh';
  }
  return 'en';
}

/**
 * Set application language
 * @param {string} language - Language code to set
 */
function setLanguage(language) {
  localStorage.setItem('resticly_language', language);
  loadTranslations(language)
    .then(translations => {
      translatePageElements(translations);
    })
    .catch(error => {
      console.error('Error setting language:', error);
      // If failed, try to fall back to English
      if (language !== 'en') {
        setLanguage('en');
      }
    });
}

/**
 * Initialize i18n functionality
 */
function initializeI18n() {
  // Load language preference from localStorage or use browser preference
  const savedLanguage = localStorage.getItem('resticly_language') || getBrowserLanguage();
  
  // Set language selector value if it exists
  const languageSelector = document.getElementById('languageSelector');
  if (languageSelector) {
    languageSelector.value = savedLanguage;
    
    // Add change event listener
    languageSelector.addEventListener('change', (e) => {
      setLanguage(e.target.value);
    });
  }
  
  // Set initial language
  setLanguage(savedLanguage);
}

// Initialize when the DOM is ready
document.addEventListener('DOMContentLoaded', initializeI18n);

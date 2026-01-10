// ============================================
// SKYNET ISP - Configuration
// ============================================

const CONFIG = {
    // API Base URL
    API_URL: 'https://skynet-backend-a47423108e2a.herokuapp.com/api',
    
    // App Info
    APP_NAME: 'Skynet ISP',
    APP_VERSION: '1.0.0',
    
    // Storage Keys
    STORAGE_TOKEN: 'skynet_token',
    STORAGE_USER: 'skynet_user',
    STORAGE_THEME: 'skynet_theme',
    
    // Pagination
    DEFAULT_PAGE_SIZE: 20,
    
    // Dates
    DATE_FORMAT: 'es-MX',
    
    // Currency
    CURRENCY: 'MXN',
    CURRENCY_LOCALE: 'es-MX',
    
    // Upload limits
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/jpg'],
    
    // Toast duration (ms)
    TOAST_DURATION: 4000,
    
    // Debounce delay (ms)
    DEBOUNCE_DELAY: 300
};

// Freeze config to prevent modifications
Object.freeze(CONFIG);

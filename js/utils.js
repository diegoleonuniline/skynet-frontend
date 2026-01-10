// ============================================
// SKYNET ISP - Utilities
// ============================================

const Utils = {
    // ============================================
    // FORMATTERS
    // ============================================
    
    formatCurrency(amount) {
        if (amount === null || amount === undefined) return '$0.00';
        return new Intl.NumberFormat(CONFIG.CURRENCY_LOCALE, {
            style: 'currency',
            currency: CONFIG.CURRENCY
        }).format(amount);
    },
    
    formatDate(date, options = {}) {
        if (!date) return '-';
        const d = new Date(date);
        if (isNaN(d.getTime())) return '-';
        
        const defaultOptions = {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            ...options
        };
        
        return d.toLocaleDateString(CONFIG.DATE_FORMAT, defaultOptions);
    },
    
    formatDateTime(date) {
        if (!date) return '-';
        const d = new Date(date);
        if (isNaN(d.getTime())) return '-';
        
        return d.toLocaleDateString(CONFIG.DATE_FORMAT, {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    formatRelativeDate(date) {
        if (!date) return '-';
        const d = new Date(date);
        const now = new Date();
        const diff = Math.floor((d - now) / (1000 * 60 * 60 * 24));
        
        if (diff === 0) return 'Hoy';
        if (diff === 1) return 'Mañana';
        if (diff === -1) return 'Ayer';
        if (diff > 1 && diff <= 7) return `En ${diff} días`;
        if (diff < -1 && diff >= -7) return `Hace ${Math.abs(diff)} días`;
        
        return this.formatDate(date);
    },
    
    formatPhone(phone) {
        if (!phone) return '-';
        // Remove non-numeric chars
        const cleaned = phone.replace(/\D/g, '');
        // Format as (XX) XXXX-XXXX or XX-XXXX-XXXX
        if (cleaned.length === 10) {
            return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
        }
        return phone;
    },
    
    // ============================================
    // STRING HELPERS
    // ============================================
    
    capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    },
    
    getInitials(name, lastname = '') {
        const first = name ? name.charAt(0).toUpperCase() : '';
        const last = lastname ? lastname.charAt(0).toUpperCase() : '';
        return first + last || '?';
    },
    
    truncate(str, length = 50) {
        if (!str) return '';
        if (str.length <= length) return str;
        return str.slice(0, length) + '...';
    },
    
    slugify(str) {
        return str
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');
    },
    
    // ============================================
    // NUMBER HELPERS
    // ============================================
    
    parseNumber(value) {
        if (typeof value === 'number') return value;
        if (!value) return 0;
        return parseFloat(value.toString().replace(/[^0-9.-]/g, '')) || 0;
    },
    
    // ============================================
    // VALIDATION
    // ============================================
    
    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },
    
    isValidPhone(phone) {
        const cleaned = phone.replace(/\D/g, '');
        return cleaned.length >= 10;
    },
    
    // ============================================
    // DOM HELPERS
    // ============================================
    
    $(selector) {
        return document.querySelector(selector);
    },
    
    $$(selector) {
        return document.querySelectorAll(selector);
    },
    
    createElement(tag, attributes = {}, children = []) {
        const el = document.createElement(tag);
        
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                el.className = value;
            } else if (key === 'innerHTML') {
                el.innerHTML = value;
            } else if (key === 'textContent') {
                el.textContent = value;
            } else if (key.startsWith('on')) {
                el.addEventListener(key.slice(2).toLowerCase(), value);
            } else if (key === 'dataset') {
                Object.entries(value).forEach(([dataKey, dataValue]) => {
                    el.dataset[dataKey] = dataValue;
                });
            } else {
                el.setAttribute(key, value);
            }
        });
        
        children.forEach(child => {
            if (typeof child === 'string') {
                el.appendChild(document.createTextNode(child));
            } else if (child instanceof Node) {
                el.appendChild(child);
            }
        });
        
        return el;
    },
    
    // ============================================
    // ASYNC HELPERS
    // ============================================
    
    debounce(func, wait = CONFIG.DEBOUNCE_DELAY) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    // ============================================
    // STORAGE
    // ============================================
    
    storage: {
        get(key) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : null;
            } catch {
                return null;
            }
        },
        
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (e) {
                console.error('Storage error:', e);
            }
        },
        
        remove(key) {
            localStorage.removeItem(key);
        },
        
        clear() {
            localStorage.clear();
        }
    },
    
    // ============================================
    // URL & QUERY PARAMS
    // ============================================
    
    getHashParams() {
        const hash = window.location.hash.slice(1);
        const [path, query] = hash.split('?');
        const params = new URLSearchParams(query || '');
        return { path: path || '/', params };
    },
    
    buildQueryString(params) {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                searchParams.append(key, value);
            }
        });
        return searchParams.toString();
    },
    
    // ============================================
    // FILE HELPERS
    // ============================================
    
    formatFileSize(bytes) {
        if (!bytes) return '0 B';
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
    },
    
    isValidImageFile(file) {
        return CONFIG.ALLOWED_IMAGE_TYPES.includes(file.type) && 
               file.size <= CONFIG.MAX_FILE_SIZE;
    },
    
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    },
    
    // ============================================
    // CLIPBOARD
    // ============================================
    
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            // Fallback
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            return true;
        }
    },
    
    // ============================================
    // MISC
    // ============================================
    
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },
    
    isEmpty(value) {
        if (value === null || value === undefined) return true;
        if (typeof value === 'string') return value.trim() === '';
        if (Array.isArray(value)) return value.length === 0;
        if (typeof value === 'object') return Object.keys(value).length === 0;
        return false;
    }
};

// Shorthand
const $ = Utils.$;
const $$ = Utils.$$;
const debounce = Utils.debounce.bind(Utils);

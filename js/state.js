// ============================================
// SKYNET ISP - State Management
// ============================================

const State = {
    // Current state
    user: null,
    theme: 'light',
    catalogos: {},
    
    // ============================================
    // INITIALIZATION
    // ============================================
    
    init() {
        // Load theme
        this.theme = Utils.storage.get(CONFIG.STORAGE_THEME) || 'light';
        this.applyTheme();
        
        // Load user from storage
        const storedUser = Utils.storage.get(CONFIG.STORAGE_USER);
        const token = Utils.storage.get(CONFIG.STORAGE_TOKEN);
        
        if (storedUser && token) {
            this.user = storedUser;
        }
    },
    
    // ============================================
    // AUTH
    // ============================================
    
    isAuthenticated() {
        return !!this.user && !!Utils.storage.get(CONFIG.STORAGE_TOKEN);
    },
    
    async login(username, password) {
        const response = await API.auth.login(username, password);
        
        if (response.success) {
            this.user = response.data.user;
            Utils.storage.set(CONFIG.STORAGE_TOKEN, response.data.token);
            Utils.storage.set(CONFIG.STORAGE_USER, response.data.user);
        }
        
        return response;
    },
    
    async logout() {
        try {
            await API.auth.logout();
        } catch (e) {
            console.error('Logout error:', e);
        }
        
        this.user = null;
        Utils.storage.remove(CONFIG.STORAGE_TOKEN);
        Utils.storage.remove(CONFIG.STORAGE_USER);
    },
    
    hasPermission(modulo, accion) {
        if (!this.user) return false;
        if (this.user.rol === 'ADMIN') return true;
        
        const userPermisos = Utils.storage.get('skynet_permisos') || [];
        return userPermisos.some(p => p.modulo === modulo && p.accion === accion);
    },
    
    isAdmin() {
        return this.user?.rol === 'ADMIN';
    },
    
    // ============================================
    // THEME
    // ============================================
    
    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        Utils.storage.set(CONFIG.STORAGE_THEME, this.theme);
        this.applyTheme();
    },
    
    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
    },
    
    // ============================================
    // CATALOGOS CACHE
    // ============================================
    
    async getCatalogo(nombre, forceRefresh = false) {
        if (this.catalogos[nombre] && !forceRefresh) {
            return this.catalogos[nombre];
        }
        
        const methodMap = {
            'roles': 'getRoles',
            'estados': 'getEstados',
            'ciudades': 'getCiudades',
            'colonias': 'getColonias',
            'zonas': 'getZonas',
            'bancos': 'getBancos',
            'metodosPago': 'getMetodosPago',
            'conceptosCobro': 'getConceptosCobro',
            'cargosTipo': 'getCargosTipo',
            'tarifas': 'getTarifas',
            'estatusCliente': 'getEstatusCliente',
            'estatusServicio': 'getEstatusServicio',
            'tipoEquipo': 'getTipoEquipo',
            'marcasEquipo': 'getMarcasEquipo',
            'modelosEquipo': 'getModelosEquipo',
            'motivosCancelacion': 'getMotivosCancelacion'
        };
        
        const method = methodMap[nombre];
        if (!method) {
            console.error('Catálogo no encontrado:', nombre);
            return [];
        }
        
        try {
            const response = await API.catalogos[method]();
            if (response.success) {
                this.catalogos[nombre] = response.data;
                return response.data;
            }
        } catch (error) {
            console.error(`Error loading catalogo ${nombre}:`, error);
        }
        
        return [];
    },
    
    async preloadCatalogos() {
        const catalogosToLoad = [
            'estados', 'ciudades', 'zonas', 'tarifas', 
            'estatusCliente', 'estatusServicio', 'tipoEquipo',
            'marcasEquipo', 'metodosPago', 'bancos', 'conceptosCobro'
        ];
        
        await Promise.all(catalogosToLoad.map(c => this.getCatalogo(c)));
    },
    
    // Clear all cached catalogos
    clearCatalogos() {
        this.catalogos = {};
    }
};

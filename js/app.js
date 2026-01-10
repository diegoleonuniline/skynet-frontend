// ============================================
// SKYNET ISP - Main Application
// Router & Initialization
// ============================================

const App = {
    currentView: null,
    
    // ============================================
    // ROUTES
    // ============================================
    routes: {
        '/login': {
            view: LoginView,
            title: 'Iniciar Sesión',
            requiresAuth: false,
            layout: 'none'
        },
        '/clientes': {
            view: ClientesView,
            title: 'Clientes',
            requiresAuth: true,
            layout: 'app'
        },
        '/cliente/:id/editar': {
            view: ClienteDetalleView,
            title: 'Editar Cliente',
            requiresAuth: true,
            layout: 'app'
        },
        '/cliente/:id': {
            view: ClienteDetalleView,
            title: 'Detalle Cliente',
            requiresAuth: true,
            layout: 'app'
        }
    },
    
    // ============================================
    // INITIALIZATION
    // ============================================
    
    init() {
        State.init();
        window.addEventListener('hashchange', () => this.handleRoute());
        this.handleRoute();
        
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.dropdown')) {
                $$('.dropdown.active').forEach(d => d.classList.remove('active'));
                $$('.dropdown-menu.show').forEach(d => d.classList.remove('show'));
            }
        });
    },
    
    // ============================================
    // ROUTER
    // ============================================
    
    handleRoute() {
        const { path, params } = Utils.getHashParams();
        
        let route = null;
        let routeParams = {};
        
        for (const [pattern, config] of Object.entries(this.routes)) {
            const match = this.matchRoute(pattern, path);
            if (match) {
                route = config;
                routeParams = match;
                break;
            }
        }
        
        if (!route) {
            if (State.isAuthenticated()) {
                window.location.hash = '#/clientes';
            } else {
                window.location.hash = '#/login';
            }
            return;
        }
        
        if (route.requiresAuth && !State.isAuthenticated()) {
            window.location.hash = '#/login';
            return;
        }
        
        if (path === '/login' && State.isAuthenticated()) {
            window.location.hash = '#/clientes';
            return;
        }
        
        this.renderLayout(route.layout);
        this.renderView(route.view, routeParams);
        document.title = `${route.title} | ${CONFIG.APP_NAME}`;
    },
    
    matchRoute(pattern, path) {
        const patternParts = pattern.split('/');
        const pathParts = path.split('/');
        
        if (patternParts.length !== pathParts.length) {
            return null;
        }
        
        const params = {};
        
        for (let i = 0; i < patternParts.length; i++) {
            if (patternParts[i].startsWith(':')) {
                params[patternParts[i].slice(1)] = pathParts[i];
            } else if (patternParts[i] !== pathParts[i]) {
                return null;
            }
        }
        
        return params;
    },
    
    // ============================================
    // LAYOUT
    // ============================================
    
    renderLayout(layout) {
        const app = $('#app');
        
        if (layout === 'none') {
            app.innerHTML = '<div id="view-container"></div>';
            return;
        }
        
        if (layout === 'app' && !$('.sidebar')) {
            app.innerHTML = `
                <aside class="sidebar">
                    <div class="sidebar-header">
                        <div class="sidebar-logo">S</div>
                        <div class="sidebar-brand">
                            <h1>SKYNET</h1>
                            <span>ISP Management</span>
                        </div>
                    </div>
                    
                    <nav class="sidebar-nav">
                        <div class="nav-section">
                            <div class="nav-section-title">Principal</div>
                            <a href="#/dashboard" class="nav-item" data-route="/dashboard">
                                ${ICONS.dashboard}
                                <span>Dashboard</span>
                            </a>
                            <a href="#/clientes" class="nav-item" data-route="/clientes">
                                ${ICONS.users}
                                <span>Clientes</span>
                            </a>
                            <a href="#/inventario" class="nav-item" data-route="/inventario">
                                ${ICONS.inventory}
                                <span>Inventario</span>
                            </a>
                            <a href="#/cobranza" class="nav-item" data-route="/cobranza">
                                ${ICONS.billing}
                                <span>Cobranza</span>
                            </a>
                        </div>
                        
                        <div class="nav-section">
                            <div class="nav-section-title">Configuración</div>
                            <a href="#/catalogos" class="nav-item" data-route="/catalogos">
                                ${ICONS.settings}
                                <span>Catálogos</span>
                            </a>
                            <a href="#/usuarios" class="nav-item" data-route="/usuarios">
                                ${ICONS.users}
                                <span>Usuarios</span>
                            </a>
                        </div>
                    </nav>
                    
                    <div class="sidebar-footer">
                        <a href="#/clientes" class="nav-item" onclick="App.openNewClientModal(event)">
                            ${ICONS.userPlus}
                            <span>Nuevo Cliente</span>
                        </a>
                    </div>
                </aside>
                
                <div class="main-wrapper">
                    <header class="main-header">
                        <div class="header-left">
                            <button class="btn btn-ghost btn-icon d-none" id="menu-toggle" onclick="App.toggleSidebar()">
                                ${ICONS.menu}
                            </button>
                            <div class="header-search">
                                ${ICONS.search}
                                <input type="text" placeholder="Buscar clientes..." id="global-search">
                            </div>
                        </div>
                        
                        <div class="header-right">
                            <button class="header-icon-btn" onclick="State.toggleTheme(); App.updateThemeIcon();" title="Cambiar tema">
                                <span id="header-theme-icon">${State.theme === 'light' ? ICONS.moon : ICONS.sun}</span>
                            </button>
                            <button class="header-icon-btn" title="Notificaciones">
                                ${ICONS.bell}
                                <span class="badge"></span>
                            </button>
                            
                            <div class="dropdown">
                                <div class="user-menu" onclick="Components.dropdown.toggle(this)">
                                    <div class="user-info">
                                        <div class="user-name">${State.user?.nombre || 'Usuario'}</div>
                                        <div class="user-role">${State.user?.rol || 'Admin'}</div>
                                    </div>
                                    <div class="user-avatar">
                                        ${Utils.getInitials(State.user?.nombre || 'U', '')}
                                    </div>
                                </div>
                                <div class="dropdown-menu">
                                    <div class="dropdown-item" onclick="App.openProfileModal()">
                                        ${ICONS.user}
                                        Mi Perfil
                                    </div>
                                    <div class="dropdown-item" onclick="App.openChangePasswordModal()">
                                        ${ICONS.lock}
                                        Cambiar Contraseña
                                    </div>
                                    <div class="dropdown-divider"></div>
                                    <div class="dropdown-item danger" onclick="App.logout()">
                                        ${ICONS.logout}
                                        Cerrar Sesión
                                    </div>
                                </div>
                            </div>
                        </div>
                    </header>
                    
                    <main class="main-content" id="view-container">
                    </main>
                </div>
            `;
            
            this.setupGlobalSearch();
        }
        
        this.updateActiveNav();
    },
    
    updateActiveNav() {
        const { path } = Utils.getHashParams();
        
        $$('.nav-item').forEach(item => {
            item.classList.remove('active');
            const route = item.dataset.route;
            if (route && path.startsWith(route)) {
                item.classList.add('active');
            }
        });
    },
    
    updateThemeIcon() {
        const icon = $('#header-theme-icon');
        if (icon) {
            icon.innerHTML = State.theme === 'light' ? ICONS.moon : ICONS.sun;
        }
    },
    
    setupGlobalSearch() {
        const searchInput = $('#global-search');
        if (!searchInput) return;
        
        searchInput.addEventListener('input', Utils.debounce(async (e) => {
            const query = e.target.value.trim();
            if (query.length < 2) return;
            
            try {
                const response = await API.clientes.search(query);
                if (response.success && response.data.length > 0) {
                    this.showSearchResults(response.data);
                }
            } catch (error) {
                console.error('Search error:', error);
            }
        }, 400));
        
        searchInput.addEventListener('focus', () => {
            const results = $('#search-results');
            if (results && results.children.length > 0) {
                results.style.display = 'block';
            }
        });
        
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.header-search')) {
                const results = $('#search-results');
                if (results) results.style.display = 'none';
            }
        });
    },
    
    showSearchResults(clientes) {
        let resultsDiv = $('#search-results');
        
        if (!resultsDiv) {
            resultsDiv = Utils.createElement('div', {
                id: 'search-results',
                className: 'dropdown-menu',
                style: 'position: absolute; top: 100%; left: 0; right: 0; max-height: 300px; overflow-y: auto;'
            });
            $('.header-search').appendChild(resultsDiv);
            $('.header-search').style.position = 'relative';
        }
        
        resultsDiv.innerHTML = clientes.slice(0, 8).map(c => `
            <div class="dropdown-item" onclick="window.location.hash = '#/cliente/${c.id}'">
                <div class="d-flex align-center gap-2">
                    <div class="avatar avatar-sm">${Utils.getInitials(c.nombre, c.apellido_paterno)}</div>
                    <div>
                        <div class="font-medium">${c.nombre} ${c.apellido_paterno || ''}</div>
                        <div class="text-xs text-muted">${c.codigo} | ${c.telefono1 || 'Sin teléfono'}</div>
                    </div>
                </div>
            </div>
        `).join('');
        
        resultsDiv.style.display = 'block';
    },
    
    toggleSidebar() {
        $('.sidebar').classList.toggle('open');
    },
    
    // ============================================
    // VIEW RENDERING
    // ============================================
    
    async renderView(view, params) {
        const container = $('#view-container');
        if (!container) return;
        
        this.currentView = view;
        container.innerHTML = view.render(params);
        
        if (view.init) {
            await view.init(params.id || params);
        }
    },
    
    // ============================================
    // GLOBAL ACTIONS
    // ============================================
    
    async logout() {
        Components.modal.confirm({
            title: '¿Cerrar sesión?',
            message: 'Tu sesión actual será cerrada.',
            confirmText: 'Sí, salir',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await State.logout();
                    Components.toast.info('Sesión cerrada');
                    window.location.hash = '#/login';
                } catch (error) {
                    console.error('Logout error:', error);
                    window.location.hash = '#/login';
                }
            }
        });
    },
    
    openNewClientModal(e) {
        e.preventDefault();
        if (typeof ClientesView !== 'undefined') {
            ClientesView.openCreateModal();
        }
    },
    
    openProfileModal() {
        Components.modal.form({
            title: 'Mi Perfil',
            data: State.user,
            fields: [
                { type: 'text', name: 'nombre', label: 'Nombre', required: true },
                { type: 'text', name: 'email', label: 'Email', required: true },
                { type: 'text', name: 'username', label: 'Usuario', disabled: true }
            ],
            submitText: 'Guardar',
            onSubmit: async (data) => {
                Components.toast.info('Función en desarrollo');
                Components.modal.hide();
            }
        });
    },
    
    openChangePasswordModal() {
        Components.modal.form({
            title: 'Cambiar Contraseña',
            fields: [
                { type: 'password', name: 'password_actual', label: 'Contraseña Actual', required: true },
                { type: 'password', name: 'password_nuevo', label: 'Nueva Contraseña', required: true },
                { type: 'password', name: 'password_confirmar', label: 'Confirmar Nueva Contraseña', required: true }
            ],
            submitText: 'Cambiar Contraseña',
            onSubmit: async (data) => {
                if (data.password_nuevo !== data.password_confirmar) {
                    Components.toast.error('Las contraseñas no coinciden');
                    return;
                }
                
                try {
                    Components.loader.show();
                    const response = await API.auth.changePassword(data.password_actual, data.password_nuevo);
                    if (response.success) {
                        Components.toast.success('Contraseña actualizada');
                        Components.modal.hide();
                    }
                } catch (error) {
                    Components.toast.error(error.message);
                } finally {
                    Components.loader.hide();
                }
            }
        });
    }
};

// ============================================
// INITIALIZE APP
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

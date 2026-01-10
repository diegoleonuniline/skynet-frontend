// ============================================
// SKYNET ISP - Login View
// ============================================

const LoginView = {
    render() {
        return `
            <div class="login-page">
                <!-- Header -->
                <header class="login-header">
                    <div class="login-header-brand">
                        <svg class="login-logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M12 6v6l4 2"/>
                        </svg>
                        <span class="login-logo-text">Skynet</span>
                    </div>
                    <nav class="login-header-nav">
                        <a href="#" class="login-nav-link">Soporte</a>
                        <a href="#" class="login-nav-link">Documentación</a>
                        <button class="login-nav-btn" onclick="LoginView.toggleTheme()">
                            <span id="theme-icon">${State.theme === 'dark' ? ICONS.sun : ICONS.moon}</span>
                        </button>
                    </nav>
                </header>

                <!-- Main Content -->
                <main class="login-main">
                    <div class="login-card">
                        <!-- Logo Icon -->
                        <div class="login-card-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="M12 6v6l4 2"/>
                            </svg>
                        </div>

                        <!-- Title -->
                        <h1 class="login-card-title">Bienvenido a Skynet</h1>
                        <p class="login-card-subtitle">Portal Administrativo ISP</p>

                        <!-- Form -->
                        <form id="login-form" class="login-form">
                            <div class="login-field">
                                <label class="login-label">Usuario</label>
                                <div class="login-input-wrapper">
                                    <span class="login-input-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                            <circle cx="12" cy="7" r="4"/>
                                        </svg>
                                    </span>
                                    <input type="text" name="username" class="login-input" 
                                           placeholder="Ingresa tu usuario" required autofocus>
                                </div>
                            </div>

                            <div class="login-field">
                                <label class="login-label">Contraseña</label>
                                <div class="login-input-wrapper">
                                    <span class="login-input-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                        </svg>
                                    </span>
                                    <input type="password" name="password" class="login-input" 
                                           placeholder="Ingresa tu contraseña" required>
                                    <button type="button" class="login-input-toggle" onclick="LoginView.togglePassword(this)">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                            <circle cx="12" cy="12" r="3"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <div class="login-options">
                                <label class="login-checkbox">
                                    <input type="checkbox" name="remember">
                                    <span class="login-checkbox-mark"></span>
                                    <span>Mantener sesión iniciada</span>
                                </label>
                                <a href="#" class="login-forgot">¿Olvidaste tu contraseña?</a>
                            </div>

                            <div id="login-error" class="login-error"></div>

                            <button type="submit" class="login-submit">
                                <span class="login-submit-text">Iniciar Sesión</span>
                                <span class="login-submit-loader"></span>
                            </button>
                        </form>

                        <!-- Secure Badge -->
                        <div class="login-secure">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            <span>ACCESO ADMINISTRATIVO SEGURO</span>
                        </div>
                    </div>
                </main>

                <!-- Footer -->
                <footer class="login-footer">
                    <p>© 2025 Skynet Systems. Todos los derechos reservados. Versión ${CONFIG.APP_VERSION}</p>
                </footer>
            </div>
        `;
    },
    
    init() {
        const form = $('#login-form');
        if (!form) return;
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = form.username.value.trim();
            const password = form.password.value;
            const submitBtn = form.querySelector('.login-submit');
            
            if (!username || !password) {
                this.showError('Ingresa usuario y contraseña');
                return;
            }
            
            try {
                submitBtn.classList.add('loading');
                submitBtn.disabled = true;
                this.hideError();
                
                const response = await State.login(username, password);
                
                if (response.success) {
                    await State.preloadCatalogos();
                    Components.toast.success('Bienvenido ' + response.data.user.nombre);
                    window.location.hash = '#/clientes';
                } else {
                    this.showError(response.message || 'Credenciales incorrectas');
                }
            } catch (error) {
                this.showError(error.message || 'Error de conexión con el servidor');
            } finally {
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
            }
        });
    },

    showError(message) {
        const errorDiv = $('#login-error');
        errorDiv.textContent = message;
        errorDiv.classList.add('show');
    },

    hideError() {
        const errorDiv = $('#login-error');
        errorDiv.classList.remove('show');
    },
    
    togglePassword(btn) {
        const input = btn.parentElement.querySelector('input');
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        
        btn.innerHTML = isPassword 
            ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                   <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                   <line x1="1" y1="1" x2="23" y2="23"/>
               </svg>`
            : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                   <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                   <circle cx="12" cy="12" r="3"/>
               </svg>`;
    },
    
    toggleTheme() {
        State.toggleTheme();
        const icon = $('#theme-icon');
        icon.innerHTML = State.theme === 'dark' ? ICONS.sun : ICONS.moon;
    }
};

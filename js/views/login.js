// ============================================
// SKYNET ISP - Login View
// ============================================

const LoginView = {
    render() {
        return `
            <div class="login-layout">
                <div class="login-container">
                    <div class="login-card">
                        <div class="login-logo">
                            <div class="logo-icon">S</div>
                            <h1>SKYNET</h1>
                            <p>ISP Management System</p>
                        </div>
                        
                        <form id="login-form">
                            <div class="form-group">
                                <label class="form-label">Usuario</label>
                                <div class="input-group">
                                    <span class="input-group-icon">${ICONS.user}</span>
                                    <input type="text" name="username" class="form-control" 
                                           placeholder="Ingresa tu usuario" required autofocus>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Contraseña</label>
                                <div class="input-group">
                                    <span class="input-group-icon">${ICONS.lock}</span>
                                    <input type="password" name="password" class="form-control" 
                                           placeholder="Ingresa tu contraseña" required>
                                    <button type="button" class="input-group-btn btn btn-ghost btn-icon" 
                                            onclick="LoginView.togglePassword(this)">
                                        ${ICONS.eye}
                                    </button>
                                </div>
                            </div>
                            
                            <div id="login-error" class="form-error mb-4" style="display: none;"></div>
                            
                            <button type="submit" class="btn btn-primary btn-block btn-lg">
                                Iniciar Sesión
                            </button>
                        </form>
                        
                        <div class="mt-6 text-center">
                            <button type="button" class="btn btn-ghost btn-sm" onclick="LoginView.toggleTheme()">
                                <span id="theme-icon">${State.theme === 'light' ? ICONS.moon : ICONS.sun}</span>
                                <span id="theme-text">${State.theme === 'light' ? 'Modo Oscuro' : 'Modo Claro'}</span>
                            </button>
                        </div>
                    </div>
                    
                    <div class="text-center mt-4 text-muted text-sm">
                        <p>Skynet ISP Management v${CONFIG.APP_VERSION}</p>
                    </div>
                </div>
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
            const errorDiv = $('#login-error');
            const submitBtn = form.querySelector('button[type="submit"]');
            
            if (!username || !password) {
                errorDiv.textContent = 'Ingresa usuario y contraseña';
                errorDiv.style.display = 'block';
                return;
            }
            
            try {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="loader-inline animate-spin"></span> Ingresando...';
                errorDiv.style.display = 'none';
                
                const response = await State.login(username, password);
                
                if (response.success) {
                    // Preload catalogos
                    await State.preloadCatalogos();
                    
                    Components.toast.success('Bienvenido ' + response.data.user.nombre);
                    window.location.hash = '#/clientes';
                } else {
                    errorDiv.textContent = response.message || 'Error al iniciar sesión';
                    errorDiv.style.display = 'block';
                }
            } catch (error) {
                errorDiv.textContent = error.message || 'Error de conexión';
                errorDiv.style.display = 'block';
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Iniciar Sesión';
            }
        });
    },
    
    togglePassword(btn) {
        const input = btn.parentElement.querySelector('input');
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        btn.innerHTML = isPassword ? ICONS.eyeOff : ICONS.eye;
    },
    
    toggleTheme() {
        State.toggleTheme();
        $('#theme-icon').innerHTML = State.theme === 'light' ? ICONS.moon : ICONS.sun;
        $('#theme-text').textContent = State.theme === 'light' ? 'Modo Oscuro' : 'Modo Claro';
    }
};

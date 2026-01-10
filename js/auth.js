// ========================================
// SKYNET - AUTH & GLOBAL FUNCTIONS
// ========================================

const API_URL = 'https://skynet-backend-a47423108e2a.herokuapp.com';

// ========================================
// AUTENTICACIÓN
// ========================================

function verificarSesion() {
  const token = localStorage.getItem('skynet_token');
  if (!token) {
    window.location.href = '/skynet-frontend/';
    return false;
  }
  return true;
}

function cerrarSesion() {
  localStorage.removeItem('skynet_token');
  localStorage.removeItem('skynet_usuario');
  window.location.href = '/skynet-frontend/';
}

function obtenerUsuario() {
  const usuario = localStorage.getItem('skynet_usuario');
  return usuario ? JSON.parse(usuario) : null;
}

function cargarUsuarioHeader() {
  const usuario = obtenerUsuario();
  if (usuario) {
    const nombre = document.getElementById('usuarioNombre');
    const rol = document.getElementById('usuarioRol');
    const avatar = document.getElementById('usuarioAvatar');
    
    if (nombre) nombre.textContent = usuario.nombre || usuario.usuario;
    if (rol) rol.textContent = usuario.rol || 'Administrator';
    if (avatar) avatar.textContent = obtenerIniciales(usuario.nombre || usuario.usuario);
  }
}

// ========================================
// TEMA OSCURO/CLARO
// ========================================

function initTheme() {
  const saved = localStorage.getItem('skynet_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeIcon(saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const newTheme = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('skynet_theme', newTheme);
  updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
  const icon = document.querySelector('.theme-toggle__slider .material-symbols-outlined');
  if (icon) {
    icon.textContent = theme === 'dark' ? 'dark_mode' : 'light_mode';
  }
}

// ========================================
// FETCH HELPERS
// ========================================

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('skynet_token')}`
  };
}

async function fetchGet(endpoint) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'GET',
    headers: getHeaders()
  });
  return response.json();
}

async function fetchPost(endpoint, data) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  return response.json();
}

async function fetchPut(endpoint, data) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  return response.json();
}

async function fetchDelete(endpoint) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  return response.json();
}

// ========================================
// FORMATEO
// ========================================

function formatoMoneda(valor) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(valor || 0);
}

function formatoFecha(fecha) {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function obtenerIniciales(nombre, apellido = '') {
  const n = (nombre || '').charAt(0).toUpperCase();
  const a = (apellido || '').charAt(0).toUpperCase();
  return n + a || '??';
}

// ========================================
// TOASTS
// ========================================

function toast(mensaje, tipo = 'info', duracion = 4000) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast--${tipo}`;
  
  const icons = {
    success: 'check_circle',
    error: 'error',
    warning: 'warning',
    info: 'info'
  };

  toast.innerHTML = `
    <div class="toast__icon">
      <span class="material-symbols-outlined">${icons[tipo] || 'info'}</span>
    </div>
    <span class="toast__message">${mensaje}</span>
    <button class="toast__close" onclick="this.parentElement.remove()">
      <span class="material-symbols-outlined">close</span>
    </button>
  `;

  container.appendChild(toast);
  setTimeout(() => toast.remove(), duracion);
}

function toastExito(msg) { toast(msg, 'success'); }
function toastError(msg) { toast(msg, 'error', 6000); }
function toastAdvertencia(msg) { toast(msg, 'warning', 5000); }
function toastInfo(msg) { toast(msg, 'info'); }

// ========================================
// LOADING BUTTONS
// ========================================

function btnLoading(btn, loading) {
  if (!btn) return;
  if (loading) {
    btn.disabled = true;
    btn.dataset.originalText = btn.innerHTML;
    btn.innerHTML = '<div class="spinner"></div>';
  } else {
    btn.disabled = false;
    btn.innerHTML = btn.dataset.originalText || 'Guardar';
  }
}

// ========================================
// SIDEBAR MOBILE
// ========================================

function toggleSidebar() {
  document.querySelector('.sidebar')?.classList.toggle('open');
  document.querySelector('.sidebar-overlay')?.classList.toggle('active');
}

// ========================================
// INICIALIZACIÓN
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
});

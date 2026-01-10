// ========================================
// SKYNET ISP - JAVASCRIPT GLOBAL
// ========================================

const API_URL = 'https://skynet-backend-a47423108e2a.herokuapp.com';

// ========== AUTENTICACIÓN ==========
function verificarSesion() {
  const token = localStorage.getItem('skynet_token');
  if (!token) {
    window.location.href = 'index.html';
    return false;
  }
  return true;
}

function cerrarSesion() {
  localStorage.removeItem('skynet_token');
  localStorage.removeItem('skynet_usuario');
  window.location.href = 'index.html';
}

function obtenerUsuario() {
  const u = localStorage.getItem('skynet_usuario');
  return u ? JSON.parse(u) : null;
}

function cargarUsuarioHeader() {
  const u = obtenerUsuario();
  if (u) {
    const nombre = document.getElementById('userName');
    const rol = document.getElementById('userRole');
    const avatar = document.getElementById('userAvatar');
    if (nombre) nombre.textContent = u.nombre || u.usuario;
    if (rol) rol.textContent = u.rol || 'Usuario';
    if (avatar) avatar.textContent = obtenerIniciales(u.nombre || u.usuario);
  }
}

// ========== FETCH HELPERS ==========
function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('skynet_token')}`
  };
}

async function fetchAPI(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: { ...getHeaders(), ...options.headers }
    });
    const data = await response.json();
    
    if (response.status === 401) {
      cerrarSesion();
      return { ok: false, mensaje: 'Sesión expirada' };
    }
    
    return data;
  } catch (err) {
    console.error('Error API:', err);
    return { ok: false, mensaje: 'Error de conexión' };
  }
}

async function fetchGet(endpoint) {
  return fetchAPI(endpoint, { method: 'GET' });
}

async function fetchPost(endpoint, data) {
  return fetchAPI(endpoint, { 
    method: 'POST', 
    body: JSON.stringify(data) 
  });
}

async function fetchPut(endpoint, data) {
  return fetchAPI(endpoint, { 
    method: 'PUT', 
    body: JSON.stringify(data) 
  });
}

async function fetchDelete(endpoint) {
  return fetchAPI(endpoint, { method: 'DELETE' });
}

// ========== FORMATEO ==========
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

function formatoFechaCorta(fecha) {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function formatoFechaHora(fecha) {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function obtenerIniciales(nombre, apellido = '') {
  const n = (nombre || '').charAt(0).toUpperCase();
  const a = (apellido || '').charAt(0).toUpperCase();
  return n + a || '??';
}

// ========== TOASTS ==========
function toast(mensaje, tipo = 'info', duracion = 4000) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  
  const icons = {
    success: 'check_circle',
    error: 'error',
    warning: 'warning',
    info: 'info'
  };
  
  const t = document.createElement('div');
  t.className = `toast toast--${tipo}`;
  t.innerHTML = `
    <span class="toast__icon material-symbols-outlined">${icons[tipo] || 'info'}</span>
    <span class="toast__message">${mensaje}</span>
    <button class="toast__close" onclick="this.parentElement.remove()">
      <span class="material-symbols-outlined">close</span>
    </button>
  `;
  container.appendChild(t);
  setTimeout(() => t.remove(), duracion);
}

function toastExito(msg) { toast(msg, 'success'); }
function toastError(msg) { toast(msg, 'error', 6000); }
function toastAdvertencia(msg) { toast(msg, 'warning', 5000); }
function toastInfo(msg) { toast(msg, 'info'); }

// ========== MODALES ==========
function abrirModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function cerrarModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function cerrarModalOverlay(event) {
  if (event.target.classList.contains('modal-overlay')) {
    event.target.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// ========== LOADING ==========
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

function mostrarLoading() {
  let overlay = document.getElementById('loadingOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'loadingOverlay';
    overlay.className = 'loading-overlay';
    overlay.innerHTML = '<div class="loading-spinner"></div>';
    document.body.appendChild(overlay);
  }
  overlay.style.display = 'flex';
}

function ocultarLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) overlay.style.display = 'none';
}

// ========== TABS ==========
function initTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabGroup = tab.closest('.tabs');
      const contentContainer = tabGroup?.nextElementSibling || document.querySelector('.tab-contents');
      const targetId = tab.dataset.tab;
      
      // Desactivar tabs
      tabGroup.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Desactivar contenidos
      if (contentContainer) {
        contentContainer.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        const targetContent = contentContainer.querySelector(`#${targetId}`);
        if (targetContent) targetContent.classList.add('active');
      }
    });
  });
}

// ========== SIDEBAR MOBILE ==========
function toggleSidebar() {
  document.querySelector('.sidebar')?.classList.toggle('open');
  document.querySelector('.sidebar-overlay')?.classList.toggle('active');
}

function closeSidebar() {
  document.querySelector('.sidebar')?.classList.remove('open');
  document.querySelector('.sidebar-overlay')?.classList.remove('active');
}

// ========== UTILIDADES ==========
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

function setQueryParam(param, value) {
  const url = new URL(window.location);
  url.searchParams.set(param, value);
  window.history.pushState({}, '', url);
}

// ========== VALIDACIONES ==========
function validarTelefono(telefono) {
  return /^[\d\s\-\+\(\)]{10,20}$/.test(telefono);
}

function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ========== UPLOAD CLOUDINARY ==========
async function subirImagenCloudinary(file, carpeta = 'skynet') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'skynet_unsigned');
  formData.append('folder', carpeta);
  
  try {
    const response = await fetch('https://api.cloudinary.com/v1_1/dnodzj8fz/image/upload', {
      method: 'POST',
      body: formData
    });
    const data = await response.json();
    return data.secure_url;
  } catch (err) {
    console.error('Error subiendo imagen:', err);
    return null;
  }
}

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', () => {
  // Verificar sesión en páginas protegidas
  if (!window.location.pathname.includes('index.html') && !window.location.pathname.endsWith('/')) {
    verificarSesion();
    cargarUsuarioHeader();
  }
  
  // Inicializar tabs
  initTabs();
  
  // Cerrar sidebar al hacer clic en overlay
  document.querySelector('.sidebar-overlay')?.addEventListener('click', closeSidebar);
  
  // Cerrar modales con ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.active').forEach(modal => {
        modal.classList.remove('active');
      });
      document.body.style.overflow = '';
    }
  });
});

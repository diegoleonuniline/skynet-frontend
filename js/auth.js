// ========================================
// SKYNET - AUTH & FUNCIONES GLOBALES
// ========================================

const API_URL = 'https://skynet-backend-a47423108e2a.herokuapp.com';

// Autenticación
function verificarSesion() {
  if (!localStorage.getItem('skynet_token')) {
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
  const u = localStorage.getItem('skynet_usuario');
  return u ? JSON.parse(u) : null;
}

function cargarUsuarioHeader() {
  const u = obtenerUsuario();
  if (u) {
    const nombre = document.getElementById('usuarioNombre');
    const rol = document.getElementById('usuarioRol');
    const avatar = document.getElementById('usuarioAvatar');
    if (nombre) nombre.textContent = u.nombre || u.usuario;
    if (rol) rol.textContent = u.rol || 'Administrador';
    if (avatar) avatar.textContent = obtenerIniciales(u.nombre || u.usuario);
  }
}

// Tema
function initTheme() {
  const saved = localStorage.getItem('skynet_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const newTheme = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('skynet_theme', newTheme);
}

// Fetch
function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('skynet_token')}`
  };
}

async function fetchGet(endpoint) {
  const r = await fetch(`${API_URL}${endpoint}`, { method: 'GET', headers: getHeaders() });
  return r.json();
}

async function fetchPost(endpoint, data) {
  const r = await fetch(`${API_URL}${endpoint}`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) });
  return r.json();
}

async function fetchPut(endpoint, data) {
  const r = await fetch(`${API_URL}${endpoint}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(data) });
  return r.json();
}

async function fetchDelete(endpoint) {
  const r = await fetch(`${API_URL}${endpoint}`, { method: 'DELETE', headers: getHeaders() });
  return r.json();
}

// Formato
function formatoMoneda(v) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v || 0);
}

function formatoFecha(f) {
  if (!f) return '-';
  return new Date(f).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

function obtenerIniciales(nombre, apellido = '') {
  const n = (nombre || '').charAt(0).toUpperCase();
  const a = (apellido || '').charAt(0).toUpperCase();
  return n + a || '??';
}

// Toasts
function toast(mensaje, tipo = 'info', duracion = 4000) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: 'check_circle', error: 'error', warning: 'warning', info: 'info' };
  const t = document.createElement('div');
  t.className = `toast toast--${tipo}`;
  t.innerHTML = `
    <div class="toast__icon"><span class="material-symbols-outlined">${icons[tipo] || 'info'}</span></div>
    <span class="toast__message">${mensaje}</span>
    <button class="toast__close" onclick="this.parentElement.remove()"><span class="material-symbols-outlined">close</span></button>
  `;
  container.appendChild(t);
  setTimeout(() => t.remove(), duracion);
}

function toastExito(msg) { toast(msg, 'success'); }
function toastError(msg) { toast(msg, 'error', 6000); }
function toastAdvertencia(msg) { toast(msg, 'warning', 5000); }
function toastInfo(msg) { toast(msg, 'info'); }

// Loading
function btnLoading(btn, loading) {
  if (!btn) return;
  if (loading) {
    btn.disabled = true;
    btn.dataset.originalText = btn.innerHTML;
    btn.innerHTML = '<div class="spinner" style="width:18px;height:18px;border:2px solid transparent;border-top-color:currentColor;border-radius:50%;animation:spin .8s linear infinite"></div>';
  } else {
    btn.disabled = false;
    btn.innerHTML = btn.dataset.originalText || 'Guardar';
  }
}

// Sidebar mobile
function toggleSidebar() {
  document.querySelector('.sidebar')?.classList.toggle('open');
  document.querySelector('.sidebar-overlay')?.classList.toggle('active');
}

document.addEventListener('DOMContentLoaded', () => { initTheme(); });

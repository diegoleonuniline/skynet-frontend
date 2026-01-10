// ========================================
// SKYNET - AUTENTICACIÓN Y UTILIDADES
// ========================================

const API = "https://skynet-backend-a47423108e2a.herokuapp.com";

// ========================================
// SESIÓN
// ========================================

function verificarSesion() {
  const token = localStorage.getItem("token");
  const usuario = localStorage.getItem("usuario");
  
  if (!token || !usuario) {
    window.location.href = "/skynet-frontend/";
    return null;
  }
  
  return JSON.parse(usuario);
}

function cerrarSesion() {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
  window.location.href = "/skynet-frontend/";
}

function obtenerToken() {
  return localStorage.getItem("token");
}

function headersAuth() {
  return {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + obtenerToken()
  };
}

// ========================================
// PETICIONES HTTP
// ========================================

async function fetchGet(endpoint) {
  const r = await fetch(API + endpoint, {
    method: "GET",
    headers: headersAuth()
  });
  return r.json();
}

async function fetchPost(endpoint, data) {
  const r = await fetch(API + endpoint, {
    method: "POST",
    headers: headersAuth(),
    body: JSON.stringify(data)
  });
  return r.json();
}

async function fetchPut(endpoint, data) {
  const r = await fetch(API + endpoint, {
    method: "PUT",
    headers: headersAuth(),
    body: JSON.stringify(data)
  });
  return r.json();
}

async function fetchDelete(endpoint) {
  const r = await fetch(API + endpoint, {
    method: "DELETE",
    headers: headersAuth()
  });
  return r.json();
}

// ========================================
// USUARIO HEADER
// ========================================

function cargarUsuarioHeader() {
  const usuario = verificarSesion();
  if (!usuario) return;
  
  const nombreEl = document.getElementById("usuarioNombre");
  const rolEl = document.getElementById("usuarioRol");
  const avatarEl = document.querySelector(".header__user-avatar");
  
  if (nombreEl) nombreEl.textContent = usuario.usuario;
  if (rolEl) rolEl.textContent = usuario.rol?.nombre || usuario.rol?.clave || "Usuario";
  if (avatarEl) avatarEl.textContent = usuario.usuario?.charAt(0).toUpperCase() || "U";
}

// ========================================
// FORMATO
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
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function obtenerIniciales(nombre, apellido) {
  const n = nombre ? nombre.charAt(0).toUpperCase() : '';
  const a = apellido ? apellido.charAt(0).toUpperCase() : '';
  return n + a || '??';
}

// ========================================
// SIDEBAR MÓVIL
// ========================================

function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');
  
  sidebar?.classList.toggle('open');
  overlay?.classList.toggle('open');
}

// ========================================
// SISTEMA DE TOASTS
// ========================================

function crearContenedorToasts() {
  let contenedor = document.getElementById('toast-container');
  if (!contenedor) {
    contenedor = document.createElement('div');
    contenedor.id = 'toast-container';
    contenedor.className = 'toast-container';
    document.body.appendChild(contenedor);
  }
  return contenedor;
}

function toast(mensaje, tipo = 'info', duracion = 4000) {
  const contenedor = crearContenedorToasts();
  
  const iconos = {
    success: 'check_circle',
    error: 'error',
    warning: 'warning',
    info: 'info'
  };
  
  const titulos = {
    success: 'Éxito',
    error: 'Error',
    warning: 'Advertencia',
    info: 'Información'
  };
  
  const toastEl = document.createElement('div');
  toastEl.className = `toast toast--${tipo}`;
  toastEl.innerHTML = `
    <div class="toast__icon">
      <span class="material-symbols-outlined">${iconos[tipo]}</span>
    </div>
    <div class="toast__content">
      <p class="toast__title">${titulos[tipo]}</p>
      <p class="toast__message">${mensaje}</p>
    </div>
    <button class="toast__close" onclick="cerrarToast(this)">
      <span class="material-symbols-outlined">close</span>
    </button>
  `;
  
  contenedor.appendChild(toastEl);
  
  // Auto cerrar
  if (duracion > 0) {
    setTimeout(() => {
      cerrarToastElemento(toastEl);
    }, duracion);
  }
  
  return toastEl;
}

function cerrarToast(btn) {
  const toastEl = btn.closest('.toast');
  cerrarToastElemento(toastEl);
}

function cerrarToastElemento(toastEl) {
  if (!toastEl) return;
  toastEl.classList.add('hiding');
  setTimeout(() => {
    toastEl.remove();
  }, 300);
}

// Funciones de acceso rápido
function toastExito(mensaje) {
  return toast(mensaje, 'success');
}

function toastError(mensaje) {
  return toast(mensaje, 'error', 6000);
}

function toastAdvertencia(mensaje) {
  return toast(mensaje, 'warning', 5000);
}

function toastInfo(mensaje) {
  return toast(mensaje, 'info');
}

// ========================================
// MODAL DE CONFIRMACIÓN
// ========================================

function confirmar(opciones) {
  return new Promise((resolve) => {
    const {
      titulo = '¿Estás seguro?',
      mensaje = '',
      tipo = 'warning', // warning, danger, success
      textoConfirmar = 'Confirmar',
      textoCancelar = 'Cancelar',
      colorConfirmar = 'primary' // primary, danger, success
    } = opciones;
    
    const iconos = {
      warning: 'warning',
      danger: 'delete_forever',
      success: 'check_circle'
    };
    
    // Crear overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'confirm-modal-overlay';
    
    overlay.innerHTML = `
      <div class="modal modal--sm">
        <div class="modal__body confirm-modal">
          <div class="confirm-modal__icon confirm-modal__icon--${tipo}">
            <span class="material-symbols-outlined">${iconos[tipo]}</span>
          </div>
          <h3 class="confirm-modal__title">${titulo}</h3>
          <p class="confirm-modal__message">${mensaje}</p>
          <div class="confirm-modal__actions">
            <button class="btn btn-secondary" id="confirm-cancel">${textoCancelar}</button>
            <button class="btn btn-${colorConfirmar}" id="confirm-ok">${textoConfirmar}</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Mostrar con animación
    requestAnimationFrame(() => {
      overlay.classList.add('active');
    });
    
    // Eventos
    const btnCancelar = overlay.querySelector('#confirm-cancel');
    const btnConfirmar = overlay.querySelector('#confirm-ok');
    
    function cerrar(resultado) {
      overlay.classList.remove('active');
      setTimeout(() => {
        overlay.remove();
      }, 200);
      resolve(resultado);
    }
    
    btnCancelar.addEventListener('click', () => cerrar(false));
    btnConfirmar.addEventListener('click', () => cerrar(true));
    
    // Cerrar con ESC
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        cerrar(false);
        document.removeEventListener('keydown', handleEsc);
      }
    };
    document.addEventListener('keydown', handleEsc);
  });
}

// ========================================
// LOADING EN BOTONES
// ========================================

function btnLoading(btn, loading = true) {
  if (loading) {
    btn.disabled = true;
    btn.dataset.originalText = btn.innerHTML;
    btn.innerHTML = '<span class="spinner"></span> Procesando...';
  } else {
    btn.disabled = false;
    btn.innerHTML = btn.dataset.originalText || btn.innerHTML;
  }
}

// ========================================
// ANIMACIÓN DE ÉXITO CON CONFETTI
// ========================================

function mostrarExitoCreacion(opciones = {}) {
  const {
    titulo = '¡Creado exitosamente!',
    mensaje = 'El registro se ha guardado correctamente',
    detalle = '',
    textoBoton = 'Continuar',
    onClose = () => {}
  } = opciones;

  // Crear confetti
  crearConfetti();

  // Crear overlay
  const overlay = document.createElement('div');
  overlay.className = 'success-overlay';
  overlay.id = 'success-overlay';
  
  overlay.innerHTML = `
    <div class="success-card">
      <div class="success-icon-wrapper">
        <div class="success-rings">
          <div class="success-ring"></div>
          <div class="success-ring"></div>
          <div class="success-ring"></div>
        </div>
        <div class="success-circle">
          <span class="material-symbols-outlined">check</span>
        </div>
      </div>
      <h2 class="success-title">${titulo}</h2>
      <p class="success-message">${mensaje}</p>
      ${detalle ? `<p class="success-detail">${detalle}</p>` : ''}
      <button class="success-btn" onclick="cerrarExitoCreacion()">${textoBoton}</button>
    </div>
  `;

  document.body.appendChild(overlay);
  
  // Guardar callback
  overlay.dataset.onClose = 'true';
  window._successCallback = onClose;

  // Mostrar con animación
  requestAnimationFrame(() => {
    overlay.classList.add('active');
  });

  // Auto cerrar después de 5 segundos
  setTimeout(() => {
    cerrarExitoCreacion();
  }, 5000);
}

function cerrarExitoCreacion() {
  const overlay = document.getElementById('success-overlay');
  if (!overlay) return;

  overlay.classList.remove('active');
  
  setTimeout(() => {
    overlay.remove();
    // Limpiar confetti
    document.querySelectorAll('.confetti-container').forEach(c => c.remove());
    // Ejecutar callback
    if (window._successCallback) {
      window._successCallback();
      window._successCallback = null;
    }
  }, 300);
}

function crearConfetti() {
  const container = document.createElement('div');
  container.className = 'confetti-container';
  
  const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];
  const shapes = ['square', 'circle'];
  
  for (let i = 0; i < 100; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = Math.random() * 100 + 'vw';
    confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
    confetti.style.animationDelay = Math.random() * 0.5 + 's';
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    
    if (shapes[Math.floor(Math.random() * shapes.length)] === 'circle') {
      confetti.style.borderRadius = '50%';
    } else {
      confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
    }
    
    confetti.style.width = (Math.random() * 10 + 5) + 'px';
    confetti.style.height = (Math.random() * 10 + 5) + 'px';
    
    container.appendChild(confetti);
  }
  
  document.body.appendChild(container);
  
  // Limpiar después de la animación
  setTimeout(() => {
    container.remove();
  }, 4000);
}

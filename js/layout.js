// Layout - genera sidebar y topbar
function initLayout(activePage) {
  // Verificar auth
  if (!auth.checkAuth()) return;

  const user = api.getUser();
  const isAdmin = api.isAdmin();

  // Generar sidebar
  const sidebarHTML = `
    <div class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo">📡</div>
        <div class="sidebar-title">
          <h1>SKYNET</h1>
          <p>ISP MANAGEMENT</p>
        </div>
      </div>

      <nav class="sidebar-nav">
        <a href="dashboard.html" class="nav-item ${activePage === 'dashboard' ? 'active' : ''}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          Dashboard
        </a>
        <a href="clientes/lista.html" class="nav-item ${activePage === 'clientes' ? 'active' : ''}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          Clientes
        </a>
        <a href="servicios/lista.html" class="nav-item ${activePage === 'servicios' ? 'active' : ''}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>
          Servicios
        </a>
        <a href="instalaciones/lista.html" class="nav-item ${activePage === 'instalaciones' ? 'active' : ''}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
          Instalaciones
        </a>
        <a href="equipos/lista.html" class="nav-item ${activePage === 'equipos' ? 'active' : ''}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
          Equipos
        </a>
        <a href="cargos/lista.html" class="nav-item ${activePage === 'cargos' ? 'active' : ''}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          Cargos
        </a>
        <a href="pagos/lista.html" class="nav-item ${activePage === 'pagos' ? 'active' : ''}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          Pagos
        </a>
        ${isAdmin ? `
        <a href="reportes/lista.html" class="nav-item ${activePage === 'reportes' ? 'active' : ''}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          Reportes
        </a>
        <a href="usuarios/lista.html" class="nav-item ${activePage === 'usuarios' ? 'active' : ''}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Usuarios
        </a>
        <a href="catalogos/lista.html" class="nav-item ${activePage === 'catalogos' ? 'active' : ''}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
          Catálogos
        </a>
        ` : ''}
      </nav>

      <div class="sidebar-footer">
        <a href="clientes/nuevo.html" class="btn btn-primary" style="width: 100%">
          + Nuevo Cliente
        </a>
      </div>
    </div>
  `;

  // Generar topbar
  const topbarHTML = `
    <header class="topbar">
      <div style="display: flex; align-items: center; gap: 16px;">
        <button class="btn-icon" onclick="toggleSidebar()" id="menuBtn">☰</button>
        <div class="topbar-search">
          <span>🔍</span>
          <input type="text" placeholder="Buscar clientes..." id="globalSearch">
        </div>
      </div>

      <div class="topbar-user" onclick="toggleUserMenu()">
        <div class="user-info">
          <strong>${user?.nombre_completo || 'Usuario'}</strong>
          <span>${user?.rol || 'Rol'}</span>
        </div>
        <div class="user-avatar">${utils.getInitials(user?.nombre_completo)}</div>
      </div>

      <div class="user-menu hidden" id="userMenu">
        <button onclick="auth.logout()">Cerrar Sesión</button>
      </div>
    </header>
  `;

  // Insertar en el DOM
  document.body.innerHTML = `
    <div class="app-container">
      ${sidebarHTML}
      <div class="main-content">
        ${topbarHTML}
        <div class="page-content" id="pageContent">
          ${document.body.innerHTML}
        </div>
      </div>
    </div>
  `;

  // Eventos
  document.getElementById('globalSearch').addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && e.target.value) {
      window.location.href = `clientes/lista.html?busqueda=${encodeURIComponent(e.target.value)}`;
    }
  });
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

function toggleUserMenu() {
  document.getElementById('userMenu').classList.toggle('hidden');
}

// Cerrar sidebar en móvil al hacer click fuera
document.addEventListener('click', (e) => {
  const sidebar = document.getElementById('sidebar');
  const menuBtn = document.getElementById('menuBtn');
  if (sidebar && !sidebar.contains(e.target) && !menuBtn?.contains(e.target)) {
    sidebar.classList.remove('open');
  }
});

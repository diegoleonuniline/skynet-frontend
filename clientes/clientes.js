// ========================================
// SKYNET - CLIENTES JS
// ========================================

let paginaActual = 1;
const porPagina = 10;
let filtroEstado = 'todos';
let ciudades = [];
let colonias = [];
let planes = [];

document.addEventListener('DOMContentLoaded', () => {
  cargarUsuarioHeader();
  cargarCatalogos();
  cargarClientes();
  inicializarEventos();
});

function inicializarEventos() {
  document.querySelectorAll('.tabs__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tabs__btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filtroEstado = btn.dataset.filtro;
      paginaActual = 1;
      cargarClientes();
    });
  });

  let timeout;
  document.getElementById('buscadorGlobal')?.addEventListener('input', () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => { paginaActual = 1; cargarClientes(); }, 300);
  });

  document.getElementById('ciudadId')?.addEventListener('change', e => cargarColoniasPorCiudad(e.target.value));
  document.getElementById('planId')?.addEventListener('change', e => {
    const plan = planes.find(p => p.id === e.target.value);
    if (plan) document.getElementById('cuotaMensual').value = plan.precio_mensual;
  });
}

async function cargarCatalogos() {
  try {
    const [rCiudades, rPlanes] = await Promise.all([fetchGet('/api/catalogos/ciudades'), fetchGet('/api/catalogos/planes')]);
    if (rCiudades.ok) { ciudades = rCiudades.ciudades; llenarSelect('ciudadId', ciudades, 'id', 'nombre'); llenarSelect('filtroCiudad', ciudades, 'id', 'nombre', true); llenarSelect('nuevaColoniaCiudad', ciudades, 'id', 'nombre'); }
    if (rPlanes.ok) { planes = rPlanes.planes; llenarSelect('planId', planes, 'id', 'nombre'); llenarSelect('filtroPlan', planes, 'id', 'nombre', true); }
  } catch (err) { console.error('Error cargando catálogos:', err); }
}

function llenarSelect(id, datos, valorKey, textoKey, conTodos = false) {
  const select = document.getElementById(id);
  if (!select) return;
  let html = conTodos ? '<option value="">Todos</option>' : '<option value="">Seleccionar...</option>';
  datos.forEach(item => { html += `<option value="${item[valorKey]}">${item[textoKey]}</option>`; });
  select.innerHTML = html;
}

async function cargarColoniasPorCiudad(ciudadId) {
  const select = document.getElementById('coloniaId');
  if (!ciudadId) { select.innerHTML = '<option value="">Seleccionar...</option>'; return; }
  try {
    const r = await fetchGet(`/api/catalogos/colonias?ciudad_id=${ciudadId}`);
    if (r.ok) { colonias = r.colonias; llenarSelect('coloniaId', colonias, 'id', 'nombre'); }
  } catch (err) { console.error('Error cargando colonias:', err); }
}

async function cargarClientes() {
  const tbody = document.getElementById('tablaClientes');
  tbody.innerHTML = '<tr><td colspan="7" class="text-center">Cargando...</td></tr>';
  try {
    const busqueda = document.getElementById('buscadorGlobal')?.value || '';
    let url = `/api/clientes?pagina=${paginaActual}&limite=${porPagina}`;
    if (filtroEstado !== 'todos') url += `&estado=${filtroEstado}`;
    if (busqueda) url += `&busqueda=${encodeURIComponent(busqueda)}`;
    const data = await fetchGet(url);
    if (!data.ok || !data.clientes?.length) { tbody.innerHTML = '<tr><td colspan="7" class="text-center">No se encontraron clientes</td></tr>'; actualizarPaginacion(0, 0, 0); return; }
    tbody.innerHTML = data.clientes.map(c => `
      <tr>
        <td><div class="table__avatar"><div class="table__avatar-circle table__avatar-circle--blue">${obtenerIniciales(c.nombre, c.apellido_paterno)}</div><span class="table__avatar-name">${c.nombre} ${c.apellido_paterno || ''} ${c.apellido_materno || ''}</span></div></td>
        <td>${c.telefono || '-'}</td>
        <td>${c.ciudad_nombre || '-'}</td>
        <td>${c.colonia_nombre || '-'}</td>
        <td><span class="badge badge--${c.estado}">${c.estado}</span></td>
        <td class="font-semibold">${formatoMoneda(c.cuota_mensual)}</td>
        <td><div class="table-actions"><button class="btn btn-secondary" onclick="verCliente('${c.id}')" title="Ver"><span class="material-symbols-outlined">visibility</span></button><button class="btn btn-secondary" onclick="editarCliente('${c.id}')" title="Editar"><span class="material-symbols-outlined">edit</span></button></div></td>
      </tr>
    `).join('');
    document.getElementById('totalClientes').textContent = data.total || data.clientes.length;
    actualizarPaginacion(data.paginaActual || paginaActual, data.porPagina || porPagina, data.total || data.clientes.length);
    generarBotonesPaginacion(data.totalPaginas || 1, data.paginaActual || paginaActual);
  } catch (err) { console.error('Error cargando clientes:', err); tbody.innerHTML = '<tr><td colspan="7" class="text-center">Error al cargar</td></tr>'; }
}

function filtrarClientes() { paginaActual = 1; cargarClientes(); }
function actualizarPaginacion(pagina, porPag, total) { const inicio = total === 0 ? 0 : ((pagina - 1) * porPag) + 1; const fin = Math.min(pagina * porPag, total); document.getElementById('paginaInicio').textContent = inicio; document.getElementById('paginaFin').textContent = fin; document.getElementById('paginaTotal').textContent = total; }
function generarBotonesPaginacion(totalPaginas, paginaActualNum) { const contenedor = document.getElementById('paginacionBtns'); if (!contenedor) return; let html = `<button class="pagination__btn" onclick="irPagina(${paginaActualNum - 1})" ${paginaActualNum <= 1 ? 'disabled' : ''}><span class="material-symbols-outlined">chevron_left</span></button>`; for (let i = 1; i <= Math.min(totalPaginas, 5); i++) { html += `<button class="pagination__btn ${i === paginaActualNum ? 'active' : ''}" onclick="irPagina(${i})">${i}</button>`; } if (totalPaginas > 5) { html += `<button class="pagination__btn" disabled>...</button><button class="pagination__btn" onclick="irPagina(${totalPaginas})">${totalPaginas}</button>`; } html += `<button class="pagination__btn" onclick="irPagina(${paginaActualNum + 1})" ${paginaActualNum >= totalPaginas ? 'disabled' : ''}><span class="material-symbols-outlined">chevron_right</span></button>`; contenedor.innerHTML = html; }
function irPagina(pagina) { if (pagina < 1) return; paginaActual = pagina; cargarClientes(); }
function toggleFiltros() { document.getElementById('filtrosPanel').classList.toggle('hidden'); }

function abrirModalNuevo() { document.getElementById('modalTitulo').textContent = 'Nuevo Cliente'; document.getElementById('formCliente').reset(); document.getElementById('clienteId').value = ''; document.getElementById('fechaInstalacion').value = new Date().toISOString().split('T')[0]; document.getElementById('coloniaId').innerHTML = '<option value="">Seleccionar ciudad primero...</option>'; document.getElementById('modalCliente').classList.add('active'); }

async function editarCliente(id) {
  try {
    const data = await fetchGet(`/api/clientes/${id}`);
    if (!data.ok) { toastError('Error al cargar cliente'); return; }
    const c = data.cliente;
    document.getElementById('modalTitulo').textContent = 'Editar Cliente';
    document.getElementById('clienteId').value = c.id;
    document.getElementById('nombre').value = c.nombre || '';
    document.getElementById('apellidoPaterno').value = c.apellido_paterno || '';
    document.getElementById('apellidoMaterno').value = c.apellido_materno || '';
    document.getElementById('telefono').value = c.telefono || '';
    document.getElementById('telefonoSecundario').value = c.telefono_secundario || '';
    document.getElementById('email').value = c.email || '';
    document.getElementById('ciudadId').value = c.ciudad_id || '';
    if (c.ciudad_id) { await cargarColoniasPorCiudad(c.ciudad_id); document.getElementById('coloniaId').value = c.colonia_id || ''; }
    document.getElementById('direccion').value = c.direccion || '';
    document.getElementById('referencia').value = c.referencia || '';
    document.getElementById('planId').value = c.plan_id || '';
    document.getElementById('cuotaMensual').value = c.cuota_mensual || '';
    document.getElementById('fechaInstalacion').value = c.fecha_instalacion?.split('T')[0] || '';
    document.getElementById('modalCliente').classList.add('active');
  } catch (err) { console.error('Error:', err); toastError('Error al cargar cliente'); }
}

function cerrarModal() { document.getElementById('modalCliente').classList.remove('active'); }

async function guardarCliente() {
  const id = document.getElementById('clienteId').value;
  const btn = document.getElementById('btnGuardarCliente');
  const datos = { nombre: document.getElementById('nombre').value, apellido_paterno: document.getElementById('apellidoPaterno').value, apellido_materno: document.getElementById('apellidoMaterno').value, telefono: document.getElementById('telefono').value, telefono_secundario: document.getElementById('telefonoSecundario').value, email: document.getElementById('email').value, ciudad_id: document.getElementById('ciudadId').value, colonia_id: document.getElementById('coloniaId').value, direccion: document.getElementById('direccion').value, referencia: document.getElementById('referencia').value, plan_id: document.getElementById('planId').value, cuota_mensual: parseFloat(document.getElementById('cuotaMensual').value) || 0, fecha_instalacion: document.getElementById('fechaInstalacion').value };
  if (!datos.nombre || !datos.telefono || !datos.ciudad_id || !datos.colonia_id || !datos.direccion || !datos.plan_id) { toastAdvertencia('Completa todos los campos requeridos'); return; }
  btnLoading(btn, true);
  try {
    let data = id ? await fetchPut(`/api/clientes/${id}`, datos) : await fetchPost('/api/clientes', datos);
    btnLoading(btn, false);
    if (data.ok) { cerrarModal(); if (id) { cargarClientes(); toastExito('Cliente actualizado'); } else { mostrarExitoCreacion({ titulo: '¡Cliente Creado!', mensaje: 'El nuevo cliente se ha registrado exitosamente', detalle: `${datos.nombre} ${datos.apellido_paterno || ''}`.trim(), textoBoton: 'Ver Clientes', onClose: () => cargarClientes() }); } } else { toastError(data.mensaje || 'Error al guardar'); }
  } catch (err) { console.error('Error:', err); btnLoading(btn, false); toastError('Error al guardar cliente'); }
}

function abrirModalCiudad() { document.getElementById('nuevaCiudadNombre').value = ''; document.getElementById('nuevaCiudadEstado').value = ''; document.getElementById('modalCiudad').classList.add('active'); }
function cerrarModalCiudad() { document.getElementById('modalCiudad').classList.remove('active'); }
async function guardarCiudad() { const nombre = document.getElementById('nuevaCiudadNombre').value.trim(); const estado = document.getElementById('nuevaCiudadEstado').value.trim(); const btn = document.getElementById('btnGuardarCiudad'); if (!nombre) { toastAdvertencia('El nombre de la ciudad es requerido'); return; } btnLoading(btn, true); try { const data = await fetchPost('/api/catalogos/ciudades', { nombre, estado_republica: estado }); btnLoading(btn, false); if (data.ok) { cerrarModalCiudad(); await cargarCatalogos(); if (data.ciudad?.id) { document.getElementById('ciudadId').value = data.ciudad.id; await cargarColoniasPorCiudad(data.ciudad.id); } toastExito('Ciudad creada'); } else { toastError(data.mensaje || 'Error'); } } catch (err) { btnLoading(btn, false); toastError('Error al crear ciudad'); } }

function abrirModalColonia() { document.getElementById('nuevaColoniaNombre').value = ''; document.getElementById('nuevaColoniaCP').value = ''; llenarSelect('nuevaColoniaCiudad', ciudades, 'id', 'nombre'); const ciudadSeleccionada = document.getElementById('ciudadId').value; if (ciudadSeleccionada) { document.getElementById('nuevaColoniaCiudad').value = ciudadSeleccionada; } document.getElementById('modalColonia').classList.add('active'); }
function cerrarModalColonia() { document.getElementById('modalColonia').classList.remove('active'); }
async function guardarColonia() { const ciudadId = document.getElementById('nuevaColoniaCiudad').value; const nombre = document.getElementById('nuevaColoniaNombre').value.trim(); const cp = document.getElementById('nuevaColoniaCP').value.trim(); const btn = document.getElementById('btnGuardarColonia'); if (!ciudadId || !nombre) { toastAdvertencia('Ciudad y nombre son requeridos'); return; } btnLoading(btn, true); try { const data = await fetchPost('/api/catalogos/colonias', { ciudad_id: ciudadId, nombre, codigo_postal: cp }); btnLoading(btn, false); if (data.ok) { cerrarModalColonia(); await cargarColoniasPorCiudad(ciudadId); if (data.colonia?.id) { document.getElementById('coloniaId').value = data.colonia.id; } toastExito('Colonia creada'); } else { toastError(data.mensaje || 'Error'); } } catch (err) { btnLoading(btn, false); toastError('Error al crear colonia'); } }

function abrirModalPlan() { document.getElementById('nuevoPlanNombre').value = ''; document.getElementById('nuevoPlanVelocidad').value = ''; document.getElementById('nuevoPlanPrecio').value = ''; document.getElementById('nuevoPlanInstalacion').value = '0'; document.getElementById('nuevoPlanDescripcion').value = ''; document.getElementById('modalPlan').classList.add('active'); }
function cerrarModalPlan() { document.getElementById('modalPlan').classList.remove('active'); }
async function guardarPlan() { const nombre = document.getElementById('nuevoPlanNombre').value.trim(); const velocidad = parseInt(document.getElementById('nuevoPlanVelocidad').value) || 0; const precio = parseFloat(document.getElementById('nuevoPlanPrecio').value) || 0; const instalacion = parseFloat(document.getElementById('nuevoPlanInstalacion').value) || 0; const descripcion = document.getElementById('nuevoPlanDescripcion').value.trim(); const btn = document.getElementById('btnGuardarPlan'); if (!nombre || !velocidad || !precio) { toastAdvertencia('Nombre, velocidad y precio son requeridos'); return; } btnLoading(btn, true); try { const data = await fetchPost('/api/catalogos/planes', { nombre, velocidad_mbps: velocidad, precio_mensual: precio, precio_instalacion: instalacion, descripcion }); btnLoading(btn, false); if (data.ok) { cerrarModalPlan(); await cargarCatalogos(); if (data.plan?.id) { document.getElementById('planId').value = data.plan.id; document.getElementById('cuotaMensual').value = data.plan.precio_mensual; } toastExito('Plan creado'); } else { toastError(data.mensaje || 'Error'); } } catch (err) { btnLoading(btn, false); toastError('Error al crear plan'); } }

async function exportarCSV() { toastInfo('Preparando exportación...'); }

// ========================================
// VER DETALLE CLIENTE - VISTA COMPLETA
// ========================================
async function verCliente(id) {
  try {
    const data = await fetchGet(`/api/clientes/${id}`);
    if (!data.ok) { toastError('Error al cargar cliente'); return; }
    const c = data.cliente;
    
    let statusClass = 'status--active', statusText = 'ACTIVO', balanceStatus = 'Cuenta al corriente', balanceClass = '';
    if (c.estado === 'suspendido') { statusClass = 'status--warning'; statusText = 'SUSPENDIDO'; balanceStatus = 'Servicio suspendido'; balanceClass = 'text-warning'; }
    if (c.estado === 'cancelado') { statusClass = 'status--danger'; statusText = 'CANCELADO'; balanceStatus = 'Cuenta cancelada'; balanceClass = 'text-danger'; }
    if (c.saldo_pendiente > 0) { balanceStatus = 'Saldo pendiente'; balanceClass = 'text-danger'; }

    const hoy = new Date();
    let proximoCorte = new Date(hoy.getFullYear(), hoy.getMonth(), c.dia_corte || 10);
    if (proximoCorte < hoy) proximoCorte = new Date(hoy.getFullYear(), hoy.getMonth() + 1, c.dia_corte || 10);
    const diasRestantes = Math.ceil((proximoCorte - hoy) / (1000 * 60 * 60 * 24));

    const overlay = document.createElement('div');
    overlay.className = 'detail-overlay';
    overlay.id = 'modalDetalle';
    
    overlay.innerHTML = `
      <div class="detail-container">
        <header class="detail-header">
          <nav class="detail-breadcrumb">
            <a href="#" onclick="cerrarModalDetalle(); return false;"><span class="material-symbols-outlined">arrow_back</span> Clientes</a>
            <span class="material-symbols-outlined">chevron_right</span>
            <span>Perfil del Cliente</span>
          </nav>
          <button class="detail-close" onclick="cerrarModalDetalle()"><span class="material-symbols-outlined">close</span></button>
        </header>

        <main class="detail-main">
          <section class="detail-profile">
            <div class="detail-profile__left">
              <div class="detail-profile__avatar">${obtenerIniciales(c.nombre, c.apellido_paterno)}</div>
              <div class="detail-profile__info">
                <div class="detail-profile__name">
                  <h1>${c.nombre} ${c.apellido_paterno || ''} ${c.apellido_materno || ''} - ID: #${c.numero_cliente || 'SKY-0000'}</h1>
                  <span class="detail-badge ${statusClass}">${statusText}</span>
                </div>
                <div class="detail-profile__meta">
                  <span><span class="material-symbols-outlined">mail</span> ${c.email || 'Sin email'}</span>
                  <span><span class="material-symbols-outlined">location_on</span> ${c.direccion || ''}, ${c.colonia_nombre || ''}, ${c.ciudad_nombre || ''}</span>
                </div>
              </div>
            </div>
            <div class="detail-profile__actions">
              <button class="btn btn-primary" onclick="registrarPago('${c.id}')"><span class="material-symbols-outlined">payments</span> Registrar Pago</button>
              <button class="btn btn-secondary" onclick="cerrarModalDetalle(); editarCliente('${c.id}')"><span class="material-symbols-outlined">edit</span> Editar Perfil</button>
            </div>
          </section>

          <section class="detail-stats">
            <div class="detail-stat">
              <div class="detail-stat__top"><span class="detail-stat__label">Cuota Mensual</span><div class="detail-stat__icon blue"><span class="material-symbols-outlined">price_check</span></div></div>
              <p class="detail-stat__value">${formatoMoneda(c.cuota_mensual)} <small>/mes</small></p>
              <p class="detail-stat__sub">Plan: ${c.plan_nombre || 'Sin plan'}</p>
            </div>
            <div class="detail-stat">
              <div class="detail-stat__top"><span class="detail-stat__label">Saldo Actual</span><div class="detail-stat__icon green"><span class="material-symbols-outlined">account_balance_wallet</span></div></div>
              <p class="detail-stat__value">${formatoMoneda(c.saldo_pendiente || 0)}</p>
              <p class="detail-stat__sub ${balanceClass}">${balanceStatus}</p>
            </div>
            <div class="detail-stat">
              <div class="detail-stat__top"><span class="detail-stat__label">Próximo Corte</span><div class="detail-stat__icon amber"><span class="material-symbols-outlined">calendar_month</span></div></div>
              <p class="detail-stat__value">${formatoFechaCorta(proximoCorte)}</p>
              <p class="detail-stat__sub">En ${diasRestantes} días</p>
            </div>
          </section>

          <div class="detail-tabs">
            <button class="detail-tabs__btn active" data-tab="equipos">Equipos</button>
            <button class="detail-tabs__btn" data-tab="historial">Estado de Cuenta</button>
            <button class="detail-tabs__btn" data-tab="docs">Documentos</button>
          </div>

          <div class="detail-content">
            <div class="detail-content__main">
              <div class="detail-panel active" id="panel-equipos">
                <div class="detail-panel__head"><h3><span class="material-symbols-outlined">router</span> Equipos Instalados</h3><button onclick="agregarEquipo('${c.id}')">Administrar</button></div>
                <table class="detail-table"><thead><tr><th>Dispositivo</th><th>MAC Address</th><th>No. Serie</th><th>Estado</th></tr></thead><tbody id="tablaEquipos"><tr><td colspan="4" class="text-center">Cargando...</td></tr></tbody></table>
              </div>
              <div class="detail-panel" id="panel-historial">
                <div class="detail-panel__head"><h3><span class="material-symbols-outlined">receipt_long</span> Historial de Transacciones</h3><button>Ver Estado Completo</button></div>
                <div id="listaPagos" class="detail-transactions"><p class="text-center">Cargando...</p></div>
              </div>
              <div class="detail-panel" id="panel-docs">
                <div class="detail-panel__head"><h3><span class="material-symbols-outlined">folder</span> Documentos</h3></div>
                <div class="detail-empty"><span class="material-symbols-outlined">folder_open</span><p>Sin documentos adicionales</p></div>
              </div>
            </div>
            <div class="detail-content__side">
              <div class="detail-card">
                <h4><span class="material-symbols-outlined">badge</span> Identificación (INE)</h4>
                <div class="detail-ine">
                  <div class="detail-ine__item"><label>Frente</label><div class="detail-ine__box ${c.ine_frente ? 'has' : ''}">${c.ine_frente ? `<img src="${c.ine_frente}"><span class="check"><span class="material-symbols-outlined">check</span></span>` : `<span class="material-symbols-outlined">cloud_upload</span><span>Click para subir</span>`}</div></div>
                  <div class="detail-ine__item"><label>Reverso</label><div class="detail-ine__box ${c.ine_reverso ? 'has' : ''}">${c.ine_reverso ? `<img src="${c.ine_reverso}"><span class="check"><span class="material-symbols-outlined">check</span></span>` : `<span class="material-symbols-outlined">add_photo_alternate</span><span>Subir Reverso</span><small>PNG, JPG hasta 10MB</small>`}</div></div>
                </div>
                <button class="detail-card__btn"><span class="material-symbols-outlined">download</span> Descargar Docs</button>
              </div>
              <div class="detail-card dark">
                <h4><span class="material-symbols-outlined">contact_phone</span> Contacto</h4>
                <div class="detail-contact">
                  <p><strong>Teléfono:</strong> ${c.telefono || '-'}</p>
                  <p><strong>Tel. 2:</strong> ${c.telefono_secundario || '-'}</p>
                  <p><strong>Ref:</strong> ${c.referencia || '-'}</p>
                </div>
                <button class="detail-whatsapp" onclick="window.open('https://wa.me/52${c.telefono?.replace(/\\D/g, '')}', '_blank')"><span class="material-symbols-outlined">chat</span> WhatsApp</button>
              </div>
            </div>
          </div>
        </main>
      </div>
    `;

    document.body.appendChild(overlay);
    overlay.querySelectorAll('.detail-tabs__btn').forEach(btn => {
      btn.addEventListener('click', () => {
        overlay.querySelectorAll('.detail-tabs__btn').forEach(b => b.classList.remove('active'));
        overlay.querySelectorAll('.detail-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('panel-' + btn.dataset.tab).classList.add('active');
      });
    });
    requestAnimationFrame(() => overlay.classList.add('active'));
    cargarEquiposCliente(c.id);
    cargarPagosCliente(c.id);
  } catch (err) { console.error('Error:', err); toastError('Error al cargar cliente'); }
}

function cerrarModalDetalle() { const m = document.getElementById('modalDetalle'); if (m) { m.classList.remove('active'); setTimeout(() => m.remove(), 300); } }

async function cargarEquiposCliente(clienteId) {
  const tbody = document.getElementById('tablaEquipos');
  try {
    const data = await fetchGet(`/api/equipos?cliente_id=${clienteId}`);
    if (!data.ok || !data.equipos?.length) { tbody.innerHTML = `<tr><td colspan="4"><div class="detail-empty"><span class="material-symbols-outlined">router</span><p>Sin equipos registrados</p></div></td></tr>`; return; }
    tbody.innerHTML = data.equipos.map(e => `<tr><td><span class="material-symbols-outlined">${e.tipo === 'router' ? 'router' : 'cell_tower'}</span> ${e.marca || ''} ${e.modelo || ''}</td><td><code>${e.mac || '-'}</code></td><td>${e.serial || '-'}</td><td><span class="detail-status ${e.estado === 'activo' ? 'online' : 'offline'}"><span class="dot"></span>${e.estado === 'activo' ? 'Online' : 'Offline'}</span></td></tr>`).join('');
  } catch (err) { tbody.innerHTML = '<tr><td colspan="4" class="text-center">Error</td></tr>'; }
}

async function cargarPagosCliente(clienteId) {
  const container = document.getElementById('listaPagos');
  try {
    const data = await fetchGet(`/api/pagos?cliente_id=${clienteId}&limite=10`);
    if (!data.ok || !data.pagos?.length) { container.innerHTML = `<div class="detail-empty"><span class="material-symbols-outlined">receipt_long</span><p>Sin transacciones</p></div>`; return; }
    container.innerHTML = data.pagos.map(p => `<div class="detail-tx"><div class="detail-tx__icon ${p.tipo === 'mensualidad' ? 'green' : ''}"><span class="material-symbols-outlined">${p.tipo === 'mensualidad' ? 'add' : 'description'}</span></div><div class="detail-tx__info"><p class="detail-tx__title">Pago ${p.tipo || 'Servicio'}</p><p class="detail-tx__date">${formatoFecha(p.fecha_pago)} • ${p.metodo_pago || 'Efectivo'}</p></div><p class="detail-tx__amount">-${formatoMoneda(p.monto)}</p></div>`).join('');
  } catch (err) { container.innerHTML = '<p class="text-center">Error</p>'; }
}

function formatoFechaCorta(fecha) { if (!fecha) return '-'; return new Date(fecha).toLocaleDateString('es-MX', { month: 'short', day: 'numeric', year: 'numeric' }); }
function registrarPago(clienteId) { toastInfo('Módulo de pagos en desarrollo'); }
function agregarEquipo(clienteId) { toastInfo('Módulo de equipos en desarrollo'); }

// ========================================
// SKYNET - CLIENTES JS
// ========================================

let paginaActual = 1;
const porPagina = 10;
let filtroEstado = 'todos';
let ciudades = [], colonias = [], planes = [];

document.addEventListener('DOMContentLoaded', () => {
  verificarSesion();
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

// Catálogos
async function cargarCatalogos() {
  try {
    const [rCiudades, rPlanes] = await Promise.all([fetchGet('/api/catalogos/ciudades'), fetchGet('/api/catalogos/planes')]);
    if (rCiudades.ok) { ciudades = rCiudades.ciudades; llenarSelect('ciudadId', ciudades, 'id', 'nombre'); llenarSelect('nuevaColoniaCiudad', ciudades, 'id', 'nombre'); }
    if (rPlanes.ok) { planes = rPlanes.planes; llenarSelect('planId', planes, 'id', 'nombre'); }
  } catch (err) { console.error('Error:', err); }
}

function llenarSelect(id, datos, valorKey, textoKey) {
  const select = document.getElementById(id);
  if (!select) return;
  let html = '<option value="">Seleccionar...</option>';
  datos.forEach(item => { html += `<option value="${item[valorKey]}">${item[textoKey]}</option>`; });
  select.innerHTML = html;
}

async function cargarColoniasPorCiudad(ciudadId) {
  const select = document.getElementById('coloniaId');
  if (!ciudadId) { select.innerHTML = '<option value="">Seleccionar...</option>'; return; }
  try {
    const r = await fetchGet(`/api/catalogos/colonias?ciudad_id=${ciudadId}`);
    if (r.ok) { colonias = r.colonias; llenarSelect('coloniaId', colonias, 'id', 'nombre'); }
  } catch (err) { console.error('Error:', err); }
}

// Clientes
async function cargarClientes() {
  const tbody = document.getElementById('tablaClientes');
  tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Cargando...</td></tr>';

  try {
    const busqueda = document.getElementById('buscadorGlobal')?.value || '';
    let url = `/api/clientes?pagina=${paginaActual}&limite=${porPagina}`;
    if (filtroEstado !== 'todos') url += `&estado=${filtroEstado}`;
    if (busqueda) url += `&busqueda=${encodeURIComponent(busqueda)}`;

    const data = await fetchGet(url);

    if (!data.ok || !data.clientes?.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No se encontraron clientes</td></tr>';
      actualizarPaginacion(0, 0, 0);
      return;
    }

    const colores = ['blue', 'purple', 'green', 'orange', 'pink'];
    tbody.innerHTML = data.clientes.map((c, i) => `
      <tr onclick="verCliente('${c.id}')" style="cursor: pointer;">
        <td>
          <div class="table__user">
            <div class="table__avatar table__avatar--${colores[i % colores.length]}">${obtenerIniciales(c.nombre, c.apellido_paterno)}</div>
            <span class="table__name">${c.nombre} ${c.apellido_paterno || ''}</span>
          </div>
        </td>
        <td>${c.telefono || '-'}</td>
        <td>${c.ciudad_nombre || '-'}</td>
        <td>${c.colonia_nombre || '-'}</td>
        <td><span class="badge badge--${c.estado || 'activo'}">${(c.estado || 'activo').toUpperCase()}</span></td>
        <td class="font-semibold">${formatoMoneda(c.cuota_mensual)}</td>
        <td>
          <div class="table__actions" onclick="event.stopPropagation();">
            <button class="table__action-btn" onclick="verCliente('${c.id}')" title="Ver detalle"><span class="material-symbols-outlined">visibility</span></button>
            <button class="table__action-btn" onclick="editarClienteLista('${c.id}')" title="Editar"><span class="material-symbols-outlined">edit</span></button>
          </div>
        </td>
      </tr>
    `).join('');

    document.getElementById('totalClientes').textContent = data.total || data.clientes.length;
    actualizarPaginacion(data.paginaActual || paginaActual, porPagina, data.total || data.clientes.length);
    generarBotonesPaginacion(data.totalPaginas || 1, data.paginaActual || paginaActual);
  } catch (err) {
    console.error('Error:', err);
    tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Error al cargar</td></tr>';
  }
}

function actualizarPaginacion(pagina, porPag, total) {
  const inicio = total === 0 ? 0 : ((pagina - 1) * porPag) + 1;
  const fin = Math.min(pagina * porPag, total);
  document.getElementById('paginaInicio').textContent = inicio;
  document.getElementById('paginaFin').textContent = fin;
  document.getElementById('paginaTotal').textContent = total;
}

function generarBotonesPaginacion(totalPaginas, paginaActualNum) {
  const contenedor = document.getElementById('paginacionBtns');
  if (!contenedor) return;
  let html = `<button class="pagination__btn" onclick="irPagina(${paginaActualNum - 1})" ${paginaActualNum <= 1 ? 'disabled' : ''}><span class="material-symbols-outlined">chevron_left</span></button>`;
  for (let i = 1; i <= Math.min(totalPaginas, 3); i++) { html += `<button class="pagination__btn ${i === paginaActualNum ? 'active' : ''}" onclick="irPagina(${i})">${i}</button>`; }
  if (totalPaginas > 3) { html += `<button class="pagination__btn" disabled>...</button><button class="pagination__btn" onclick="irPagina(${totalPaginas})">${totalPaginas}</button>`; }
  html += `<button class="pagination__btn" onclick="irPagina(${paginaActualNum + 1})" ${paginaActualNum >= totalPaginas ? 'disabled' : ''}><span class="material-symbols-outlined">chevron_right</span></button>`;
  contenedor.innerHTML = html;
}

function irPagina(pagina) { if (pagina < 1) return; paginaActual = pagina; cargarClientes(); }

// Modal Cliente
function abrirModalNuevo() {
  document.getElementById('modalTitulo').textContent = 'Registrar Nuevo Cliente';
  document.getElementById('formCliente').reset();
  document.getElementById('clienteId').value = '';
  document.getElementById('coloniaId').innerHTML = '<option value="">Primero selecciona ciudad...</option>';
  document.getElementById('modalCliente').classList.add('active');
}

async function editarClienteLista(id) {
  try {
    const data = await fetchGet(`/api/clientes/${id}`);
    if (!data.ok) { toastError('Error al cargar cliente'); return; }
    const c = data.cliente;
    document.getElementById('modalTitulo').textContent = 'Editar Cliente';
    document.getElementById('clienteId').value = c.id;
    document.getElementById('nombre').value = c.nombre || '';
    document.getElementById('apellidoPaterno').value = c.apellido_paterno || '';
    document.getElementById('telefono').value = c.telefono || '';
    document.getElementById('email').value = c.email || '';
    document.getElementById('ciudadId').value = c.ciudad_id || '';
    if (c.ciudad_id) { await cargarColoniasPorCiudad(c.ciudad_id); document.getElementById('coloniaId').value = c.colonia_id || ''; }
    document.getElementById('direccion').value = c.direccion || '';
    document.getElementById('referencia').value = c.referencia || '';
    document.getElementById('planId').value = c.plan_id || '';
    document.getElementById('cuotaMensual').value = c.cuota_mensual || '';
    document.getElementById('modalCliente').classList.add('active');
  } catch (err) { console.error('Error:', err); toastError('Error al cargar cliente'); }
}

function cerrarModal() { document.getElementById('modalCliente').classList.remove('active'); }

async function guardarCliente() {
  const id = document.getElementById('clienteId').value;
  const btn = document.getElementById('btnGuardarCliente');
  const datos = {
    nombre: document.getElementById('nombre').value,
    apellido_paterno: document.getElementById('apellidoPaterno').value,
    telefono: document.getElementById('telefono').value,
    email: document.getElementById('email').value,
    ciudad_id: document.getElementById('ciudadId').value,
    colonia_id: document.getElementById('coloniaId').value,
    direccion: document.getElementById('direccion').value,
    referencia: document.getElementById('referencia').value,
    plan_id: document.getElementById('planId').value,
    cuota_mensual: parseFloat(document.getElementById('cuotaMensual').value) || 0
  };

  if (!datos.nombre || !datos.telefono || !datos.ciudad_id || !datos.colonia_id || !datos.direccion || !datos.plan_id) {
    toastAdvertencia('Por favor llena todos los campos requeridos');
    return;
  }

  btnLoading(btn, true);
  try {
    const data = id ? await fetchPut(`/api/clientes/${id}`, datos) : await fetchPost('/api/clientes', datos);
    btnLoading(btn, false);
    if (data.ok) {
      cerrarModal();
      if (id) {
        // Edición: recargar lista
        cargarClientes();
        toastExito('Cliente actualizado');
      } else {
        // Nuevo cliente: ir al detalle para instalar
        const clienteId = data.cliente?.id || data.id || data.cliente_id;
        if (clienteId) {
          toastExito('Cliente creado. Redirigiendo a instalación...');
          setTimeout(() => {
            window.location.href = `detalle.html?id=${clienteId}&instalacion=1`;
          }, 1000);
        } else {
          toastExito('Cliente creado exitosamente');
          cargarClientes();
        }
      }
    }
    else { toastError(data.mensaje || 'Error al guardar'); }
  } catch (err) { btnLoading(btn, false); toastError('Error al guardar cliente'); }
}

function verCliente(id) { window.location.href = `detalle.html?id=${id}`; }

// Modales Catálogos
function abrirModalCiudad() { document.getElementById('nuevaCiudadNombre').value = ''; document.getElementById('nuevaCiudadEstado').value = ''; document.getElementById('modalCiudad').classList.add('active'); }
function cerrarModalCiudad() { document.getElementById('modalCiudad').classList.remove('active'); }
async function guardarCiudad() {
  const nombre = document.getElementById('nuevaCiudadNombre').value.trim();
  const estado = document.getElementById('nuevaCiudadEstado').value.trim();
  const btn = document.getElementById('btnGuardarCiudad');
  if (!nombre) { toastAdvertencia('El nombre es requerido'); return; }
  btnLoading(btn, true);
  try {
    const data = await fetchPost('/api/catalogos/ciudades', { nombre, estado_republica: estado });
    btnLoading(btn, false);
    if (data.ok) { cerrarModalCiudad(); await cargarCatalogos(); if (data.ciudad?.id) { document.getElementById('ciudadId').value = data.ciudad.id; await cargarColoniasPorCiudad(data.ciudad.id); } toastExito('Ciudad creada'); }
    else { toastError(data.mensaje || 'Error'); }
  } catch (err) { btnLoading(btn, false); toastError('Error al crear ciudad'); }
}

function abrirModalColonia() { document.getElementById('nuevaColoniaNombre').value = ''; document.getElementById('nuevaColoniaCP').value = ''; llenarSelect('nuevaColoniaCiudad', ciudades, 'id', 'nombre'); const cs = document.getElementById('ciudadId').value; if (cs) document.getElementById('nuevaColoniaCiudad').value = cs; document.getElementById('modalColonia').classList.add('active'); }
function cerrarModalColonia() { document.getElementById('modalColonia').classList.remove('active'); }
async function guardarColonia() {
  const ciudadId = document.getElementById('nuevaColoniaCiudad').value;
  const nombre = document.getElementById('nuevaColoniaNombre').value.trim();
  const cp = document.getElementById('nuevaColoniaCP').value.trim();
  const btn = document.getElementById('btnGuardarColonia');
  if (!ciudadId || !nombre) { toastAdvertencia('Ciudad y nombre son requeridos'); return; }
  btnLoading(btn, true);
  try {
    const data = await fetchPost('/api/catalogos/colonias', { ciudad_id: ciudadId, nombre, codigo_postal: cp });
    btnLoading(btn, false);
    if (data.ok) { cerrarModalColonia(); await cargarColoniasPorCiudad(ciudadId); if (data.colonia?.id) document.getElementById('coloniaId').value = data.colonia.id; toastExito('Colonia creada'); }
    else { toastError(data.mensaje || 'Error'); }
  } catch (err) { btnLoading(btn, false); toastError('Error al crear colonia'); }
}

function abrirModalPlan() { document.getElementById('nuevoPlanNombre').value = ''; document.getElementById('nuevoPlanVelocidad').value = ''; document.getElementById('nuevoPlanPrecio').value = ''; document.getElementById('modalPlan').classList.add('active'); }
function cerrarModalPlan() { document.getElementById('modalPlan').classList.remove('active'); }
async function guardarPlan() {
  const nombre = document.getElementById('nuevoPlanNombre').value.trim();
  const velocidad = parseInt(document.getElementById('nuevoPlanVelocidad').value) || 0;
  const precio = parseFloat(document.getElementById('nuevoPlanPrecio').value) || 0;
  const btn = document.getElementById('btnGuardarPlan');
  if (!nombre || !velocidad || !precio) { toastAdvertencia('Todos los campos son requeridos'); return; }
  btnLoading(btn, true);
  try {
    const data = await fetchPost('/api/catalogos/planes', { nombre, velocidad_mbps: velocidad, precio_mensual: precio });
    btnLoading(btn, false);
    if (data.ok) { cerrarModalPlan(); await cargarCatalogos(); if (data.plan?.id) { document.getElementById('planId').value = data.plan.id; document.getElementById('cuotaMensual').value = data.plan.precio_mensual; } toastExito('Plan creado'); }
    else { toastError(data.mensaje || 'Error'); }
  } catch (err) { btnLoading(btn, false); toastError('Error al crear plan'); }
}

function exportarCSV() { toastInfo('Función de exportación próximamente...'); }

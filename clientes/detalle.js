// ========================================
// SKYNET - DETALLE CLIENTE JS
// ========================================

let clienteActual = null;
let ciudades = [], colonias = [], planes = [];

document.addEventListener('DOMContentLoaded', () => {
  verificarSesion();
  cargarUsuarioHeader();
  inicializarTabs();
  
  const params = new URLSearchParams(window.location.search);
  const clienteId = params.get('id');
  
  if (!clienteId) {
    toastError('Cliente no especificado');
    setTimeout(() => window.location.href = '/skynet-frontend/clientes/', 2000);
    return;
  }
  
  cargarCatalogosEdicion();
  cargarCliente(clienteId);
  
  // Evento submit del formulario de edición
  document.getElementById('formEdicion').addEventListener('submit', async (e) => {
    e.preventDefault();
    await guardarEdicion();
  });
  
  // Evento cambio de ciudad en edición
  document.getElementById('editCiudad').addEventListener('change', (e) => {
    cargarColoniasPorCiudadEdicion(e.target.value);
  });
  
  // Evento cambio de plan en edición
  document.getElementById('editPlan').addEventListener('change', (e) => {
    const plan = planes.find(p => p.id === e.target.value);
    if (plan) document.getElementById('editCuota').value = plan.precio_mensual;
  });
});

function inicializarTabs() {
  document.querySelectorAll('.detail-tabs__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.detail-tabs__btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.detail-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('panel-' + btn.dataset.tab).classList.add('active');
    });
  });
}

// Catálogos para edición
async function cargarCatalogosEdicion() {
  try {
    const [rCiudades, rPlanes] = await Promise.all([
      fetchGet('/api/catalogos/ciudades'),
      fetchGet('/api/catalogos/planes')
    ]);
    
    if (rCiudades.ok) {
      ciudades = rCiudades.ciudades;
      llenarSelect('editCiudad', ciudades);
    }
    
    if (rPlanes.ok) {
      planes = rPlanes.planes;
      llenarSelect('editPlan', planes);
    }
  } catch (err) {
    console.error('Error cargando catálogos:', err);
  }
}

function llenarSelect(id, datos) {
  const select = document.getElementById(id);
  if (!select) return;
  let html = '<option value="">Seleccionar...</option>';
  datos.forEach(item => { html += `<option value="${item.id}">${item.nombre}</option>`; });
  select.innerHTML = html;
}

async function cargarColoniasPorCiudadEdicion(ciudadId, seleccionarId = null) {
  const select = document.getElementById('editColonia');
  if (!ciudadId) { select.innerHTML = '<option value="">Seleccionar...</option>'; return; }
  
  try {
    const r = await fetchGet(`/api/catalogos/colonias?ciudad_id=${ciudadId}`);
    if (r.ok) {
      colonias = r.colonias;
      llenarSelect('editColonia', colonias);
      if (seleccionarId) select.value = seleccionarId;
    }
  } catch (err) { console.error('Error:', err); }
}

// Cargar cliente
async function cargarCliente(id) {
  try {
    const data = await fetchGet(`/api/clientes/${id}`);
    
    if (!data.ok) {
      toastError('Error al cargar cliente');
      return;
    }

    clienteActual = data.cliente;
    renderizarCliente(clienteActual);
    cargarEquipos(id);
    cargarPagos(id);
    inicializarSubidaINE();
    
  } catch (err) {
    console.error('Error:', err);
    toastError('Error al cargar cliente');
  }
}

function renderizarCliente(c) {
  // Avatar
  document.getElementById('clienteAvatar').textContent = obtenerIniciales(c.nombre, c.apellido_paterno);
  
  // Nombre con ID
  document.getElementById('clienteNombre').textContent = `${c.nombre} ${c.apellido_paterno || ''} ${c.apellido_materno || ''} - ID: #${c.numero_cliente || 'SKY-0000'}`.trim();
  
  // Badge Estado
  const badge = document.getElementById('clienteEstado');
  badge.textContent = (c.estado || 'activo').toUpperCase();
  badge.className = 'profile-card__badge ' + (c.estado || 'activo');
  
  // Email y dirección
  document.getElementById('clienteEmail').innerHTML = `<span class="material-symbols-outlined">mail</span> ${c.email || 'Sin email'}`;
  document.getElementById('clienteDireccion').innerHTML = `<span class="material-symbols-outlined">location_on</span> ${c.direccion || ''}, ${c.colonia_nombre || ''}, ${c.ciudad_nombre || ''}`;
  
  // Stats
  document.getElementById('cuotaMensual').innerHTML = `${formatoMoneda(c.cuota_mensual)} <small>/mes</small>`;
  document.getElementById('planNombre').textContent = `Plan: ${c.plan_nombre || 'Sin plan'}`;
  
  // Saldo
  const saldo = c.saldo_pendiente || 0;
  document.getElementById('saldoActual').textContent = formatoMoneda(saldo);
  const estadoCuenta = document.getElementById('estadoCuenta');
  estadoCuenta.textContent = saldo > 0 ? 'Saldo pendiente' : 'Cuenta al corriente';
  estadoCuenta.className = 'detail-stat__sub ' + (saldo > 0 ? 'danger' : 'success');
  
  // Próximo corte
  const hoy = new Date();
  let proximoCorte = new Date(hoy.getFullYear(), hoy.getMonth(), c.dia_corte || 10);
  if (proximoCorte < hoy) proximoCorte = new Date(hoy.getFullYear(), hoy.getMonth() + 1, c.dia_corte || 10);
  const diasRestantes = Math.ceil((proximoCorte - hoy) / (1000 * 60 * 60 * 24));
  
  document.getElementById('proximoCorte').textContent = proximoCorte.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  document.getElementById('diasRestantes').textContent = `En ${diasRestantes} días`;
  
  // Contacto
  document.getElementById('clienteTelefono').textContent = c.telefono || '--';
  document.getElementById('clienteTelefono2').textContent = c.telefono_secundario || '--';
  
  // WhatsApp
  document.getElementById('btnWhatsApp').onclick = () => {
    const tel = c.telefono?.replace(/\D/g, '');
    if (tel) window.open(`https://wa.me/52${tel}`, '_blank');
  };
  
  // INE
  renderizarINE(c);
}

// ========================================
// MODO EDICIÓN
// ========================================

async function activarModoEdicion() {
  if (!clienteActual) return;
  
  // Llenar formulario con datos actuales
  document.getElementById('editNombre').value = clienteActual.nombre || '';
  document.getElementById('editApellido').value = clienteActual.apellido_paterno || '';
  document.getElementById('editTelefono').value = clienteActual.telefono || '';
  document.getElementById('editEmail').value = clienteActual.email || '';
  document.getElementById('editDireccion').value = clienteActual.direccion || '';
  document.getElementById('editReferencia').value = clienteActual.referencia || '';
  document.getElementById('editCuota').value = clienteActual.cuota_mensual || '';
  document.getElementById('editDiaCorte').value = clienteActual.dia_corte || 10;
  document.getElementById('editEstado').value = clienteActual.estado || 'activo';
  
  // Seleccionar ciudad y cargar colonias
  document.getElementById('editCiudad').value = clienteActual.ciudad_id || '';
  if (clienteActual.ciudad_id) {
    await cargarColoniasPorCiudadEdicion(clienteActual.ciudad_id, clienteActual.colonia_id);
  }
  
  // Seleccionar plan
  document.getElementById('editPlan').value = clienteActual.plan_id || '';
  
  // Mostrar modo edición
  document.getElementById('perfilVista').classList.add('hidden');
  document.getElementById('perfilEdicion').classList.remove('hidden');
}

function cancelarEdicion() {
  document.getElementById('perfilEdicion').classList.add('hidden');
  document.getElementById('perfilVista').classList.remove('hidden');
}

async function guardarEdicion() {
  const btn = document.getElementById('btnGuardarEdicion');
  
  const datos = {
    nombre: document.getElementById('editNombre').value,
    apellido_paterno: document.getElementById('editApellido').value,
    telefono: document.getElementById('editTelefono').value,
    email: document.getElementById('editEmail').value,
    ciudad_id: document.getElementById('editCiudad').value,
    colonia_id: document.getElementById('editColonia').value,
    direccion: document.getElementById('editDireccion').value,
    referencia: document.getElementById('editReferencia').value,
    plan_id: document.getElementById('editPlan').value,
    cuota_mensual: parseFloat(document.getElementById('editCuota').value) || 0,
    dia_corte: parseInt(document.getElementById('editDiaCorte').value) || 10,
    estado: document.getElementById('editEstado').value
  };
  
  if (!datos.nombre || !datos.telefono || !datos.ciudad_id || !datos.colonia_id || !datos.direccion || !datos.plan_id) {
    toastAdvertencia('Por favor llena todos los campos requeridos');
    return;
  }
  
  btnLoading(btn, true);
  
  try {
    const data = await fetchPut(`/api/clientes/${clienteActual.id}`, datos);
    btnLoading(btn, false);
    
    if (data.ok) {
      toastExito('Cliente actualizado correctamente');
      cancelarEdicion();
      cargarCliente(clienteActual.id); // Recargar datos
    } else {
      toastError(data.mensaje || 'Error al guardar');
    }
  } catch (err) {
    console.error('Error:', err);
    btnLoading(btn, false);
    toastError('Error al guardar cliente');
  }
}

// ========================================
// INE
// ========================================

function renderizarINE(c) {
  const ineFrente = document.getElementById('ineFrente');
  const ineReverso = document.getElementById('ineReverso');
  
  ineFrente.classList.remove('has-image');
  ineReverso.classList.remove('has-image');
  
  if (c.ine_frente) {
    ineFrente.classList.add('has-image');
    ineFrente.innerHTML = `<img src="${c.ine_frente}" alt="INE Frente"><span class="check"><span class="material-symbols-outlined">check</span></span>`;
  } else {
    ineFrente.innerHTML = `<span class="material-symbols-outlined">cloud_upload</span><span>Clic para subir</span>`;
  }
  
  if (c.ine_reverso) {
    ineReverso.classList.add('has-image');
    ineReverso.innerHTML = `<img src="${c.ine_reverso}" alt="INE Reverso"><span class="check"><span class="material-symbols-outlined">check</span></span>`;
  } else {
    ineReverso.innerHTML = `<span class="material-symbols-outlined">add_photo_alternate</span><span>Subir Reverso</span><small>PNG, JPG hasta 10MB</small>`;
  }
}

function inicializarSubidaINE() {
  document.getElementById('ineFrente').onclick = () => seleccionarArchivo('ine_frente');
  document.getElementById('ineReverso').onclick = () => seleccionarArchivo('ine_reverso');
}

function seleccionarArchivo(tipo) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = (e) => {
    const archivo = e.target.files[0];
    if (archivo) {
      if (archivo.size > 10 * 1024 * 1024) { toastError('El archivo no debe superar 10MB'); return; }
      subirINE(archivo, tipo);
    }
  };
  input.click();
}

async function subirINE(archivo, tipo) {
  if (!clienteActual) return;
  
  const box = document.getElementById(tipo === 'ine_frente' ? 'ineFrente' : 'ineReverso');
  box.innerHTML = `<span class="material-symbols-outlined" style="animation: spin 1s linear infinite;">sync</span><span>Subiendo...</span>`;
  
  try {
    const base64 = await convertirABase64(archivo);
    const data = await fetchPost('/api/documentos/subir', { cliente_id: clienteActual.id, tipo: tipo, imagen: base64 });
    
    if (data.ok) {
      toastExito('Documento subido correctamente');
      clienteActual[tipo] = data.url;
      renderizarINE(clienteActual);
    } else {
      toastError(data.mensaje || 'Error al subir');
      renderizarINE(clienteActual);
    }
  } catch (err) {
    console.error('Error:', err);
    toastError('Error al subir documento');
    renderizarINE(clienteActual);
  }
}

function convertirABase64(archivo) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(archivo);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

// ========================================
// EQUIPOS Y PAGOS
// ========================================

async function cargarEquipos(clienteId) {
  const tbody = document.getElementById('tablaEquipos');
  try {
    const data = await fetchGet(`/api/equipos?cliente_id=${clienteId}`);
    if (!data.ok || !data.equipos?.length) {
      tbody.innerHTML = `<tr><td colspan="4"><div class="empty-state"><span class="material-symbols-outlined">router</span><p>Sin equipos registrados</p></div></td></tr>`;
      return;
    }
    tbody.innerHTML = data.equipos.map(e => `
      <tr>
        <td>${e.marca || ''} ${e.modelo || ''}</td>
        <td><code style="font-size: 12px; color: var(--text-muted);">${e.mac || '--'}</code></td>
        <td>${e.serial || '--'}</td>
        <td><span class="equipment-status ${e.estado === 'activo' ? 'online' : 'offline'}">${e.estado === 'activo' ? 'En línea' : 'Desconectado'}</span></td>
      </tr>
    `).join('');
  } catch (err) { tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Error al cargar</td></tr>'; }
}

async function cargarPagos(clienteId) {
  const container = document.getElementById('listaPagos');
  try {
    const data = await fetchGet(`/api/pagos?cliente_id=${clienteId}&limite=10`);
    if (!data.ok || !data.pagos?.length) {
      container.innerHTML = `<div class="empty-state"><span class="material-symbols-outlined">receipt_long</span><p>Sin transacciones registradas</p></div>`;
      return;
    }
    container.innerHTML = data.pagos.map(p => `
      <div class="transaction-item">
        <div class="transaction-item__icon green"><span class="material-symbols-outlined">add</span></div>
        <div class="transaction-item__info">
          <p class="transaction-item__title">Pago de Mensualidad</p>
          <p class="transaction-item__date">${formatoFecha(p.fecha_pago)} • ${p.metodo_pago || 'Efectivo'}</p>
        </div>
        <p class="transaction-item__amount">-${formatoMoneda(p.monto)}</p>
      </div>
    `).join('');
  } catch (err) { container.innerHTML = '<p class="text-center text-muted">Error al cargar</p>'; }
}

function registrarPago() {
  toastInfo('Módulo de pagos próximamente');
}

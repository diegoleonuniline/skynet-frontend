// ========================================
// SKYNET - DETALLE CLIENTE JS
// Sistema completo de cargos y pagos
// ========================================

let clienteActual = null;
let ciudades = [], colonias = [], planes = [];
let tiposEquipo = [], estadosEquipo = [];
let metodosPago = [];
let comprobanteBase64 = null;

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
  
  cargarTodosCatalogos();
  cargarCliente(clienteId);
  
  // Eventos
  document.getElementById('formEdicion').addEventListener('submit', async (e) => {
    e.preventDefault();
    await guardarEdicion();
  });
  
  document.getElementById('editCiudad').addEventListener('change', (e) => {
    cargarColoniasPorCiudadEdicion(e.target.value);
  });
  
  document.getElementById('editPlan').addEventListener('change', (e) => {
    const plan = planes.find(p => p.id === e.target.value);
    if (plan) document.getElementById('editTarifa').value = plan.precio_mensual;
  });
  
  // Evento comprobante
  document.getElementById('comprobanteInput').addEventListener('change', handleComprobanteChange);
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

// ========================================
// CARGAR CATÁLOGOS
// ========================================

async function cargarTodosCatalogos() {
  try {
    const [rCiudades, rPlanes, rTipos, rEstados, rMetodos] = await Promise.all([
      fetchGet('/api/catalogos/ciudades'),
      fetchGet('/api/catalogos/planes'),
      fetchGet('/api/equipos/tipos'),
      fetchGet('/api/equipos/estados'),
      fetchGet('/api/pagos/metodos')
    ]);
    
    if (rCiudades.ok) { ciudades = rCiudades.ciudades; llenarSelect('editCiudad', ciudades); }
    if (rPlanes.ok) { planes = rPlanes.planes; llenarSelect('editPlan', planes); }
    if (rTipos.ok) { tiposEquipo = rTipos.tipos; llenarSelect('equipoTipo', tiposEquipo); }
    if (rEstados.ok) { estadosEquipo = rEstados.estados; llenarSelect('equipoEstado', estadosEquipo); }
    if (rMetodos.ok) { metodosPago = rMetodos.metodos; llenarSelect('pagoMetodo', metodosPago); }
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

// ========================================
// CARGAR CLIENTE
// ========================================

async function cargarCliente(id) {
  try {
    const data = await fetchGet(`/api/clientes/${id}`);
    
    if (!data.ok) {
      toastError('Error al cargar cliente');
      return;
    }

    clienteActual = data.cliente;
    renderizarCliente(clienteActual);
    cargarCargos(id);
    cargarHistorialPagos(id);
    cargarEquipos(id);
    inicializarSubidaINE();
    
  } catch (err) {
    console.error('Error:', err);
    toastError('Error al cargar cliente');
  }
}

function renderizarCliente(c) {
  document.getElementById('clienteAvatar').textContent = obtenerIniciales(c.nombre, c.apellido_paterno);
  document.getElementById('clienteNombre').textContent = `${c.nombre} ${c.apellido_paterno || ''} - ID: #${c.numero_cliente || 'SKY-0000'}`.trim();
  
  const badge = document.getElementById('clienteEstado');
  badge.textContent = (c.estado || 'activo').toUpperCase();
  badge.className = 'profile-card__badge ' + (c.estado || 'activo');
  
  document.getElementById('clienteEmail').innerHTML = `<span class="material-symbols-outlined">mail</span> ${c.email || 'Sin email'}`;
  document.getElementById('clienteDireccion').innerHTML = `<span class="material-symbols-outlined">location_on</span> ${c.direccion || ''}, ${c.colonia_nombre || ''}, ${c.ciudad_nombre || ''}`;
  
  // Stats
  document.getElementById('tarifaMensual').innerHTML = `${formatoMoneda(c.tarifa_mensual)} <small>/mes</small>`;
  document.getElementById('planNombre').textContent = `Plan: ${c.plan_nombre || 'Sin plan'}`;
  
  // Adeudo
  const adeudo = parseFloat(c.saldo_pendiente) || 0;
  document.getElementById('adeudoTotal').textContent = formatoMoneda(adeudo);
  const estadoCuenta = document.getElementById('estadoCuenta');
  if (adeudo > 0) {
    estadoCuenta.textContent = 'Tiene adeudo pendiente';
    estadoCuenta.className = 'detail-stat__sub danger';
  } else {
    estadoCuenta.textContent = 'Cuenta al corriente';
    estadoCuenta.className = 'detail-stat__sub success';
  }
  
  // Saldo a favor
  const saldoFavor = parseFloat(c.saldo_favor) || 0;
  document.getElementById('saldoFavor').textContent = formatoMoneda(saldoFavor);
  
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
  
  // Verificar si mostrar botón de instalación
  verificarInstalacion();
  
  renderizarINE(c);
}

// ========================================
// CARGOS
// ========================================

async function cargarCargos(clienteId) {
  const tbody = document.getElementById('tablaCargos');
  try {
    const data = await fetchGet(`/api/cargos?cliente_id=${clienteId}`);
    if (!data.ok || !data.cargos?.length) {
      tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><span class="material-symbols-outlined">check_circle</span><p>Sin cargos pendientes</p></div></td></tr>`;
      return;
    }
    
    tbody.innerHTML = data.cargos.map(c => {
      const estadoClass = c.estado === 'pagado' ? 'success' : c.estado === 'parcial' ? 'warning' : 'danger';
      const estadoTexto = c.estado === 'pagado' ? 'Pagado' : c.estado === 'parcial' ? 'Parcial' : 'Pendiente';
      return `
      <tr>
        <td><strong>${c.concepto}</strong><br><small class="text-muted">${c.descripcion || ''}</small></td>
        <td>${formatoFecha(c.fecha_vencimiento)}</td>
        <td>${formatoMoneda(c.monto)}</td>
        <td>${formatoMoneda(c.monto_pagado)}</td>
        <td><strong style="color: var(--${estadoClass})">${formatoMoneda(c.saldo_pendiente)}</strong></td>
        <td><span class="badge badge--${estadoClass}">${estadoTexto}</span></td>
      </tr>
    `}).join('');
  } catch (err) { 
    console.error('Error:', err);
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Error al cargar</td></tr>'; 
  }
}

// ========================================
// HISTORIAL DE PAGOS
// ========================================

async function cargarHistorialPagos(clienteId) {
  const container = document.getElementById('listaPagos');
  try {
    const data = await fetchGet(`/api/pagos/historial/${clienteId}`);
    if (!data.ok || !data.pagos?.length) {
      container.innerHTML = `<div class="empty-state"><span class="material-symbols-outlined">receipt_long</span><p>Sin pagos registrados</p></div>`;
      return;
    }
    container.innerHTML = data.pagos.map(p => `
      <div class="transaction-item">
        <div class="transaction-item__icon green"><span class="material-symbols-outlined">check</span></div>
        <div class="transaction-item__info">
          <p class="transaction-item__title">${p.metodo_nombre || 'Pago'}</p>
          <p class="transaction-item__date">${formatoFecha(p.fecha_pago)} ${p.referencia ? '• Ref: ' + p.referencia : ''}</p>
          ${p.aplicado_a ? `<p class="transaction-item__detail">${p.aplicado_a}</p>` : ''}
        </div>
        <p class="transaction-item__amount">${formatoMoneda(p.monto)}</p>
        ${p.comprobante_url ? `<a href="${p.comprobante_url}" target="_blank" class="btn btn-sm btn-secondary" style="margin-left: 8px;"><span class="material-symbols-outlined">receipt</span></a>` : ''}
      </div>
    `).join('');
  } catch (err) { 
    console.error('Error:', err);
    container.innerHTML = '<p class="text-center text-muted">Error al cargar</p>'; 
  }
}

// ========================================
// MODAL PAGO
// ========================================

async function abrirModalPago() {
  document.getElementById('formPago').reset();
  comprobanteBase64 = null;
  document.getElementById('comprobanteUpload').innerHTML = `
    <span class="material-symbols-outlined">cloud_upload</span>
    <span>Clic para subir comprobante</span>
    <small>PNG, JPG, PDF hasta 5MB</small>
  `;
  
  // Recargar métodos
  await cargarMetodosPago();
  
  // Mostrar resumen
  const adeudo = parseFloat(clienteActual?.saldo_pendiente) || 0;
  const saldoFavor = parseFloat(clienteActual?.saldo_favor) || 0;
  document.getElementById('pagoAdeudoTotal').textContent = formatoMoneda(adeudo);
  document.getElementById('pagoSaldoFavor').textContent = formatoMoneda(saldoFavor);
  
  document.getElementById('modalPago').classList.add('active');
}

function cerrarModalPago() {
  document.getElementById('modalPago').classList.remove('active');
}

async function cargarMetodosPago() {
  try {
    const r = await fetchGet('/api/pagos/metodos');
    if (r.ok) {
      metodosPago = r.metodos;
      llenarSelect('pagoMetodo', metodosPago);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

function seleccionarComprobante() {
  document.getElementById('comprobanteInput').click();
}

async function handleComprobanteChange(e) {
  const archivo = e.target.files[0];
  if (!archivo) return;
  
  if (archivo.size > 5 * 1024 * 1024) {
    toastError('El archivo no debe superar 5MB');
    return;
  }
  
  const upload = document.getElementById('comprobanteUpload');
  upload.innerHTML = `<span class="material-symbols-outlined" style="animation: spin 1s linear infinite;">sync</span><span>Procesando...</span>`;
  
  try {
    comprobanteBase64 = await convertirABase64(archivo);
    upload.innerHTML = `
      <span class="material-symbols-outlined" style="color: var(--success);">check_circle</span>
      <span style="color: var(--success);">Comprobante cargado</span>
      <small>${archivo.name}</small>
    `;
  } catch (err) {
    console.error('Error:', err);
    toastError('Error al procesar archivo');
    upload.innerHTML = `
      <span class="material-symbols-outlined">cloud_upload</span>
      <span>Clic para subir comprobante</span>
      <small>PNG, JPG, PDF hasta 5MB</small>
    `;
  }
}

async function guardarPago() {
  const btn = document.getElementById('btnGuardarPago');
  const monto = parseFloat(document.getElementById('pagoMonto').value);
  const metodo = document.getElementById('pagoMetodo').value;
  
  if (!monto || monto <= 0) {
    toastAdvertencia('Ingresa un monto válido');
    return;
  }
  
  if (!metodo) {
    toastAdvertencia('Selecciona un método de pago');
    return;
  }
  
  btnLoading(btn, true);
  
  try {
    // Subir comprobante a Cloudinary si existe
    let comprobanteUrl = null;
    if (comprobanteBase64) {
      const uploadData = await fetchPost('/api/documentos/subir', {
        cliente_id: clienteActual.id,
        tipo: 'comprobante_pago',
        imagen: comprobanteBase64
      });
      if (uploadData.ok) {
        comprobanteUrl = uploadData.url;
      }
    }
    
    // Registrar pago
    const datos = {
      cliente_id: clienteActual.id,
      monto: monto,
      metodo_pago_id: metodo,
      referencia: document.getElementById('pagoReferencia').value,
      banco: document.getElementById('pagoBanco').value,
      quien_paga: document.getElementById('pagoQuienPaga').value,
      telefono_quien_paga: document.getElementById('pagoTelQuienPaga').value,
      comprobante_url: comprobanteUrl,
      observaciones: document.getElementById('pagoObservaciones').value
    };
    
    const data = await fetchPost('/api/pagos', datos);
    btnLoading(btn, false);
    
    if (data.ok) {
      cerrarModalPago();
      
      // Mostrar resumen del pago
      let mensaje = `Pago de ${formatoMoneda(monto)} registrado.`;
      if (data.pago.cargos_aplicados > 0) {
        mensaje += ` Se aplicó a ${data.pago.cargos_aplicados} cargo(s).`;
      }
      if (data.pago.nuevo_saldo_favor > 0) {
        mensaje += ` Nuevo saldo a favor: ${formatoMoneda(data.pago.nuevo_saldo_favor)}`;
      }
      
      toastExito(mensaje);
      
      // Recargar datos
      cargarCliente(clienteActual.id);
    } else {
      toastError(data.mensaje || 'Error al registrar pago');
    }
  } catch (err) {
    console.error('Error:', err);
    btnLoading(btn, false);
    toastError('Error al registrar pago');
  }
}

// ========================================
// MODAL MÉTODO DE PAGO
// ========================================

function abrirModalMetodoPago() {
  document.getElementById('nuevoMetodoNombre').value = '';
  document.getElementById('nuevoMetodoReferencia').value = '0';
  document.getElementById('modalMetodoPago').classList.add('active');
}

function cerrarModalMetodoPago() {
  document.getElementById('modalMetodoPago').classList.remove('active');
}

async function guardarMetodoPago() {
  const nombre = document.getElementById('nuevoMetodoNombre').value.trim();
  const requiere_referencia = parseInt(document.getElementById('nuevoMetodoReferencia').value);
  const btn = document.getElementById('btnGuardarMetodoPago');
  
  if (!nombre) {
    toastAdvertencia('El nombre es requerido');
    return;
  }
  
  btnLoading(btn, true);
  
  try {
    const data = await fetchPost('/api/pagos/metodos', { nombre, requiere_referencia });
    btnLoading(btn, false);
    
    if (data.ok) {
      cerrarModalMetodoPago();
      await cargarMetodosPago();
      if (data.metodo?.id) {
        document.getElementById('pagoMetodo').value = data.metodo.id;
      }
      toastExito('Método de pago creado');
    } else {
      toastError(data.mensaje || 'Error al crear');
    }
  } catch (err) {
    console.error('Error:', err);
    btnLoading(btn, false);
    toastError('Error al crear método');
  }
}

// ========================================
// MODO EDICIÓN CLIENTE
// ========================================

async function activarModoEdicion() {
  if (!clienteActual) return;
  
  document.getElementById('editNombre').value = clienteActual.nombre || '';
  document.getElementById('editApellido').value = clienteActual.apellido_paterno || '';
  document.getElementById('editTelefono').value = clienteActual.telefono || '';
  document.getElementById('editEmail').value = clienteActual.email || '';
  document.getElementById('editDireccion').value = clienteActual.direccion || '';
  document.getElementById('editReferencia').value = clienteActual.referencia || '';
  document.getElementById('editTarifa').value = clienteActual.tarifa_mensual || '';
  document.getElementById('editDiaCorte').value = clienteActual.dia_corte || 10;
  document.getElementById('editEstado').value = clienteActual.estado || 'activo';
  
  document.getElementById('editCiudad').value = clienteActual.ciudad_id || '';
  if (clienteActual.ciudad_id) {
    await cargarColoniasPorCiudadEdicion(clienteActual.ciudad_id, clienteActual.colonia_id);
  }
  
  document.getElementById('editPlan').value = clienteActual.plan_id || '';
  
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
    tarifa_mensual: parseFloat(document.getElementById('editTarifa').value) || 0,
    dia_corte: parseInt(document.getElementById('editDiaCorte').value) || 10,
    estado: document.getElementById('editEstado').value
  };
  
  if (!datos.nombre || !datos.telefono) {
    toastAdvertencia('Nombre y teléfono son requeridos');
    return;
  }
  
  btnLoading(btn, true);
  
  try {
    const data = await fetchPut(`/api/clientes/${clienteActual.id}`, datos);
    btnLoading(btn, false);
    
    if (data.ok) {
      toastExito('Cliente actualizado');
      cancelarEdicion();
      cargarCliente(clienteActual.id);
    } else {
      toastError(data.mensaje || 'Error al guardar');
    }
  } catch (err) {
    console.error('Error:', err);
    btnLoading(btn, false);
    toastError('Error al guardar');
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
  document.getElementById('ineFrente').onclick = () => seleccionarArchivoINE('ine_frente');
  document.getElementById('ineReverso').onclick = () => seleccionarArchivoINE('ine_reverso');
}

function seleccionarArchivoINE(tipo) {
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
      toastExito('Documento subido');
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
// EQUIPOS
// ========================================

async function cargarEquipos(clienteId) {
  const tbody = document.getElementById('tablaEquipos');
  try {
    const data = await fetchGet(`/api/equipos?cliente_id=${clienteId}`);
    if (!data.ok || !data.equipos?.length) {
      tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><span class="material-symbols-outlined">router</span><p>Sin equipos registrados</p><button class="btn btn-sm btn-primary" onclick="abrirModalEquipo()" style="margin-top: 12px;"><span class="material-symbols-outlined">add</span>Agregar Equipo</button></div></td></tr>`;
      return;
    }
    tbody.innerHTML = data.equipos.map(e => {
      const esOperativo = e.es_operativo == 1;
      const colorEstado = e.estado_color || '#64748b';
      return `
      <tr>
        <td><span class="badge" style="background: ${colorEstado}20; color: ${colorEstado};">${e.tipo_nombre || 'Sin tipo'}</span></td>
        <td><strong>${e.marca || '-'}</strong> ${e.modelo || ''}</td>
        <td><code style="font-size: 12px; color: var(--text-muted);">${e.mac || '--'}</code></td>
        <td>${e.serie || '--'}</td>
        <td><span class="equipment-status ${esOperativo ? 'online' : 'offline'}" style="color: ${colorEstado};">${e.estado_nombre || 'Sin estado'}</span></td>
        <td>
          <div class="table__actions">
            <button class="table__action-btn" onclick="editarEquipo('${e.id}')" title="Editar"><span class="material-symbols-outlined">edit</span></button>
            <button class="table__action-btn" onclick="eliminarEquipo('${e.id}')" title="Eliminar"><span class="material-symbols-outlined">delete</span></button>
          </div>
        </td>
      </tr>
    `}).join('');
  } catch (err) { 
    console.error('Error:', err);
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Error al cargar</td></tr>'; 
  }
}

let equipoAEliminar = null;

async function abrirModalEquipo() {
  document.getElementById('modalEquipoTitulo').textContent = 'Agregar Equipo';
  document.getElementById('formEquipo').reset();
  document.getElementById('equipoId').value = '';
  document.getElementById('equipoFechaInstalacion').value = new Date().toISOString().split('T')[0];
  await cargarCatalogosEquipos();
  document.getElementById('modalEquipo').classList.add('active');
}

async function cargarCatalogosEquipos() {
  try {
    const [rTipos, rEstados] = await Promise.all([
      fetchGet('/api/equipos/tipos'),
      fetchGet('/api/equipos/estados')
    ]);
    if (rTipos.ok) { tiposEquipo = rTipos.tipos; llenarSelect('equipoTipo', tiposEquipo); }
    if (rEstados.ok) { estadosEquipo = rEstados.estados; llenarSelect('equipoEstado', estadosEquipo); }
  } catch (err) { console.error('Error:', err); }
}

async function editarEquipo(id) {
  await cargarCatalogosEquipos();
  try {
    const data = await fetchGet(`/api/equipos/${id}`);
    if (!data.ok) { toastError('Error al cargar equipo'); return; }
    
    const e = data.equipo;
    document.getElementById('modalEquipoTitulo').textContent = 'Editar Equipo';
    document.getElementById('equipoId').value = e.id;
    document.getElementById('equipoTipo').value = e.tipo || '';
    document.getElementById('equipoMarca').value = e.marca || '';
    document.getElementById('equipoModelo').value = e.modelo || '';
    document.getElementById('equipoSerial').value = e.serie || '';
    document.getElementById('equipoMac').value = e.mac || '';
    document.getElementById('equipoIp').value = e.ip || '';
    document.getElementById('equipoEstado').value = e.estado || '';
    document.getElementById('equipoFechaInstalacion').value = e.fecha_instalacion?.split('T')[0] || '';
    document.getElementById('equipoNotas').value = e.notas || '';
    document.getElementById('modalEquipo').classList.add('active');
  } catch (err) {
    console.error('Error:', err);
    toastError('Error al cargar equipo');
  }
}

function cerrarModalEquipo() { document.getElementById('modalEquipo').classList.remove('active'); }

async function guardarEquipo() {
  const id = document.getElementById('equipoId').value;
  const btn = document.getElementById('btnGuardarEquipo');
  
  const datos = {
    cliente_id: clienteActual.id,
    tipo: document.getElementById('equipoTipo').value,
    marca: document.getElementById('equipoMarca').value,
    modelo: document.getElementById('equipoModelo').value,
    serie: document.getElementById('equipoSerial').value,
    mac: document.getElementById('equipoMac').value.toUpperCase(),
    ip: document.getElementById('equipoIp').value,
    estado: document.getElementById('equipoEstado').value,
    fecha_instalacion: document.getElementById('equipoFechaInstalacion').value || null,
    notas: document.getElementById('equipoNotas').value
  };
  
  if (!datos.tipo || !datos.estado) {
    toastAdvertencia('Tipo y estado son requeridos');
    return;
  }
  
  btnLoading(btn, true);
  
  try {
    const data = id ? await fetchPut(`/api/equipos/${id}`, datos) : await fetchPost('/api/equipos', datos);
    btnLoading(btn, false);
    
    if (data.ok) {
      cerrarModalEquipo();
      cargarEquipos(clienteActual.id);
      toastExito(id ? 'Equipo actualizado' : 'Equipo agregado');
    } else {
      toastError(data.mensaje || 'Error al guardar');
    }
  } catch (err) {
    console.error('Error:', err);
    btnLoading(btn, false);
    toastError('Error al guardar equipo');
  }
}

function eliminarEquipo(id) {
  equipoAEliminar = id;
  document.getElementById('modalConfirmarEliminar').classList.add('active');
}

function cerrarModalConfirmar() {
  document.getElementById('modalConfirmarEliminar').classList.remove('active');
  equipoAEliminar = null;
}

async function confirmarEliminarEquipo() {
  if (!equipoAEliminar) return;
  const btn = document.getElementById('btnConfirmarEliminar');
  btnLoading(btn, true);
  try {
    const data = await fetchDelete(`/api/equipos/${equipoAEliminar}`);
    btnLoading(btn, false);
    if (data.ok) {
      cerrarModalConfirmar();
      cargarEquipos(clienteActual.id);
      toastExito('Equipo eliminado');
    } else { toastError(data.mensaje || 'Error al eliminar'); }
  } catch (err) {
    console.error('Error:', err);
    btnLoading(btn, false);
    toastError('Error al eliminar');
  }
}

// Catálogos equipos
function abrirModalTipoEquipo() {
  document.getElementById('nuevoTipoNombre').value = '';
  document.getElementById('nuevoTipoDescripcion').value = '';
  document.getElementById('modalTipoEquipo').classList.add('active');
}
function cerrarModalTipoEquipo() { document.getElementById('modalTipoEquipo').classList.remove('active'); }
async function guardarTipoEquipo() {
  const nombre = document.getElementById('nuevoTipoNombre').value.trim();
  const descripcion = document.getElementById('nuevoTipoDescripcion').value.trim();
  const btn = document.getElementById('btnGuardarTipoEquipo');
  if (!nombre) { toastAdvertencia('Nombre requerido'); return; }
  btnLoading(btn, true);
  try {
    const data = await fetchPost('/api/equipos/tipos', { nombre, descripcion });
    btnLoading(btn, false);
    if (data.ok) {
      cerrarModalTipoEquipo();
      await cargarCatalogosEquipos();
      if (data.tipo?.id) document.getElementById('equipoTipo').value = data.tipo.id;
      toastExito('Tipo creado');
    } else { toastError(data.mensaje || 'Error'); }
  } catch (err) { btnLoading(btn, false); toastError('Error'); }
}

function abrirModalEstadoEquipo() {
  document.getElementById('nuevoEstadoNombre').value = '';
  document.getElementById('nuevoEstadoColor').value = '#64748b';
  document.getElementById('nuevoEstadoOperativo').value = '0';
  document.getElementById('modalEstadoEquipo').classList.add('active');
}
function cerrarModalEstadoEquipo() { document.getElementById('modalEstadoEquipo').classList.remove('active'); }
async function guardarEstadoEquipo() {
  const nombre = document.getElementById('nuevoEstadoNombre').value.trim();
  const color = document.getElementById('nuevoEstadoColor').value;
  const es_operativo = parseInt(document.getElementById('nuevoEstadoOperativo').value);
  const btn = document.getElementById('btnGuardarEstadoEquipo');
  if (!nombre) { toastAdvertencia('Nombre requerido'); return; }
  btnLoading(btn, true);
  try {
    const data = await fetchPost('/api/equipos/estados', { nombre, color, es_operativo });
    btnLoading(btn, false);
    if (data.ok) {
      cerrarModalEstadoEquipo();
      await cargarCatalogosEquipos();
      if (data.estado?.id) document.getElementById('equipoEstado').value = data.estado.id;
      toastExito('Estado creado');
    } else { toastError(data.mensaje || 'Error'); }
  } catch (err) { btnLoading(btn, false); toastError('Error'); }
}

// ========================================
// INSTALACIÓN
// ========================================

let equiposParaInstalar = [];
let cargosCalculados = null;

function verificarInstalacion() {
  const btn = document.getElementById('btnInstalacion');
  if (!btn || !clienteActual) return;
  
  // Mostrar botón si NO tiene instalación (fecha_instalacion es null)
  if (!clienteActual.fecha_instalacion) {
    btn.style.display = 'inline-flex';
  } else {
    btn.style.display = 'none';
  }
}

async function abrirModalInstalacion() {
  if (!clienteActual) return;
  
  // Reset form
  document.getElementById('formInstalacion').reset();
  document.getElementById('instFechaInstalacion').value = new Date().toISOString().split('T')[0];
  document.getElementById('instDiaCorte').value = clienteActual.dia_corte || 10;
  document.getElementById('previewCargos').style.display = 'none';
  equiposParaInstalar = [];
  cargosCalculados = null;
  
  // Cargar planes
  llenarSelect('instPlan', planes);
  if (clienteActual.plan_id) {
    document.getElementById('instPlan').value = clienteActual.plan_id;
    const plan = planes.find(p => p.id === clienteActual.plan_id);
    if (plan) document.getElementById('instTarifa').value = plan.precio_mensual;
  }
  
  // Evento cambio de plan
  document.getElementById('instPlan').onchange = (e) => {
    const plan = planes.find(p => p.id === e.target.value);
    if (plan) document.getElementById('instTarifa').value = plan.precio_mensual;
  };
  
  // Renderizar equipos
  renderizarEquiposInstalacion();
  
  document.getElementById('modalInstalacion').classList.add('active');
}

function cerrarModalInstalacion() {
  document.getElementById('modalInstalacion').classList.remove('active');
}

function renderizarEquiposInstalacion() {
  const container = document.getElementById('equiposInstalacion');
  
  if (equiposParaInstalar.length === 0) {
    container.innerHTML = `<p class="text-muted" style="text-align: center; padding: 12px;">Sin equipos agregados</p>`;
    return;
  }
  
  container.innerHTML = equiposParaInstalar.map((eq, idx) => {
    const tipo = tiposEquipo.find(t => t.id === eq.tipo);
    return `
    <div style="display: flex; gap: 8px; align-items: center; padding: 8px; background: var(--bg-input); border-radius: var(--radius-sm); margin-bottom: 8px;">
      <span class="badge" style="background: var(--accent-primary)20; color: var(--accent-primary);">${tipo?.nombre || 'Equipo'}</span>
      <span style="flex: 1; font-size: 13px;">${eq.marca || ''} ${eq.modelo || ''} ${eq.serie ? '- S/N: ' + eq.serie : ''}</span>
      <button type="button" class="btn btn-sm" onclick="quitarEquipoInstalacion(${idx})" style="padding: 4px 8px;">
        <span class="material-symbols-outlined" style="font-size: 18px; color: var(--danger);">close</span>
      </button>
    </div>
  `}).join('');
}

function agregarEquipoInstalacion() {
  // Crear mini modal o usar prompt simple
  const tipoId = tiposEquipo.length > 0 ? tiposEquipo[0].id : null;
  const estadoId = estadosEquipo.length > 0 ? estadosEquipo[0].id : null;
  
  equiposParaInstalar.push({
    tipo: tipoId,
    estado: estadoId,
    marca: '',
    modelo: '',
    serie: '',
    mac: ''
  });
  
  // Abrir modal de equipo para editar
  editarEquipoInstalacion(equiposParaInstalar.length - 1);
}

function editarEquipoInstalacion(idx) {
  const eq = equiposParaInstalar[idx];
  
  // Usar el modal de equipo existente pero en modo instalación
  document.getElementById('modalEquipoTitulo').textContent = 'Agregar Equipo de Instalación';
  document.getElementById('formEquipo').reset();
  document.getElementById('equipoId').value = 'inst_' + idx;
  
  if (eq) {
    document.getElementById('equipoTipo').value = eq.tipo || '';
    document.getElementById('equipoMarca').value = eq.marca || '';
    document.getElementById('equipoModelo').value = eq.modelo || '';
    document.getElementById('equipoSerial').value = eq.serie || '';
    document.getElementById('equipoMac').value = eq.mac || '';
    document.getElementById('equipoEstado').value = eq.estado || '';
  }
  
  document.getElementById('equipoFechaInstalacion').value = document.getElementById('instFechaInstalacion').value;
  
  document.getElementById('modalEquipo').classList.add('active');
}

function quitarEquipoInstalacion(idx) {
  equiposParaInstalar.splice(idx, 1);
  renderizarEquiposInstalacion();
}

// Sobrescribir guardarEquipo para manejar modo instalación
const guardarEquipoOriginal = guardarEquipo;
guardarEquipo = async function() {
  const id = document.getElementById('equipoId').value;
  
  // Si es modo instalación
  if (id && id.startsWith('inst_')) {
    const idx = parseInt(id.replace('inst_', ''));
    
    equiposParaInstalar[idx] = {
      tipo: document.getElementById('equipoTipo').value,
      estado: document.getElementById('equipoEstado').value,
      marca: document.getElementById('equipoMarca').value,
      modelo: document.getElementById('equipoModelo').value,
      serie: document.getElementById('equipoSerial').value,
      mac: document.getElementById('equipoMac').value.toUpperCase(),
      ip: document.getElementById('equipoIp').value,
      notas: document.getElementById('equipoNotas').value
    };
    
    cerrarModalEquipo();
    renderizarEquiposInstalacion();
    toastExito('Equipo agregado');
    return;
  }
  
  // Sino, usar función original
  await guardarEquipoOriginal();
};

async function calcularCargosInstalacion() {
  const fechaInstalacion = document.getElementById('instFechaInstalacion').value;
  const diaCorte = parseInt(document.getElementById('instDiaCorte').value);
  const tarifa = parseFloat(document.getElementById('instTarifa').value);
  const costoInstalacion = parseFloat(document.getElementById('instCostoInstalacion').value) || 0;
  
  if (!fechaInstalacion || !tarifa) {
    toastAdvertencia('Completa fecha y tarifa');
    return;
  }
  
  try {
    const data = await fetchPost('/api/instalaciones/calcular', {
      cliente_id: clienteActual.id,
      fecha_instalacion: fechaInstalacion,
      dia_corte: diaCorte,
      tarifa_mensual: tarifa,
      costo_instalacion: costoInstalacion
    });
    
    if (data.ok) {
      cargosCalculados = data.cargos;
      mostrarPreviewCargos(data.cargos);
    } else {
      toastError(data.mensaje || 'Error al calcular');
    }
  } catch (err) {
    console.error('Error:', err);
    toastError('Error al calcular cargos');
  }
}

function mostrarPreviewCargos(cargos) {
  const container = document.getElementById('listaCargosPreview');
  const preview = document.getElementById('previewCargos');
  
  if (!cargos || cargos.length === 0) {
    preview.style.display = 'none';
    return;
  }
  
  let total = 0;
  container.innerHTML = cargos.map(c => {
    total += parseFloat(c.monto);
    return `
    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border-color);">
      <div>
        <strong style="font-size: 13px;">${c.concepto}</strong>
        <p style="font-size: 12px; color: var(--text-muted); margin: 2px 0 0 0;">${c.descripcion || ''}</p>
      </div>
      <strong style="color: var(--text-primary);">${formatoMoneda(c.monto)}</strong>
    </div>
  `}).join('');
  
  document.getElementById('totalCargosPreview').textContent = formatoMoneda(total);
  preview.style.display = 'block';
}

async function confirmarInstalacion() {
  const btn = document.getElementById('btnConfirmarInstalacion');
  
  const fechaInstalacion = document.getElementById('instFechaInstalacion').value;
  const diaCorte = parseInt(document.getElementById('instDiaCorte').value);
  const planId = document.getElementById('instPlan').value;
  const tarifa = parseFloat(document.getElementById('instTarifa').value);
  const costoInstalacion = parseFloat(document.getElementById('instCostoInstalacion').value) || 0;
  const tecnico = document.getElementById('instTecnico').value;
  const notas = document.getElementById('instNotas').value;
  
  if (!fechaInstalacion || !tarifa || !planId) {
    toastAdvertencia('Completa los campos requeridos');
    return;
  }
  
  btnLoading(btn, true);
  
  try {
    const data = await fetchPost('/api/instalaciones', {
      cliente_id: clienteActual.id,
      fecha_instalacion: fechaInstalacion,
      dia_corte: diaCorte,
      plan_id: planId,
      tarifa_mensual: tarifa,
      costo_instalacion: costoInstalacion,
      tecnico_instalador: tecnico,
      notas_instalacion: notas,
      equipos: equiposParaInstalar
    });
    
    btnLoading(btn, false);
    
    if (data.ok) {
      cerrarModalInstalacion();
      
      let mensaje = '¡Instalación registrada!';
      if (data.cargos_generados) {
        mensaje += ` Se generaron ${data.cargos_generados} cargos.`;
      }
      if (data.equipos_registrados) {
        mensaje += ` ${data.equipos_registrados} equipos instalados.`;
      }
      
      toastExito(mensaje);
      
      // Recargar todo
      cargarCliente(clienteActual.id);
    } else {
      toastError(data.mensaje || 'Error al registrar instalación');
    }
  } catch (err) {
    console.error('Error:', err);
    btnLoading(btn, false);
    toastError('Error al registrar instalación');
  }
}

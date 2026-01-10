// ========================================
// SKYNET - DETALLE CLIENTE JS
// ========================================

let clienteActual = null;
let ciudades = [], colonias = [], planes = [];
let tiposEquipo = [], estadosEquipo = [], metodosPago = [];
let equipoAEliminar = null;
let pagoSeleccionado = null;

// ========================================
// INIT
// ========================================
document.addEventListener('DOMContentLoaded', () => {
  verificarSesion();
  cargarUsuarioHeader();
  
  const params = new URLSearchParams(window.location.search);
  const clienteId = params.get('id');
  
  if (!clienteId) {
    toastError('Cliente no especificado');
    setTimeout(() => window.location.href = '/skynet-frontend/clientes/', 1500);
    return;
  }
  
  inicializarTabs();
  cargarCatalogos();
  cargarCliente(clienteId);
});

function inicializarTabs() {
  document.querySelectorAll('.tabs__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tabs__btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('panel-' + btn.dataset.tab).classList.add('active');
    });
  });
}

// ========================================
// CATÁLOGOS
// ========================================
async function cargarCatalogos() {
  try {
    const [rCiudades, rPlanes, rTipos, rEstados, rMetodos] = await Promise.all([
      fetchGet('/api/catalogos/ciudades'),
      fetchGet('/api/catalogos/planes'),
      fetchGet('/api/equipos/tipos'),
      fetchGet('/api/equipos/estados'),
      fetchGet('/api/pagos/metodos')
    ]);
    
    if (rCiudades.ok) ciudades = rCiudades.ciudades;
    if (rPlanes.ok) planes = rPlanes.planes;
    if (rTipos.ok) tiposEquipo = rTipos.tipos;
    if (rEstados.ok) estadosEquipo = rEstados.estados;
    if (rMetodos.ok) metodosPago = rMetodos.metodos;
  } catch (err) {
    console.error('Error cargando catálogos:', err);
  }
}

function llenarSelect(id, datos) {
  const select = document.getElementById(id);
  if (!select) return;
  select.innerHTML = '<option value="">Seleccionar...</option>' + 
    datos.map(d => `<option value="${d.id}">${d.nombre}</option>`).join('');
}

function llenarSelectMetodos(id, datos) {
  const select = document.getElementById(id);
  if (!select) return;
  select.innerHTML = '<option value="">Seleccionar...</option>' + 
    datos.map(d => `<option value="${d.id}">${d.nombre}</option>`).join('');
}

async function cargarColonias(ciudadId, selectId, valorSeleccionado = null) {
  const select = document.getElementById(selectId);
  if (!select) return;
  if (!ciudadId) { select.innerHTML = '<option value="">Seleccionar...</option>'; return; }
  
  try {
    const r = await fetchGet(`/api/catalogos/colonias?ciudad_id=${ciudadId}`);
    if (r.ok) {
      colonias = r.colonias;
      llenarSelect(selectId, colonias);
      if (valorSeleccionado) select.value = valorSeleccionado;
    }
  } catch (err) { console.error('Error:', err); }
}

// ========================================
// CLIENTE
// ========================================
async function cargarCliente(id) {
  try {
    const data = await fetchGet(`/api/clientes/${id}`);
    if (!data.ok) { toastError('Error al cargar cliente'); return; }
    
    clienteActual = data.cliente;
    renderizarCliente();
    cargarMensualidades(id);
    cargarCargos(id);
    cargarEquipos(id);
    cargarHistorialPagos(id);
    verificarInstalacion();
  } catch (err) {
    console.error('Error:', err);
    toastError('Error al cargar cliente');
  }
}

function renderizarCliente() {
  const c = clienteActual;
  
  const avatar = document.getElementById('clienteAvatar');
  if (avatar) avatar.textContent = obtenerIniciales(c.nombre, c.apellido_paterno);
  
  const nombre = document.getElementById('clienteNombre');
  if (nombre) nombre.textContent = `${c.nombre} ${c.apellido_paterno || ''} #${c.numero_cliente || ''}`;
  
  const badge = document.getElementById('clienteEstado');
  if (badge) {
    badge.textContent = (c.estado || 'activo').toUpperCase();
    badge.className = 'badge badge--' + (c.estado || 'activo');
  }
  
  const telefono = document.getElementById('clienteTelefono');
  if (telefono) telefono.textContent = c.telefono || '--';
  
  const email = document.getElementById('clienteEmail');
  if (email) email.textContent = c.email || '--';
  
  const direccion = document.getElementById('clienteDireccion');
  if (direccion) direccion.textContent = `${c.direccion || ''}, ${c.colonia_nombre || ''}, ${c.ciudad_nombre || ''}`;
  
  const tarifa = document.getElementById('tarifaMensual');
  if (tarifa) tarifa.textContent = formatoMoneda(c.tarifa_mensual || c.cuota_mensual);
  
  const plan = document.getElementById('planNombre');
  if (plan) plan.textContent = c.plan_nombre || '--';
  
  const saldo = document.getElementById('saldoFavor');
  if (saldo) saldo.textContent = formatoMoneda(c.saldo_favor);
  
  // Próximo corte
  const hoy = new Date();
  let proximoCorte = new Date(hoy.getFullYear(), hoy.getMonth(), c.dia_corte || 10);
  if (proximoCorte < hoy) proximoCorte.setMonth(proximoCorte.getMonth() + 1);
  const dias = Math.ceil((proximoCorte - hoy) / (1000 * 60 * 60 * 24));
  
  const corte = document.getElementById('proximoCorte');
  if (corte) corte.textContent = proximoCorte.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  
  const diasEl = document.getElementById('diasRestantes');
  if (diasEl) diasEl.textContent = `En ${dias} días`;
}

function verificarInstalacion() {
  const btn = document.getElementById('btnInstalacion');
  if (!btn || !clienteActual) return;
  
  const tieneInstalacion = clienteActual.fecha_instalacion && clienteActual.fecha_instalacion !== 'null';
  btn.style.display = tieneInstalacion ? 'none' : 'inline-flex';
}

// ========================================
// MENSUALIDADES
// ========================================
async function cargarMensualidades(clienteId) {
  const tbody = document.getElementById('tablaMensualidades');
  if (!tbody) return;
  
  try {
    const data = await fetchGet(`/api/cargos/mensualidades?cliente_id=${clienteId}`);
    if (!data.ok || !data.mensualidades?.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty">Sin mensualidades</td></tr>';
      return;
    }
    
    tbody.innerHTML = data.mensualidades.map(m => {
      const estadoReal = m.estado_real || m.estado;
      return `
      <tr>
        <td><strong>${m.periodo}</strong></td>
        <td>${m.concepto || 'Mensualidad'}</td>
        <td>${formatoFecha(m.fecha_vencimiento)}</td>
        <td>${formatoMoneda(m.monto)}</td>
        <td class="text-success">${formatoMoneda(m.monto_pagado)}</td>
        <td class="text-danger">${formatoMoneda(m.pendiente)}</td>
        <td><span class="badge badge--${estadoReal}">${estadoReal.toUpperCase()}</span></td>
      </tr>
    `}).join('');
  } catch (err) {
    console.error('Error:', err);
    tbody.innerHTML = '<tr><td colspan="7" class="empty">Error al cargar</td></tr>';
  }
}

// ========================================
// CARGOS
// ========================================
async function cargarCargos(clienteId) {
  const tbody = document.getElementById('tablaCargos');
  if (!tbody) return;
  
  try {
    const data = await fetchGet(`/api/cargos?cliente_id=${clienteId}`);
    if (!data.ok || !data.cargos?.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty">Sin cargos</td></tr>';
      actualizarResumenCargos(0, 0, 0);
      return;
    }
    
    tbody.innerHTML = data.cargos.map(c => {
      const estadoReal = c.estado_real || c.estado;
      return `
      <tr>
        <td><span class="badge badge--${c.tipo}">${c.tipo.toUpperCase()}</span></td>
        <td><strong>${c.concepto}</strong><br><small class="text-muted">${c.descripcion || ''}</small></td>
        <td>${formatoFecha(c.fecha_vencimiento)}</td>
        <td>${formatoMoneda(c.monto)}</td>
        <td class="text-success">${formatoMoneda(c.monto_pagado)}</td>
        <td class="text-danger">${formatoMoneda(c.pendiente)}</td>
        <td><span class="badge badge--${estadoReal}">${estadoReal.toUpperCase()}</span></td>
      </tr>
    `}).join('');
    
    actualizarResumenCargos(data.resumen.total_monto, data.resumen.total_pagado, data.resumen.total_pendiente);
    
    const adeudo = document.getElementById('adeudoTotal');
    if (adeudo) adeudo.textContent = formatoMoneda(data.resumen.total_pendiente);
    
    const estado = document.getElementById('estadoCuenta');
    if (estado) {
      if (data.resumen.total_pendiente > 0) {
        estado.textContent = 'Con adeudo';
        estado.className = 'stat-card__sub text-danger';
      } else {
        estado.textContent = 'Al corriente';
        estado.className = 'stat-card__sub text-success';
      }
    }
  } catch (err) {
    console.error('Error:', err);
    tbody.innerHTML = '<tr><td colspan="7" class="empty">Error al cargar</td></tr>';
  }
}

function actualizarResumenCargos(total, pagado, pendiente) {
  const t = document.getElementById('cargosTotalMonto');
  const p = document.getElementById('cargosTotalPagado');
  const pe = document.getElementById('cargosTotalPendiente');
  if (t) t.textContent = formatoMoneda(total);
  if (p) p.textContent = formatoMoneda(pagado);
  if (pe) pe.textContent = formatoMoneda(pendiente);
}

// ========================================
// EQUIPOS
// ========================================
async function cargarEquipos(clienteId) {
  const tbody = document.getElementById('tablaEquipos');
  if (!tbody) return;
  
  try {
    const data = await fetchGet(`/api/equipos?cliente_id=${clienteId}`);
    if (!data.ok || !data.equipos?.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty">Sin equipos instalados</td></tr>';
      return;
    }
    
    tbody.innerHTML = data.equipos.map(e => `
      <tr>
        <td><span class="badge">${e.tipo_nombre || '--'}</span></td>
        <td><strong>${e.marca || '--'}</strong> ${e.modelo || ''}</td>
        <td><code>${e.mac || '--'}</code></td>
        <td>${e.serie || '--'}</td>
        <td><span class="badge badge--${e.es_operativo == 1 ? 'activo' : 'suspendido'}">${e.estado_nombre || '--'}</span></td>
        <td>
          <div class="table__actions">
            <button onclick="editarEquipo('${e.id}')" title="Editar"><span class="material-symbols-outlined">edit</span></button>
            <button onclick="eliminarEquipo('${e.id}')" title="Eliminar"><span class="material-symbols-outlined">delete</span></button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Error:', err);
    tbody.innerHTML = '<tr><td colspan="6" class="empty">Error al cargar</td></tr>';
  }
}

// ========================================
// HISTORIAL PAGOS
// ========================================
async function cargarHistorialPagos(clienteId) {
  const container = document.getElementById('listaPagos');
  if (!container) return;
  
  try {
    const data = await fetchGet(`/api/pagos/historial/${clienteId}`);
    if (!data.ok || !data.pagos?.length) {
      container.innerHTML = '<p class="empty">Sin pagos registrados</p>';
      return;
    }
    
    container.innerHTML = data.pagos.map(p => {
      const esCancelado = p.estado === 'cancelado';
      return `
      <div class="pago-item ${esCancelado ? 'pago-item--cancelado' : ''}" onclick="verPago('${p.id}')">
        <div class="pago-item__icon ${esCancelado ? 'pago-item__icon--cancelado' : ''}">
          <span class="material-symbols-outlined">${esCancelado ? 'block' : 'check'}</span>
        </div>
        <div class="pago-item__info">
          <p class="pago-item__title">${p.metodo_nombre || 'Pago'} ${esCancelado ? '(CANCELADO)' : ''}</p>
          <p class="pago-item__detail">${formatoFecha(p.fecha_pago)} ${p.referencia ? '• ' + p.referencia : ''} ${p.aplicado_a ? '• ' + p.aplicado_a : ''}</p>
        </div>
        <span class="pago-item__monto">${formatoMoneda(p.monto)}</span>
      </div>
    `}).join('');
  } catch (err) {
    console.error('Error:', err);
    container.innerHTML = '<p class="empty">Error al cargar</p>';
  }
}

// ========================================
// MODAL PAGO
// ========================================
function abrirModalPago() {
  const form = document.getElementById('formPago');
  if (form) form.reset();
  
  const adeudo = document.getElementById('pagoAdeudo');
  const adeudoTotal = document.getElementById('adeudoTotal');
  if (adeudo && adeudoTotal) adeudo.textContent = adeudoTotal.textContent;
  
  const saldoModal = document.getElementById('pagoSaldoFavor');
  const saldoCard = document.getElementById('saldoFavor');
  if (saldoModal && saldoCard) saldoModal.textContent = saldoCard.textContent;
  
  llenarSelectMetodos('pagoMetodo', metodosPago);
  abrirModal('modalPago');
}

async function guardarPago() {
  const btn = document.getElementById('btnGuardarPago');
  const monto = parseFloat(document.getElementById('pagoMonto')?.value);
  const metodo = document.getElementById('pagoMetodo')?.value;
  
  if (!monto || monto <= 0) { toastAdvertencia('Ingresa un monto válido'); return; }
  if (!metodo) { toastAdvertencia('Selecciona un método'); return; }
  
  btnLoading(btn, true);
  
  try {
    const datos = {
      cliente_id: clienteActual.id,
      monto,
      metodo_pago_id: metodo,
      referencia: document.getElementById('pagoReferencia')?.value || '',
      banco: document.getElementById('pagoBanco')?.value || '',
      quien_paga: document.getElementById('pagoQuienPaga')?.value || '',
      telefono_quien_paga: document.getElementById('pagoTelefono')?.value || '',
      observaciones: document.getElementById('pagoObservaciones')?.value || '',
      usar_saldo_favor: document.getElementById('pagoUsarSaldo')?.checked || false
    };
    
    const data = await fetchPost('/api/pagos', datos);
    btnLoading(btn, false);
    
    if (data.ok) {
      cerrarModal('modalPago');
      let msg = `Pago de ${formatoMoneda(monto)} registrado.`;
      if (data.pago?.cargos_aplicados > 0) msg += ` Aplicado a ${data.pago.cargos_aplicados} cargo(s).`;
      toastExito(msg);
      cargarCliente(clienteActual.id);
    } else {
      toastError(data.mensaje || 'Error al registrar');
    }
  } catch (err) {
    console.error('Error:', err);
    btnLoading(btn, false);
    toastError('Error al registrar pago');
  }
}

// ========================================
// VER/EDITAR PAGO
// ========================================
async function verPago(id) {
  try {
    const data = await fetchGet(`/api/pagos/${id}`);
    if (!data.ok) { toastError('Error al cargar pago'); return; }
    
    const p = data.pago;
    pagoSeleccionado = p;
    
    document.getElementById('verPagoId').value = p.id;
    document.getElementById('verPagoMonto').textContent = formatoMoneda(p.monto);
    document.getElementById('verPagoFecha').textContent = formatoFecha(p.fecha_pago);
    document.getElementById('verPagoMetodo').textContent = p.metodo_pago || '--';
    document.getElementById('verPagoEstado').textContent = (p.estado || 'activo').toUpperCase();
    document.getElementById('verPagoAplicado').textContent = p.aplicado_a || '--';
    
    document.getElementById('editPagoReferencia').value = p.referencia || '';
    document.getElementById('editPagoBanco').value = p.banco || '';
    document.getElementById('editPagoQuienPaga').value = p.quien_paga || '';
    document.getElementById('editPagoTelefono').value = p.telefono_quien_paga || '';
    document.getElementById('editPagoObservaciones').value = p.observaciones || '';
    
    const esCancelado = p.estado === 'cancelado';
    const btnCancelar = document.getElementById('btnCancelarPago');
    const btnActualizar = document.getElementById('btnActualizarPago');
    if (btnCancelar) btnCancelar.style.display = esCancelado ? 'none' : 'inline-flex';
    if (btnActualizar) btnActualizar.style.display = esCancelado ? 'none' : 'inline-flex';
    
    abrirModal('modalVerPago');
  } catch (err) {
    console.error('Error:', err);
    toastError('Error al cargar pago');
  }
}

async function actualizarPago() {
  const id = document.getElementById('verPagoId')?.value;
  const btn = document.getElementById('btnActualizarPago');
  
  if (!id) return;
  btnLoading(btn, true);
  
  try {
    const datos = {
      referencia: document.getElementById('editPagoReferencia')?.value || '',
      banco: document.getElementById('editPagoBanco')?.value || '',
      quien_paga: document.getElementById('editPagoQuienPaga')?.value || '',
      telefono_quien_paga: document.getElementById('editPagoTelefono')?.value || '',
      observaciones: document.getElementById('editPagoObservaciones')?.value || '',
      metodo_pago: pagoSeleccionado?.metodo_pago || 'efectivo'
    };
    
    const data = await fetchPut(`/api/pagos/${id}`, datos);
    btnLoading(btn, false);
    
    if (data.ok) {
      cerrarModal('modalVerPago');
      toastExito('Pago actualizado');
      cargarHistorialPagos(clienteActual.id);
    } else {
      toastError(data.mensaje || 'Error al actualizar');
    }
  } catch (err) {
    console.error('Error:', err);
    btnLoading(btn, false);
    toastError('Error al actualizar');
  }
}

function cancelarPago() {
  const motivo = document.getElementById('motivoCancelacion');
  if (motivo) motivo.value = '';
  abrirModal('modalCancelarPago');
}

async function confirmarCancelarPago() {
  const id = document.getElementById('verPagoId')?.value;
  const motivo = document.getElementById('motivoCancelacion')?.value || '';
  
  if (!id) return;
  
  try {
    const data = await fetchPut(`/api/pagos/${id}/cancelar`, { motivo });
    
    if (data.ok) {
      cerrarModal('modalCancelarPago');
      cerrarModal('modalVerPago');
      toastExito(data.mensaje || 'Pago cancelado');
      cargarCliente(clienteActual.id);
    } else {
      toastError(data.mensaje || 'Error al cancelar');
    }
  } catch (err) {
    console.error('Error:', err);
    toastError('Error al cancelar');
  }
}

// ========================================
// MODAL CARGO
// ========================================
function abrirModalCargo() {
  const form = document.getElementById('formCargo');
  if (form) form.reset();
  
  const fecha = document.getElementById('cargoFecha');
  if (fecha) fecha.value = new Date().toISOString().split('T')[0];
  
  abrirModal('modalCargo');
}

async function guardarCargo() {
  const concepto = document.getElementById('cargoConcepto')?.value;
  const monto = parseFloat(document.getElementById('cargoMonto')?.value);
  
  if (!concepto || !monto) { toastAdvertencia('Completa los campos requeridos'); return; }
  
  try {
    const datos = {
      cliente_id: clienteActual.id,
      concepto,
      monto,
      fecha_vencimiento: document.getElementById('cargoFecha')?.value || '',
      descripcion: document.getElementById('cargoDescripcion')?.value || ''
    };
    
    const data = await fetchPost('/api/cargos', datos);
    
    if (data.ok) {
      cerrarModal('modalCargo');
      toastExito('Cargo creado');
      cargarMensualidades(clienteActual.id);
      cargarCargos(clienteActual.id);
    } else {
      toastError(data.mensaje || 'Error al crear');
    }
  } catch (err) {
    console.error('Error:', err);
    toastError('Error al crear cargo');
  }
}

// ========================================
// MODAL EQUIPO
// ========================================
function abrirModalEquipo() {
  const titulo = document.getElementById('modalEquipoTitulo');
  if (titulo) titulo.innerHTML = '<span class="material-symbols-outlined">router</span>Agregar Equipo';
  
  const form = document.getElementById('formEquipo');
  if (form) form.reset();
  
  const id = document.getElementById('equipoId');
  if (id) id.value = '';
  
  const fecha = document.getElementById('equipoFecha');
  if (fecha) fecha.value = new Date().toISOString().split('T')[0];
  
  llenarSelect('equipoTipo', tiposEquipo);
  llenarSelect('equipoEstado', estadosEquipo);
  abrirModal('modalEquipo');
}

async function editarEquipo(id) {
  try {
    const data = await fetchGet(`/api/equipos/${id}`);
    if (!data.ok) { toastError('Error al cargar'); return; }
    
    const e = data.equipo;
    const titulo = document.getElementById('modalEquipoTitulo');
    if (titulo) titulo.innerHTML = '<span class="material-symbols-outlined">edit</span>Editar Equipo';
    
    llenarSelect('equipoTipo', tiposEquipo);
    llenarSelect('equipoEstado', estadosEquipo);
    
    document.getElementById('equipoId').value = e.id;
    document.getElementById('equipoTipo').value = e.tipo || '';
    document.getElementById('equipoMarca').value = e.marca || '';
    document.getElementById('equipoModelo').value = e.modelo || '';
    document.getElementById('equipoSerie').value = e.serie || '';
    document.getElementById('equipoMac').value = e.mac || '';
    document.getElementById('equipoIp').value = e.ip || '';
    document.getElementById('equipoEstado').value = e.estado || '';
    document.getElementById('equipoFecha').value = e.fecha_instalacion?.split('T')[0] || '';
    document.getElementById('equipoNotas').value = e.notas || '';
    
    abrirModal('modalEquipo');
  } catch (err) {
    console.error('Error:', err);
    toastError('Error al cargar equipo');
  }
}

async function guardarEquipo() {
  const id = document.getElementById('equipoId')?.value;
  
  const datos = {
    cliente_id: clienteActual.id,
    tipo: document.getElementById('equipoTipo')?.value || '',
    marca: document.getElementById('equipoMarca')?.value || '',
    modelo: document.getElementById('equipoModelo')?.value || '',
    serie: document.getElementById('equipoSerie')?.value || '',
    mac: (document.getElementById('equipoMac')?.value || '').toUpperCase(),
    ip: document.getElementById('equipoIp')?.value || '',
    estado: document.getElementById('equipoEstado')?.value || '',
    fecha_instalacion: document.getElementById('equipoFecha')?.value || null,
    notas: document.getElementById('equipoNotas')?.value || ''
  };
  
  if (!datos.tipo || !datos.estado) { toastAdvertencia('Tipo y estado son requeridos'); return; }
  
  try {
    const data = id ? await fetchPut(`/api/equipos/${id}`, datos) : await fetchPost('/api/equipos', datos);
    
    if (data.ok) {
      cerrarModal('modalEquipo');
      toastExito(id ? 'Equipo actualizado' : 'Equipo agregado');
      cargarEquipos(clienteActual.id);
    } else {
      toastError(data.mensaje || 'Error al guardar');
    }
  } catch (err) {
    console.error('Error:', err);
    toastError('Error al guardar equipo');
  }
}

function eliminarEquipo(id) {
  equipoAEliminar = id;
  abrirModal('modalEliminar');
}

async function confirmarEliminarEquipo() {
  if (!equipoAEliminar) return;
  
  try {
    const data = await fetchDelete(`/api/equipos/${equipoAEliminar}`);
    
    if (data.ok) {
      cerrarModal('modalEliminar');
      toastExito('Equipo eliminado');
      cargarEquipos(clienteActual.id);
    } else {
      toastError(data.mensaje || 'Error al eliminar');
    }
  } catch (err) {
    console.error('Error:', err);
    toastError('Error al eliminar');
  }
  
  equipoAEliminar = null;
}

// ========================================
// MODAL INSTALACIÓN
// ========================================
function abrirModalInstalacion() {
  if (!clienteActual) return;
  
  const form = document.getElementById('formInstalacion');
  if (form) form.reset();
  
  const fecha = document.getElementById('instFecha');
  if (fecha) fecha.value = new Date().toISOString().split('T')[0];
  
  const diaCorte = document.getElementById('instDiaCorte');
  if (diaCorte) diaCorte.value = clienteActual.dia_corte || 10;
  
  const preview = document.getElementById('instPreview');
  if (preview) preview.style.display = 'none';
  
  llenarSelect('instPlan', planes);
  
  const planSelect = document.getElementById('instPlan');
  const tarifaInput = document.getElementById('instTarifa');
  
  if (clienteActual.plan_id && planSelect) {
    planSelect.value = clienteActual.plan_id;
    const plan = planes.find(p => p.id === clienteActual.plan_id);
    if (plan && tarifaInput) tarifaInput.value = plan.precio_mensual;
  }
  
  if (planSelect) {
    planSelect.onchange = (e) => {
      const plan = planes.find(p => p.id === e.target.value);
      if (plan && tarifaInput) tarifaInput.value = plan.precio_mensual;
    };
  }
  
  abrirModal('modalInstalacion');
}

function calcularCargosInstalacion() {
  const fecha = document.getElementById('instFecha')?.value;
  const diaCorte = parseInt(document.getElementById('instDiaCorte')?.value) || 10;
  const tarifa = parseFloat(document.getElementById('instTarifa')?.value) || 0;
  const costoInst = parseFloat(document.getElementById('instCosto')?.value) || 0;
  
  if (!fecha || !tarifa) { toastAdvertencia('Completa fecha y tarifa'); return; }
  
  const fechaInst = new Date(fecha + 'T12:00:00');
  const diaInst = fechaInst.getDate();
  const cargos = [];
  
  // Prorrateo
  if (diaInst !== diaCorte) {
    let dias = diaInst < diaCorte ? diaCorte - diaInst : (30 - diaInst) + diaCorte;
    if (dias > 0) {
      cargos.push({ concepto: 'Prorrateo', descripcion: `${dias} días`, monto: (tarifa / 30) * dias });
    }
  }
  
  // Instalación
  if (costoInst > 0) {
    cargos.push({ concepto: 'Instalación', descripcion: 'Costo único', monto: costoInst });
  }
  
  // Mensualidad
  cargos.push({ concepto: 'Mensualidad', descripcion: 'Primera mensualidad', monto: tarifa });
  
  // Mostrar preview
  const lista = document.getElementById('instCargosLista');
  const preview = document.getElementById('instPreview');
  const totalEl = document.getElementById('instCargosTotal');
  
  if (lista && preview && totalEl) {
    let total = 0;
    lista.innerHTML = cargos.map(c => {
      total += c.monto;
      return `<div class="preview-cargos__item"><span>${c.concepto} <small class="text-muted">${c.descripcion}</small></span><strong>${formatoMoneda(c.monto)}</strong></div>`;
    }).join('');
    
    totalEl.textContent = formatoMoneda(total);
    preview.style.display = 'block';
  }
}

async function confirmarInstalacion() {
  const datos = {
    fecha_instalacion: document.getElementById('instFecha')?.value,
    dia_corte: parseInt(document.getElementById('instDiaCorte')?.value),
    plan_id: document.getElementById('instPlan')?.value,
    tarifa_mensual: parseFloat(document.getElementById('instTarifa')?.value),
    costo_instalacion: parseFloat(document.getElementById('instCosto')?.value) || 0,
    tecnico_instalador: document.getElementById('instTecnico')?.value || '',
    notas_instalacion: document.getElementById('instNotas')?.value || ''
  };
  
  if (!datos.fecha_instalacion || !datos.tarifa_mensual || !datos.plan_id) {
    toastAdvertencia('Completa los campos requeridos');
    return;
  }
  
  try {
    const data = await fetchPost(`/api/clientes/${clienteActual.id}/instalacion`, datos);
    
    if (data.ok) {
      cerrarModal('modalInstalacion');
      let msg = '¡Instalación registrada!';
      if (data.cargos_generados) msg += ` ${data.cargos_generados} cargos generados.`;
      toastExito(msg);
      cargarCliente(clienteActual.id);
    } else {
      toastError(data.mensaje || 'Error al registrar');
    }
  } catch (err) {
    console.error('Error:', err);
    toastError('Error al registrar instalación');
  }
}

// ========================================
// MODAL EDITAR CLIENTE
// ========================================
async function activarModoEdicion() {
  if (!clienteActual) return;
  
  const c = clienteActual;
  
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  };
  
  setVal('editNombre', c.nombre);
  setVal('editApellido', c.apellido_paterno);
  setVal('editTelefono', c.telefono);
  setVal('editEmail', c.email);
  setVal('editDireccion', c.direccion);
  setVal('editReferencia', c.referencia);
  setVal('editTarifa', c.tarifa_mensual);
  setVal('editDiaCorte', c.dia_corte || 10);
  setVal('editEstado', c.estado || 'activo');
  
  llenarSelect('editCiudad', ciudades);
  llenarSelect('editPlan', planes);
  
  setVal('editCiudad', c.ciudad_id);
  setVal('editPlan', c.plan_id);
  
  if (c.ciudad_id) {
    await cargarColonias(c.ciudad_id, 'editColonia', c.colonia_id);
  }
  
  const ciudadSelect = document.getElementById('editCiudad');
  if (ciudadSelect) {
    ciudadSelect.onchange = (e) => cargarColonias(e.target.value, 'editColonia');
  }
  
  const planSelect = document.getElementById('editPlan');
  if (planSelect) {
    planSelect.onchange = (e) => {
      const plan = planes.find(p => p.id === e.target.value);
      if (plan) setVal('editTarifa', plan.precio_mensual);
    };
  }
  
  abrirModal('modalEditar');
}

async function guardarEdicion() {
  const getVal = (id) => document.getElementById(id)?.value || '';
  
  const datos = {
    nombre: getVal('editNombre'),
    apellido_paterno: getVal('editApellido'),
    telefono: getVal('editTelefono'),
    email: getVal('editEmail'),
    ciudad_id: getVal('editCiudad'),
    colonia_id: getVal('editColonia'),
    direccion: getVal('editDireccion'),
    referencia: getVal('editReferencia'),
    plan_id: getVal('editPlan'),
    cuota_mensual: parseFloat(getVal('editTarifa')) || 0,
    dia_corte: parseInt(getVal('editDiaCorte')) || 10,
    estado: getVal('editEstado')
  };
  
  if (!datos.nombre || !datos.telefono) { toastAdvertencia('Nombre y teléfono son requeridos'); return; }
  
  try {
    const data = await fetchPut(`/api/clientes/${clienteActual.id}`, datos);
    
    if (data.ok) {
      cerrarModal('modalEditar');
      toastExito('Cliente actualizado');
      cargarCliente(clienteActual.id);
    } else {
      toastError(data.mensaje || 'Error al guardar');
    }
  } catch (err) {
    console.error('Error:', err);
    toastError('Error al guardar');
  }
}

// ========================================
// UTILS
// ========================================
function abrirModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('active');
}

function cerrarModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('active');
}

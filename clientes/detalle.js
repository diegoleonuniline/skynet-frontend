// ========================================
// SKYNET - DETALLE CLIENTE JS
// ========================================

const API = window.API_URL || 'https://skynet-backend-a47423108e2a.herokuapp.com';
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
    
    llenarSelect('editCiudad', ciudades);
    llenarSelect('editPlan', planes);
    llenarSelect('instPlan', planes);
    llenarSelect('equipoTipo', tiposEquipo);
    llenarSelect('equipoEstado', estadosEquipo);
    llenarSelectMetodos('pagoMetodo', metodosPago);
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
  
  document.getElementById('clienteAvatar').textContent = obtenerIniciales(c.nombre, c.apellido_paterno);
  document.getElementById('clienteNombre').textContent = `${c.nombre} ${c.apellido_paterno || ''} #${c.numero_cliente || ''}`;
  
  const badge = document.getElementById('clienteEstado');
  badge.textContent = (c.estado || 'activo').toUpperCase();
  badge.className = 'badge badge--' + (c.estado || 'activo');
  
  document.getElementById('clienteTelefono').textContent = c.telefono || '--';
  document.getElementById('clienteEmail').textContent = c.email || '--';
  document.getElementById('clienteDireccion').textContent = `${c.direccion || ''}, ${c.colonia_nombre || ''}, ${c.ciudad_nombre || ''}`;
  
  document.getElementById('tarifaMensual').textContent = formatoMoneda(c.tarifa_mensual || c.cuota_mensual);
  document.getElementById('planNombre').textContent = c.plan_nombre || '--';
  document.getElementById('saldoFavor').textContent = formatoMoneda(c.saldo_favor);
  
  // Próximo corte
  const hoy = new Date();
  let proximoCorte = new Date(hoy.getFullYear(), hoy.getMonth(), c.dia_corte || 10);
  if (proximoCorte < hoy) proximoCorte.setMonth(proximoCorte.getMonth() + 1);
  const dias = Math.ceil((proximoCorte - hoy) / (1000 * 60 * 60 * 24));
  
  document.getElementById('proximoCorte').textContent = proximoCorte.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  document.getElementById('diasRestantes').textContent = `En ${dias} días`;
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
    
    document.getElementById('adeudoTotal').textContent = formatoMoneda(data.resumen.total_pendiente);
    const estadoCuenta = document.getElementById('estadoCuenta');
    if (data.resumen.total_pendiente > 0) {
      estadoCuenta.textContent = 'Con adeudo';
      estadoCuenta.className = 'stat-card__sub text-danger';
    } else {
      estadoCuenta.textContent = 'Al corriente';
      estadoCuenta.className = 'stat-card__sub text-success';
    }
  } catch (err) {
    console.error('Error:', err);
    tbody.innerHTML = '<tr><td colspan="7" class="empty">Error al cargar</td></tr>';
  }
}

function actualizarResumenCargos(total, pagado, pendiente) {
  document.getElementById('cargosTotalMonto').textContent = formatoMoneda(total);
  document.getElementById('cargosTotalPagado').textContent = formatoMoneda(pagado);
  document.getElementById('cargosTotalPendiente').textContent = formatoMoneda(pendiente);
}

// ========================================
// EQUIPOS
// ========================================
async function cargarEquipos(clienteId) {
  const tbody = document.getElementById('tablaEquipos');
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
  document.getElementById('formPago').reset();
  document.getElementById('pagoAdeudo').textContent = document.getElementById('adeudoTotal').textContent;
  document.getElementById('pagoSaldoFavor').textContent = document.getElementById('saldoFavor').textContent;
  llenarSelectMetodos('pagoMetodo', metodosPago);
  abrirModal('modalPago');
}

async function guardarPago() {
  const btn = document.getElementById('btnGuardarPago');
  const monto = parseFloat(document.getElementById('pagoMonto').value);
  const metodo = document.getElementById('pagoMetodo').value;
  
  if (!monto || monto <= 0) { toastAdvertencia('Ingresa un monto válido'); return; }
  if (!metodo) { toastAdvertencia('Selecciona un método'); return; }
  
  btnLoading(btn, true);
  
  try {
    const datos = {
      cliente_id: clienteActual.id,
      monto,
      metodo_pago_id: metodo,
      referencia: document.getElementById('pagoReferencia').value,
      banco: document.getElementById('pagoBanco').value,
      quien_paga: document.getElementById('pagoQuienPaga').value,
      telefono_quien_paga: document.getElementById('pagoTelefono').value,
      observaciones: document.getElementById('pagoObservaciones').value,
      usar_saldo_favor: document.getElementById('pagoUsarSaldo').checked
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
    document.getElementById('btnCancelarPago').style.display = esCancelado ? 'none' : 'inline-flex';
    document.getElementById('btnActualizarPago').style.display = esCancelado ? 'none' : 'inline-flex';
    
    abrirModal('modalVerPago');
  } catch (err) {
    console.error('Error:', err);
    toastError('Error al cargar pago');
  }
}

async function actualizarPago() {
  const id = document.getElementById('verPagoId').value;
  const btn = document.getElementById('btnActualizarPago');
  
  btnLoading(btn, true);
  
  try {
    const datos = {
      referencia: document.getElementById('editPagoReferencia').value,
      banco: document.getElementById('editPagoBanco').value,
      quien_paga: document.getElementById('editPagoQuienPaga').value,
      telefono_quien_paga: document.getElementById('editPagoTelefono').value,
      observaciones: document.getElementById('editPagoObservaciones').value,
      metodo_pago: pagoSeleccionado.metodo_pago
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
  document.getElementById('motivoCancelacion').value = '';
  abrirModal('modalCancelarPago');
}

async function confirmarCancelarPago() {
  const id = document.getElementById('verPagoId').value;
  const motivo = document.getElementById('motivoCancelacion').value;
  
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
  document.getElementById('formCargo').reset();
  document.getElementById('cargoFecha').value = new Date().toISOString().split('T')[0];
  abrirModal('modalCargo');
}

async function guardarCargo() {
  const concepto = document.getElementById('cargoConcepto').value;
  const monto = parseFloat(document.getElementById('cargoMonto').value);
  
  if (!concepto || !monto) { toastAdvertencia('Completa los campos requeridos'); return; }
  
  try {
    const datos = {
      cliente_id: clienteActual.id,
      concepto,
      monto,
      fecha_vencimiento: document.getElementById('cargoFecha').value,
      descripcion: document.getElementById('cargoDescripcion').value
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
  document.getElementById('modalEquipoTitulo').innerHTML = '<span class="material-symbols-outlined">router</span>Agregar Equipo';
  document.getElementById('formEquipo').reset();
  document.getElementById('equipoId').value = '';
  document.getElementById('equipoFecha').value = new Date().toISOString().split('T')[0];
  llenarSelect('equipoTipo', tiposEquipo);
  llenarSelect('equipoEstado', estadosEquipo);
  abrirModal('modalEquipo');
}

async function editarEquipo(id) {
  try {
    const data = await fetchGet(`/api/equipos/${id}`);
    if (!data.ok) { toastError('Error al cargar'); return; }
    
    const e = data.equipo;
    document.getElementById('modalEquipoTitulo').innerHTML = '<span class="material-symbols-outlined">edit</span>Editar Equipo';
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
  const id = document.getElementById('equipoId').value;
  
  const datos = {
    cliente_id: clienteActual.id,
    tipo: document.getElementById('equipoTipo').value,
    marca: document.getElementById('equipoMarca').value,
    modelo: document.getElementById('equipoModelo').value,
    serie: document.getElementById('equipoSerie').value,
    mac: document.getElementById('equipoMac').value.toUpperCase(),
    ip: document.getElementById('equipoIp').value,
    estado: document.getElementById('equipoEstado').value,
    fecha_instalacion: document.getElementById('equipoFecha').value || null,
    notas: document.getElementById('equipoNotas').value
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
  
  document.getElementById('formInstalacion').reset();
  document.getElementById('instFecha').value = new Date().toISOString().split('T')[0];
  document.getElementById('instDiaCorte').value = clienteActual.dia_corte || 10;
  document.getElementById('instPreview').style.display = 'none';
  
  llenarSelect('instPlan', planes);
  if (clienteActual.plan_id) {
    document.getElementById('instPlan').value = clienteActual.plan_id;
    const plan = planes.find(p => p.id === clienteActual.plan_id);
    if (plan) document.getElementById('instTarifa').value = plan.precio_mensual;
  }
  
  document.getElementById('instPlan').onchange = (e) => {
    const plan = planes.find(p => p.id === e.target.value);
    if (plan) document.getElementById('instTarifa').value = plan.precio_mensual;
  };
  
  abrirModal('modalInstalacion');
}

function calcularCargosInstalacion() {
  const fecha = document.getElementById('instFecha').value;
  const diaCorte = parseInt(document.getElementById('instDiaCorte').value) || 10;
  const tarifa = parseFloat(document.getElementById('instTarifa').value) || 0;
  const costoInst = parseFloat(document.getElementById('instCosto').value) || 0;
  
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
  let total = 0;
  lista.innerHTML = cargos.map(c => {
    total += c.monto;
    return `<div class="preview-cargos__item"><span>${c.concepto} <small class="text-muted">${c.descripcion}</small></span><strong>${formatoMoneda(c.monto)}</strong></div>`;
  }).join('');
  
  document.getElementById('instCargosTotal').textContent = formatoMoneda(total);
  document.getElementById('instPreview').style.display = 'block';
}

async function confirmarInstalacion() {
  const datos = {
    fecha_instalacion: document.getElementById('instFecha').value,
    dia_corte: parseInt(document.getElementById('instDiaCorte').value),
    plan_id: document.getElementById('instPlan').value,
    tarifa_mensual: parseFloat(document.getElementById('instTarifa').value),
    costo_instalacion: parseFloat(document.getElementById('instCosto').value) || 0,
    tecnico_instalador: document.getElementById('instTecnico').value,
    notas_instalacion: document.getElementById('instNotas').value
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
  document.getElementById('editNombre').value = c.nombre || '';
  document.getElementById('editApellido').value = c.apellido_paterno || '';
  document.getElementById('editTelefono').value = c.telefono || '';
  document.getElementById('editEmail').value = c.email || '';
  document.getElementById('editDireccion').value = c.direccion || '';
  document.getElementById('editReferencia').value = c.referencia || '';
  document.getElementById('editTarifa').value = c.tarifa_mensual || '';
  document.getElementById('editDiaCorte').value = c.dia_corte || 10;
  document.getElementById('editEstado').value = c.estado || 'activo';
  
  llenarSelect('editCiudad', ciudades);
  llenarSelect('editPlan', planes);
  
  document.getElementById('editCiudad').value = c.ciudad_id || '';
  document.getElementById('editPlan').value = c.plan_id || '';
  
  if (c.ciudad_id) {
    await cargarColonias(c.ciudad_id, 'editColonia', c.colonia_id);
  }
  
  document.getElementById('editCiudad').onchange = (e) => cargarColonias(e.target.value, 'editColonia');
  document.getElementById('editPlan').onchange = (e) => {
    const plan = planes.find(p => p.id === e.target.value);
    if (plan) document.getElementById('editTarifa').value = plan.precio_mensual;
  };
  
  abrirModal('modalEditar');
}

async function guardarEdicion() {
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
    cuota_mensual: parseFloat(document.getElementById('editTarifa').value) || 0,
    dia_corte: parseInt(document.getElementById('editDiaCorte').value) || 10,
    estado: document.getElementById('editEstado').value
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
  document.getElementById(id).classList.add('active');
}

function cerrarModal(id) {
  document.getElementById(id).classList.remove('active');
}

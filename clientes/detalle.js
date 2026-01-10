// ========================================
// SKYNET - DETALLE CLIENTE JS
// ========================================

let clienteActual = null;

document.addEventListener('DOMContentLoaded', () => {
  cargarUsuarioHeader();
  inicializarTabs();
  
  const params = new URLSearchParams(window.location.search);
  const clienteId = params.get('id');
  
  if (!clienteId) {
    toastError('Cliente no especificado');
    setTimeout(() => window.location.href = '/skynet-frontend/clientes/', 2000);
    return;
  }
  
  cargarCliente(clienteId);
});

function inicializarTabs() {
  document.querySelectorAll('.content-tabs__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.content-tabs__btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.content-panel').forEach(p => p.classList.remove('active'));
      
      btn.classList.add('active');
      document.getElementById('panel-' + btn.dataset.tab).classList.add('active');
    });
  });
}

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
    
  } catch (err) {
    console.error('Error:', err);
    toastError('Error al cargar cliente');
  }
}

function renderizarCliente(c) {
  // Avatar e iniciales
  const iniciales = obtenerIniciales(c.nombre, c.apellido_paterno);
  document.getElementById('clienteAvatar').textContent = iniciales;
  
  // Nombre completo con ID
  const nombreCompleto = `${c.nombre} ${c.apellido_paterno || ''} ${c.apellido_materno || ''}`.trim();
  document.getElementById('clienteNombre').textContent = `${nombreCompleto} - ID: #${c.numero_cliente || 'SKY-0000'}`;
  
  // Estado
  const badgeEstado = document.getElementById('clienteEstado');
  badgeEstado.textContent = (c.estado || 'activo').toUpperCase();
  badgeEstado.className = 'profile-badge ' + (c.estado || 'active');
  
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
  if (saldo > 0) {
    estadoCuenta.textContent = 'Saldo pendiente';
    estadoCuenta.className = 'stat-box__sub danger';
  } else {
    estadoCuenta.textContent = 'Cuenta al corriente';
    estadoCuenta.className = 'stat-box__sub success';
  }
  
  // Próximo corte
  const hoy = new Date();
  let proximoCorte = new Date(hoy.getFullYear(), hoy.getMonth(), c.dia_corte || 10);
  if (proximoCorte < hoy) {
    proximoCorte = new Date(hoy.getFullYear(), hoy.getMonth() + 1, c.dia_corte || 10);
  }
  const diasRestantes = Math.ceil((proximoCorte - hoy) / (1000 * 60 * 60 * 24));
  
  document.getElementById('proximoCorte').textContent = proximoCorte.toLocaleDateString('es-MX', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  });
  document.getElementById('diasRestantes').textContent = `En ${diasRestantes} días`;
  
  // Contacto
  document.getElementById('clienteTelefono').textContent = c.telefono || '--';
  document.getElementById('clienteTelefono2').textContent = c.telefono_secundario || '--';
  document.getElementById('clienteReferencia').textContent = c.referencia || '--';
  
  // WhatsApp
  document.getElementById('btnWhatsApp').onclick = () => {
    const tel = c.telefono?.replace(/\D/g, '');
    if (tel) {
      window.open(`https://wa.me/52${tel}`, '_blank');
    }
  };
  
  // INE
  renderizarINE(c);
}

function renderizarINE(c) {
  const ineFrente = document.getElementById('ineFrente');
  const ineReverso = document.getElementById('ineReverso');
  
  if (c.ine_frente) {
    ineFrente.classList.add('has-image');
    ineFrente.innerHTML = `
      <img src="${c.ine_frente}" alt="INE Frente">
      <span class="check"><span class="material-symbols-outlined">check</span></span>
    `;
  }
  
  if (c.ine_reverso) {
    ineReverso.classList.add('has-image');
    ineReverso.innerHTML = `
      <img src="${c.ine_reverso}" alt="INE Reverso">
      <span class="check"><span class="material-symbols-outlined">check</span></span>
    `;
  }
}

async function cargarEquipos(clienteId) {
  const tbody = document.getElementById('tablaEquipos');
  
  try {
    const data = await fetchGet(`/api/equipos?cliente_id=${clienteId}`);
    
    if (!data.ok || !data.equipos?.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4">
            <div class="empty-state">
              <span class="material-symbols-outlined">router</span>
              <p>Sin equipos registrados</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = data.equipos.map(e => `
      <tr>
        <td>
          <span class="material-symbols-outlined">${e.tipo === 'router' ? 'router' : 'cell_tower'}</span>
          ${e.marca || ''} ${e.modelo || ''}
        </td>
        <td><code>${e.mac || '--'}</code></td>
        <td>${e.serial || '--'}</td>
        <td>
          <span class="${e.estado === 'activo' ? 'status-online' : 'status-offline'}">
            ${e.estado === 'activo' ? 'Online' : 'Offline'}
          </span>
        </td>
      </tr>
    `).join('');
    
  } catch (err) {
    console.error('Error cargando equipos:', err);
    tbody.innerHTML = '<tr><td colspan="4" class="text-center">Error al cargar</td></tr>';
  }
}

async function cargarPagos(clienteId) {
  const container = document.getElementById('listaPagos');
  
  try {
    const data = await fetchGet(`/api/pagos?cliente_id=${clienteId}&limite=10`);
    
    if (!data.ok || !data.pagos?.length) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="material-symbols-outlined">receipt_long</span>
          <p>Sin transacciones registradas</p>
        </div>
      `;
      return;
    }

    container.innerHTML = data.pagos.map(p => `
      <div class="transaction-item">
        <div class="transaction-item__icon ${p.tipo === 'mensualidad' ? 'green' : ''}">
          <span class="material-symbols-outlined">${p.tipo === 'mensualidad' ? 'add' : 'description'}</span>
        </div>
        <div class="transaction-item__info">
          <p class="transaction-item__title">Pago de ${p.tipo || 'Servicio'}</p>
          <p class="transaction-item__date">${formatoFecha(p.fecha_pago)} • ${p.metodo_pago || 'Efectivo'}</p>
        </div>
        <p class="transaction-item__amount">-${formatoMoneda(p.monto)}</p>
      </div>
    `).join('');
    
  } catch (err) {
    console.error('Error cargando pagos:', err);
    container.innerHTML = '<p class="text-center">Error al cargar</p>';
  }
}

function registrarPago() {
  if (!clienteActual) return;
  toastInfo('Módulo de pagos en desarrollo');
}

function editarCliente() {
  if (!clienteActual) return;
  window.location.href = `/skynet-frontend/clientes/?editar=${clienteActual.id}`;
}

function administrarEquipos() {
  toastInfo('Módulo de equipos en desarrollo');
}

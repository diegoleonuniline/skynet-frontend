// ========================================
// SKYNET - DETALLE CLIENTE JS
// ========================================

let clienteActual = null;

document.addEventListener('DOMContentLoaded', () => {
  verificarSesion();
  cargarUsuarioHeader();
  inicializarTabs();
  
  const params = new URLSearchParams(window.location.search);
  const clienteId = params.get('id');
  
  if (!clienteId) {
    toastError('Client not specified');
    setTimeout(() => window.location.href = '/skynet-frontend/clientes/', 2000);
    return;
  }
  
  cargarCliente(clienteId);
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

async function cargarCliente(id) {
  try {
    const data = await fetchGet(`/api/clientes/${id}`);
    
    if (!data.ok) {
      toastError('Error loading client');
      return;
    }

    clienteActual = data.cliente;
    renderizarCliente(clienteActual);
    cargarEquipos(id);
    cargarPagos(id);
    inicializarSubidaINE();
    
  } catch (err) {
    console.error('Error:', err);
    toastError('Error loading client');
  }
}

function renderizarCliente(c) {
  // Avatar
  document.getElementById('clienteAvatar').textContent = obtenerIniciales(c.nombre, c.apellido_paterno);
  
  // Nombre con ID
  document.getElementById('clienteNombre').textContent = `${c.nombre} ${c.apellido_paterno || ''} ${c.apellido_materno || ''} - ID: #${c.numero_cliente || 'SKY-0000'}`.trim();
  
  // Badge Estado
  const badge = document.getElementById('clienteEstado');
  badge.textContent = (c.estado || 'active').toUpperCase();
  badge.className = 'profile-card__badge ' + (c.estado || 'active');
  
  // Email y dirección
  document.getElementById('clienteEmail').innerHTML = `<span class="material-symbols-outlined">mail</span> ${c.email || 'No email'}`;
  document.getElementById('clienteDireccion').innerHTML = `<span class="material-symbols-outlined">location_on</span> ${c.direccion || ''}, ${c.colonia_nombre || ''}, ${c.ciudad_nombre || ''}`;
  
  // Stats
  document.getElementById('cuotaMensual').innerHTML = `${formatoMoneda(c.cuota_mensual)} <small>/mo</small>`;
  document.getElementById('planNombre').textContent = `Skynet Plan: ${c.plan_nombre || 'No plan'}`;
  
  // Saldo
  const saldo = c.saldo_pendiente || 0;
  document.getElementById('saldoActual').textContent = formatoMoneda(saldo);
  const estadoCuenta = document.getElementById('estadoCuenta');
  estadoCuenta.textContent = saldo > 0 ? 'Balance pending' : 'Account Up to date';
  estadoCuenta.className = 'detail-stat__sub ' + (saldo > 0 ? 'danger' : 'success');
  
  // Próximo corte
  const hoy = new Date();
  let proximoCorte = new Date(hoy.getFullYear(), hoy.getMonth(), c.dia_corte || 10);
  if (proximoCorte < hoy) {
    proximoCorte = new Date(hoy.getFullYear(), hoy.getMonth() + 1, c.dia_corte || 10);
  }
  const diasRestantes = Math.ceil((proximoCorte - hoy) / (1000 * 60 * 60 * 24));
  
  document.getElementById('proximoCorte').textContent = proximoCorte.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
  document.getElementById('diasRestantes').textContent = `In ${diasRestantes} days`;
  
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

function renderizarINE(c) {
  const ineFrente = document.getElementById('ineFrente');
  const ineReverso = document.getElementById('ineReverso');
  
  ineFrente.classList.remove('has-image');
  ineReverso.classList.remove('has-image');
  
  if (c.ine_frente) {
    ineFrente.classList.add('has-image');
    ineFrente.innerHTML = `
      <img src="${c.ine_frente}" alt="INE Front">
      <span class="check"><span class="material-symbols-outlined">check</span></span>
    `;
  } else {
    ineFrente.innerHTML = `
      <span class="material-symbols-outlined">cloud_upload</span>
      <span>Click to upload</span>
    `;
  }
  
  if (c.ine_reverso) {
    ineReverso.classList.add('has-image');
    ineReverso.innerHTML = `
      <img src="${c.ine_reverso}" alt="INE Back">
      <span class="check"><span class="material-symbols-outlined">check</span></span>
    `;
  } else {
    ineReverso.innerHTML = `
      <span class="material-symbols-outlined">add_photo_alternate</span>
      <span>Upload Back Side</span>
      <small>PNG, JPG up to 10MB</small>
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
              <p>No equipment registered</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = data.equipos.map(e => `
      <tr>
        <td>${e.marca || ''} ${e.modelo || ''}</td>
        <td><code style="font-size: 12px; color: var(--text-muted);">${e.mac || '--'}</code></td>
        <td>${e.serial || '--'}</td>
        <td>
          <span class="equipment-status ${e.estado === 'activo' ? 'online' : 'offline'}">
            ${e.estado === 'activo' ? 'Online' : 'Offline'}
          </span>
        </td>
      </tr>
    `).join('');
    
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Error loading</td></tr>';
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
          <p>No transactions recorded</p>
        </div>
      `;
      return;
    }

    container.innerHTML = data.pagos.map(p => `
      <div class="transaction-item">
        <div class="transaction-item__icon green">
          <span class="material-symbols-outlined">add</span>
        </div>
        <div class="transaction-item__info">
          <p class="transaction-item__title">Monthly Subscription Payment</p>
          <p class="transaction-item__date">${formatoFecha(p.fecha_pago)} • ${p.metodo_pago || 'Cash'}</p>
        </div>
        <p class="transaction-item__amount">-${formatoMoneda(p.monto)}</p>
      </div>
    `).join('');
    
  } catch (err) {
    container.innerHTML = '<p class="text-center text-muted">Error loading</p>';
  }
}

// ========================================
// SUBIDA INE
// ========================================

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
      if (archivo.size > 10 * 1024 * 1024) {
        toastError('File must be less than 10MB');
        return;
      }
      subirINE(archivo, tipo);
    }
  };
  input.click();
}

async function subirINE(archivo, tipo) {
  if (!clienteActual) return;
  
  const box = document.getElementById(tipo === 'ine_frente' ? 'ineFrente' : 'ineReverso');
  box.innerHTML = `<span class="material-symbols-outlined" style="animation: spin 1s linear infinite;">sync</span><span>Uploading...</span>`;
  
  try {
    const base64 = await convertirABase64(archivo);
    
    const data = await fetchPost('/api/documentos/subir', {
      cliente_id: clienteActual.id,
      tipo: tipo,
      imagen: base64
    });
    
    if (data.ok) {
      toastExito('Document uploaded successfully');
      clienteActual[tipo] = data.url;
      renderizarINE(clienteActual);
    } else {
      toastError(data.mensaje || 'Error uploading');
      renderizarINE(clienteActual);
    }
  } catch (err) {
    console.error('Error:', err);
    toastError('Error uploading document');
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
// ACCIONES
// ========================================

function registrarPago() {
  toastInfo('Payment module coming soon');
}

function editarCliente() {
  if (clienteActual) {
    window.location.href = `/skynet-frontend/clientes/?editar=${clienteActual.id}`;
  }
}

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

// Inicializar eventos
function inicializarEventos() {
  // Tabs de estado
  document.querySelectorAll('.tabs__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tabs__btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filtroEstado = btn.dataset.filtro;
      paginaActual = 1;
      cargarClientes();
    });
  });

  // Buscador
  let timeout;
  document.getElementById('buscadorGlobal').addEventListener('input', (e) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      paginaActual = 1;
      cargarClientes();
    }, 300);
  });

  // Cambio de ciudad para cargar colonias
  document.getElementById('ciudadId').addEventListener('change', (e) => {
    cargarColoniasPorCiudad(e.target.value);
  });

  // Cambio de plan para poner cuota
  document.getElementById('planId').addEventListener('change', (e) => {
    const plan = planes.find(p => p.id === e.target.value);
    if (plan) {
      document.getElementById('cuotaMensual').value = plan.precio_mensual;
    }
  });
}

// Cargar catálogos
async function cargarCatalogos() {
  try {
    // Ciudades
    const rCiudades = await fetchGet('/api/catalogos/ciudades');
    if (rCiudades.ok) {
      ciudades = rCiudades.ciudades;
      llenarSelect('ciudadId', ciudades, 'id', 'nombre');
      llenarSelect('filtroCiudad', ciudades, 'id', 'nombre', true);
    }

    // Planes
    const rPlanes = await fetchGet('/api/catalogos/planes');
    if (rPlanes.ok) {
      planes = rPlanes.planes;
      llenarSelect('planId', planes, 'id', 'nombre');
      llenarSelect('filtroPlan', planes, 'id', 'nombre', true);
    }
  } catch (err) {
    console.error('Error cargando catálogos:', err);
  }
}

// Llenar select
function llenarSelect(id, datos, valorKey, textoKey, conTodos = false) {
  const select = document.getElementById(id);
  if (!select) return;
  
  let html = conTodos ? '<option value="">Todos</option>' : '<option value="">Seleccionar...</option>';
  datos.forEach(item => {
    html += `<option value="${item[valorKey]}">${item[textoKey]}</option>`;
  });
  select.innerHTML = html;
}

// Cargar colonias por ciudad
async function cargarColoniasPorCiudad(ciudadId) {
  const select = document.getElementById('coloniaId');
  
  if (!ciudadId) {
    select.innerHTML = '<option value="">Seleccionar...</option>';
    return;
  }

  try {
    const r = await fetchGet(`/api/catalogos/colonias?ciudad_id=${ciudadId}`);
    if (r.ok) {
      colonias = r.colonias;
      llenarSelect('coloniaId', colonias, 'id', 'nombre');
    }
  } catch (err) {
    console.error('Error cargando colonias:', err);
  }
}

// Cargar clientes
async function cargarClientes() {
  const tbody = document.getElementById('tablaClientes');
  tbody.innerHTML = '<tr><td colspan="7" class="text-center">Cargando...</td></tr>';

  try {
    const busqueda = document.getElementById('buscadorGlobal')?.value || '';
    let url = `/api/clientes?pagina=${paginaActual}&limite=${porPagina}`;
    
    if (filtroEstado !== 'todos') {
      url += `&estado=${filtroEstado}`;
    }
    if (busqueda) {
      url += `&busqueda=${encodeURIComponent(busqueda)}`;
    }

    const data = await fetchGet(url);

    if (!data.ok || !data.clientes?.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center">No se encontraron clientes</td></tr>';
      actualizarPaginacion(0, 0, 0);
      return;
    }

    tbody.innerHTML = data.clientes.map(c => `
      <tr>
        <td>
          <div class="table__avatar">
            <div class="table__avatar-circle table__avatar-circle--blue">
              ${obtenerIniciales(c.nombre, c.apellido_paterno)}
            </div>
            <span class="table__avatar-name">${c.nombre} ${c.apellido_paterno || ''} ${c.apellido_materno || ''}</span>
          </div>
        </td>
        <td>${c.telefono || '-'}</td>
        <td>${c.ciudad_nombre || '-'}</td>
        <td>${c.colonia_nombre || '-'}</td>
        <td><span class="badge badge--${c.estado}">${c.estado}</span></td>
        <td class="font-semibold">${formatoMoneda(c.cuota_mensual)}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-secondary" onclick="verCliente('${c.id}')" title="Ver">
              <span class="material-symbols-outlined">visibility</span>
            </button>
            <button class="btn btn-secondary" onclick="editarCliente('${c.id}')" title="Editar">
              <span class="material-symbols-outlined">edit</span>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    // Actualizar contadores
    document.getElementById('totalClientes').textContent = data.total || data.clientes.length;
    actualizarPaginacion(data.paginaActual, data.porPagina, data.total);
    generarBotonesPaginacion(data.totalPaginas, data.paginaActual);

  } catch (err) {
    console.error('Error cargando clientes:', err);
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">Error al cargar clientes</td></tr>';
  }
}

// Actualizar info paginación
function actualizarPaginacion(pagina, porPag, total) {
  const inicio = total === 0 ? 0 : ((pagina - 1) * porPag) + 1;
  const fin = Math.min(pagina * porPag, total);
  
  document.getElementById('paginaInicio').textContent = inicio;
  document.getElementById('paginaFin').textContent = fin;
  document.getElementById('paginaTotal').textContent = total;
}

// Generar botones paginación
function generarBotonesPaginacion(totalPaginas, paginaActual) {
  const contenedor = document.getElementById('paginacionBtns');
  if (!contenedor) return;

  let html = `
    <button class="pagination__btn" onclick="irPagina(${paginaActual - 1})" ${paginaActual <= 1 ? 'disabled' : ''}>
      <span class="material-symbols-outlined">chevron_left</span>
    </button>
  `;

  for (let i = 1; i <= Math.min(totalPaginas, 5); i++) {
    html += `<button class="pagination__btn ${i === paginaActual ? 'active' : ''}" onclick="irPagina(${i})">${i}</button>`;
  }

  if (totalPaginas > 5) {
    html += `<button class="pagination__btn" disabled>...</button>`;
    html += `<button class="pagination__btn" onclick="irPagina(${totalPaginas})">${totalPaginas}</button>`;
  }

  html += `
    <button class="pagination__btn" onclick="irPagina(${paginaActual + 1})" ${paginaActual >= totalPaginas ? 'disabled' : ''}>
      <span class="material-symbols-outlined">chevron_right</span>
    </button>
  `;

  contenedor.innerHTML = html;
}

// Ir a página
function irPagina(pagina) {
  if (pagina < 1) return;
  paginaActual = pagina;
  cargarClientes();
}

// Toggle filtros
function toggleFiltros() {
  document.getElementById('filtrosPanel').classList.toggle('hidden');
}

// Abrir modal nuevo cliente
function abrirModalNuevo() {
  document.getElementById('modalTitulo').textContent = 'Nuevo Cliente';
  document.getElementById('formCliente').reset();
  document.getElementById('clienteId').value = '';
  document.getElementById('fechaInstalacion').value = new Date().toISOString().split('T')[0];
  document.getElementById('modalCliente').classList.add('active');
}

// Editar cliente
async function editarCliente(id) {
  try {
    const data = await fetchGet(`/api/clientes/${id}`);
    if (!data.ok) {
      alert('Error al cargar cliente');
      return;
    }

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
    
    if (c.ciudad_id) {
      await cargarColoniasPorCiudad(c.ciudad_id);
      document.getElementById('coloniaId').value = c.colonia_id || '';
    }
    
    document.getElementById('direccion').value = c.direccion || '';
    document.getElementById('referencia').value = c.referencia || '';
    document.getElementById('planId').value = c.plan_id || '';
    document.getElementById('cuotaMensual').value = c.cuota_mensual || '';
    document.getElementById('fechaInstalacion').value = c.fecha_instalacion?.split('T')[0] || '';

    document.getElementById('modalCliente').classList.add('active');
  } catch (err) {
    console.error('Error:', err);
    alert('Error al cargar cliente');
  }
}

// Ver cliente (detalle)
function verCliente(id) {
  window.location.href = `detalle.html?id=${id}`;
}

// Cerrar modal
function cerrarModal() {
  document.getElementById('modalCliente').classList.remove('active');
}

// Guardar cliente
async function guardarCliente() {
  const id = document.getElementById('clienteId').value;
  
  const datos = {
    nombre: document.getElementById('nombre').value,
    apellido_paterno: document.getElementById('apellidoPaterno').value,
    apellido_materno: document.getElementById('apellidoMaterno').value,
    telefono: document.getElementById('telefono').value,
    telefono_secundario: document.getElementById('telefonoSecundario').value,
    email: document.getElementById('email').value,
    ciudad_id: document.getElementById('ciudadId').value,
    colonia_id: document.getElementById('coloniaId').value,
    direccion: document.getElementById('direccion').value,
    referencia: document.getElementById('referencia').value,
    plan_id: document.getElementById('planId').value,
    cuota_mensual: parseFloat(document.getElementById('cuotaMensual').value) || 0,
    fecha_instalacion: document.getElementById('fechaInstalacion').value
  };

  // Validar campos requeridos
  if (!datos.nombre || !datos.telefono || !datos.ciudad_id || !datos.colonia_id || !datos.direccion || !datos.plan_id) {
    alert('Por favor completa todos los campos requeridos');
    return;
  }

  try {
    let data;
    if (id) {
      data = await fetchPut(`/api/clientes/${id}`, datos);
    } else {
      data = await fetchPost('/api/clientes', datos);
    }

    if (data.ok) {
      cerrarModal();
      cargarClientes();
      alert(id ? 'Cliente actualizado' : 'Cliente creado');
    } else {
      alert(data.mensaje || 'Error al guardar');
    }
  } catch (err) {
    console.error('Error:', err);
    alert('Error al guardar cliente');
  }
}

// Exportar CSV
function exportarCSV() {
  alert('Función de exportar CSV - Próximamente');
}

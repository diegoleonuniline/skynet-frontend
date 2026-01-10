// ============================================
// SKYNET ISP - Clientes View
// ============================================

const ClientesView = {
    state: {
        clientes: [],
        pagination: null,
        filters: {
            page: 1,
            limit: 20,
            search: '',
            estatus_id: '',
            zona_id: ''
        }
    },
    
    render() {
        return `
            <div class="page-header">
                <div>
                    <h1 class="page-title">Clientes</h1>
                    <p class="page-subtitle">Gestión de clientes del sistema</p>
                </div>
                <div class="page-actions">
                    <button class="btn btn-primary" onclick="ClientesView.openCreateModal()">
                        ${ICONS.userPlus}
                        Nuevo Cliente
                    </button>
                </div>
            </div>
            
            <!-- Filters -->
            <div class="filter-bar">
                <div class="search-input">
                    ${ICONS.search}
                    <input type="text" id="search-input" placeholder="Buscar por nombre, código, teléfono..." 
                           value="${this.state.filters.search}">
                </div>
                
                <select id="filter-estatus" class="form-select">
                    <option value="">Todos los estatus</option>
                </select>
                
                <select id="filter-zona" class="form-select">
                    <option value="">Todas las zonas</option>
                </select>
                
                <button class="btn btn-secondary" onclick="ClientesView.clearFilters()">
                    ${ICONS.refresh}
                    Limpiar
                </button>
            </div>
            
            <!-- Table -->
            <div class="card">
                <div class="table-container">
                    <table class="table table-clickable">
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Cliente</th>
                                <th>Teléfono</th>
                                <th>Dirección</th>
                                <th>Zona</th>
                                <th>Servicios</th>
                                <th>Estatus</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody id="clientes-table-body">
                            <tr>
                                <td colspan="8" class="text-center p-6">
                                    <div class="loader-inline animate-spin"></div>
                                    Cargando...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            
            <!-- Pagination -->
            <div id="pagination-container"></div>
        `;
    },
    
    async init() {
        // Load filters options
        await this.loadFilterOptions();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load data
        await this.loadClientes();
    },
    
    async loadFilterOptions() {
        try {
            // Estatus
            const estatusData = await State.getCatalogo('estatusCliente');
            const estatusSelect = $('#filter-estatus');
            if (estatusSelect) {
                estatusData.forEach(e => {
                    estatusSelect.innerHTML += `<option value="${e.id}">${e.nombre}</option>`;
                });
                estatusSelect.value = this.state.filters.estatus_id;
            }
            
            // Zonas
            const zonasData = await State.getCatalogo('zonas');
            const zonasSelect = $('#filter-zona');
            if (zonasSelect) {
                zonasData.forEach(z => {
                    zonasSelect.innerHTML += `<option value="${z.id}">${z.nombre}</option>`;
                });
                zonasSelect.value = this.state.filters.zona_id;
            }
        } catch (error) {
            console.error('Error loading filter options:', error);
        }
    },
    
    setupEventListeners() {
        // Search
        const searchInput = $('#search-input');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.state.filters.search = e.target.value;
                this.state.filters.page = 1;
                this.loadClientes();
            }, 400));
        }
        
        // Estatus filter
        const estatusSelect = $('#filter-estatus');
        if (estatusSelect) {
            estatusSelect.addEventListener('change', (e) => {
                this.state.filters.estatus_id = e.target.value;
                this.state.filters.page = 1;
                this.loadClientes();
            });
        }
        
        // Zona filter
        const zonaSelect = $('#filter-zona');
        if (zonaSelect) {
            zonaSelect.addEventListener('change', (e) => {
                this.state.filters.zona_id = e.target.value;
                this.state.filters.page = 1;
                this.loadClientes();
            });
        }
    },
    
    async loadClientes() {
        const tbody = $('#clientes-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center p-6">
                    <div class="loader-inline animate-spin"></div>
                    Cargando...
                </td>
            </tr>
        `;
        
        try {
            const response = await API.clientes.getAll(this.state.filters);
            
            if (response.success) {
                this.state.clientes = response.data;
                this.state.pagination = response.pagination;
                this.renderTable();
                this.renderPagination();
            }
        } catch (error) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center p-6 text-danger">
                        Error al cargar clientes: ${error.message}
                    </td>
                </tr>
            `;
        }
    },
    
    renderTable() {
        const tbody = $('#clientes-table-body');
        if (!tbody) return;
        
        if (this.state.clientes.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8">
                        ${Components.emptyState('No se encontraron clientes', 'users')}
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = this.state.clientes.map(cliente => `
            <tr onclick="window.location.hash = '#/cliente/${cliente.id}'" style="cursor: pointer;">
                <td>
                    <span class="font-mono text-sm font-semibold">${cliente.codigo || '-'}</span>
                </td>
                <td>
                    <div class="d-flex align-center gap-3">
                        <div class="avatar avatar-sm">
                            ${Utils.getInitials(cliente.nombre, cliente.apellido_paterno)}
                        </div>
                        <div>
                            <div class="font-medium">${cliente.nombre} ${cliente.apellido_paterno || ''} ${cliente.apellido_materno || ''}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="text-sm">${Utils.formatPhone(cliente.telefono1) || '-'}</span>
                </td>
                <td>
                    <span class="text-sm text-secondary">${cliente.calle || ''} ${cliente.numero_exterior || ''}</span>
                    <div class="text-xs text-muted">${cliente.ciudad || ''}</div>
                </td>
                <td>
                    <span class="text-sm">${cliente.zona || '-'}</span>
                </td>
                <td class="text-center">
                    <span class="badge badge-info">${cliente.total_servicios || 0}</span>
                </td>
                <td>
                    ${Components.statusBadge(cliente.estatus || 'ACTIVO')}
                </td>
                <td>
                    <div class="table-actions" onclick="event.stopPropagation()">
                        <button class="table-action-btn" onclick="window.location.hash = '#/cliente/${cliente.id}'" title="Ver detalle">
                            ${ICONS.eye}
                        </button>
                        <button class="table-action-btn" onclick="ClientesView.openEditModal(${cliente.id})" title="Editar">
                            ${ICONS.edit}
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    },
    
    renderPagination() {
        const container = $('#pagination-container');
        if (!container || !this.state.pagination) return;
        
        container.innerHTML = Components.pagination.render(
            this.state.pagination,
            (page) => {
                ClientesView.state.filters.page = page;
                ClientesView.loadClientes();
            }
        );
    },
    
    clearFilters() {
        this.state.filters = {
            page: 1,
            limit: 20,
            search: '',
            estatus_id: '',
            zona_id: ''
        };
        
        $('#search-input').value = '';
        $('#filter-estatus').value = '';
        $('#filter-zona').value = '';
        
        this.loadClientes();
    },
    
    async openCreateModal() {
        const estados = await State.getCatalogo('estados');
        const ciudades = await State.getCatalogo('ciudades');
        const zonas = await State.getCatalogo('zonas');
        
        Components.modal.form({
            title: 'Nuevo Cliente',
            size: 'lg',
            fields: [
                { 
                    type: 'text', 
                    name: 'nombre', 
                    label: 'Nombre(s)', 
                    required: true,
                    placeholder: 'Nombre del cliente'
                },
                { 
                    type: 'text', 
                    name: 'apellido_paterno', 
                    label: 'Apellido Paterno',
                    placeholder: 'Apellido paterno'
                },
                { 
                    type: 'text', 
                    name: 'apellido_materno', 
                    label: 'Apellido Materno',
                    placeholder: 'Apellido materno'
                },
                { 
                    type: 'tel', 
                    name: 'telefono1', 
                    label: 'Teléfono Principal',
                    placeholder: '33-1234-5678'
                },
                { 
                    type: 'tel', 
                    name: 'telefono2', 
                    label: 'Teléfono Secundario',
                    placeholder: '33-1234-5678'
                },
                { 
                    type: 'text', 
                    name: 'calle', 
                    label: 'Calle',
                    placeholder: 'Nombre de la calle'
                },
                { 
                    type: 'text', 
                    name: 'numero_exterior', 
                    label: 'Número Exterior',
                    placeholder: '#123'
                },
                { 
                    type: 'text', 
                    name: 'numero_interior', 
                    label: 'Número Interior',
                    placeholder: 'Depto, local, etc.'
                },
                {
                    type: 'select',
                    name: 'estado_id',
                    label: 'Estado',
                    options: estados.map(e => ({ value: e.id, label: e.nombre }))
                },
                {
                    type: 'select',
                    name: 'ciudad_id',
                    label: 'Ciudad',
                    options: ciudades.map(c => ({ value: c.id, label: c.nombre })),
                    addButton: true,
                    addCatalogo: 'ciudades'
                },
                { 
                    type: 'text', 
                    name: 'codigo_postal', 
                    label: 'Código Postal',
                    placeholder: '44100'
                },
                {
                    type: 'select',
                    name: 'zona_id',
                    label: 'Zona',
                    options: zonas.map(z => ({ value: z.id, label: z.nombre })),
                    addButton: true,
                    addCatalogo: 'zonas'
                }
            ],
            submitText: 'Crear Cliente',
            onSubmit: async (data) => {
                try {
                    Components.loader.show();
                    const response = await API.clientes.create(data);
                    
                    if (response.success) {
                        Components.toast.success('Cliente creado correctamente');
                        Components.modal.hide();
                        
                        // Ir al detalle del cliente
                        window.location.hash = `#/cliente/${response.data.id}`;
                    }
                } catch (error) {
                    Components.toast.error(error.message);
                } finally {
                    Components.loader.hide();
                }
            }
        });
        
        // Escuchar cambio de estado para filtrar ciudades
        setTimeout(() => {
            const estadoSelect = $('[name="estado_id"]');
            const ciudadSelect = $('[name="ciudad_id"]');
            
            if (estadoSelect && ciudadSelect) {
                estadoSelect.addEventListener('change', async (e) => {
                    const estadoId = e.target.value;
                    if (!estadoId) {
                        ciudadSelect.innerHTML = '<option value="">Seleccionar...</option>';
                        return;
                    }
                    
                    try {
                        const response = await API.catalogos.getCiudadesByEstado(estadoId);
                        if (response.success) {
                            ciudadSelect.innerHTML = '<option value="">Seleccionar...</option>' +
                                response.data.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
                        }
                    } catch (error) {
                        console.error('Error loading cities:', error);
                    }
                });
            }
        }, 100);
    },
    
    async openEditModal(clienteId) {
        try {
            Components.loader.show();
            
            const [clienteResponse, estados, ciudades, zonas] = await Promise.all([
                API.clientes.getById(clienteId),
                State.getCatalogo('estados'),
                State.getCatalogo('ciudades'),
                State.getCatalogo('zonas')
            ]);
            
            if (!clienteResponse.success) {
                throw new Error('Cliente no encontrado');
            }
            
            const cliente = clienteResponse.data;
            
            Components.modal.form({
                title: 'Editar Cliente',
                size: 'lg',
                data: cliente,
                fields: [
                    { 
                        type: 'text', 
                        name: 'nombre', 
                        label: 'Nombre(s)', 
                        required: true
                    },
                    { 
                        type: 'text', 
                        name: 'apellido_paterno', 
                        label: 'Apellido Paterno'
                    },
                    { 
                        type: 'text', 
                        name: 'apellido_materno', 
                        label: 'Apellido Materno'
                    },
                    { 
                        type: 'tel', 
                        name: 'telefono1', 
                        label: 'Teléfono Principal'
                    },
                    { 
                        type: 'tel', 
                        name: 'telefono2', 
                        label: 'Teléfono Secundario'
                    },
                    { 
                        type: 'text', 
                        name: 'calle', 
                        label: 'Calle'
                    },
                    { 
                        type: 'text', 
                        name: 'numero_exterior', 
                        label: 'Número Exterior'
                    },
                    { 
                        type: 'text', 
                        name: 'numero_interior', 
                        label: 'Número Interior'
                    },
                    {
                        type: 'select',
                        name: 'estado_id',
                        label: 'Estado',
                        options: estados.map(e => ({ value: e.id, label: e.nombre }))
                    },
                    {
                        type: 'select',
                        name: 'ciudad_id',
                        label: 'Ciudad',
                        options: ciudades.map(c => ({ value: c.id, label: c.nombre })),
                        addButton: true,
                        addCatalogo: 'ciudades'
                    },
                    { 
                        type: 'text', 
                        name: 'codigo_postal', 
                        label: 'Código Postal'
                    },
                    {
                        type: 'select',
                        name: 'zona_id',
                        label: 'Zona',
                        options: zonas.map(z => ({ value: z.id, label: z.nombre })),
                        addButton: true,
                        addCatalogo: 'zonas'
                    }
                ],
                submitText: 'Guardar Cambios',
                onSubmit: async (data) => {
                    try {
                        Components.loader.show();
                        const response = await API.clientes.update(clienteId, data);
                        
                        if (response.success) {
                            Components.toast.success('Cliente actualizado');
                            Components.modal.hide();
                            this.loadClientes();
                        }
                    } catch (error) {
                        Components.toast.error(error.message);
                    } finally {
                        Components.loader.hide();
                    }
                }
            });
        } catch (error) {
            Components.toast.error(error.message);
        } finally {
            Components.loader.hide();
        }
    }
};

// ============================================
// SKYNET ISP - Clientes View (Listado)
// ============================================

const ClientesView = {
    render() {
        return `
            <div class="page-content">
                <!-- Breadcrumb -->
                <nav class="breadcrumb">
                    <a href="#/dashboard" class="breadcrumb-link">Inicio</a>
                    <span class="breadcrumb-sep">${ICONS.chevronRight}</span>
                    <span class="breadcrumb-current">Directorio de Clientes</span>
                </nav>

                <!-- Page Header -->
                <div class="page-header">
                    <div class="page-header-left">
                        <h1 class="page-title">Directorio de Clientes</h1>
                        <p class="page-subtitle">Total suscriptores: <span id="total-clientes">0</span> activos</p>
                    </div>
                    <div class="page-header-right">
                        <button class="btn btn-outline" onclick="ClientesView.exportar()">
                            ${ICONS.download}
                            <span>Exportar CSV</span>
                        </button>
                        <button class="btn btn-primary" onclick="ClientesView.nuevo()">
                            ${ICONS.userPlus}
                            <span>Nuevo Cliente</span>
                        </button>
                    </div>
                </div>

                <!-- Card Principal -->
                <div class="card">
                    <!-- Filtros -->
                    <div class="card-filters">
                        <div class="filter-tabs">
                            <label class="filter-tab">
                                <input type="radio" name="estatus" value="" checked>
                                <span>Todos</span>
                            </label>
                            <label class="filter-tab">
                                <input type="radio" name="estatus" value="1">
                                <span>Activos</span>
                            </label>
                            <label class="filter-tab">
                                <input type="radio" name="estatus" value="2">
                                <span>Suspendidos</span>
                            </label>
                            <label class="filter-tab">
                                <input type="radio" name="estatus" value="3">
                                <span>Cancelados</span>
                            </label>
                        </div>
                        <div class="filter-extra">
                            <select id="filtro-zona" class="filter-select">
                                <option value="">Todas las zonas</option>
                            </select>
                            ${ICONS.filter}
                            <span class="filter-text">Filtrar</span>
                        </div>
                    </div>

                    <!-- Tabla -->
                    <div class="table-wrapper">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Cliente</th>
                                    <th>Teléfono</th>
                                    <th>Ciudad</th>
                                    <th>Zona</th>
                                    <th class="text-center">Estatus</th>
                                    <th class="text-right">Acciones</th>
                                </tr>
                                <tr class="search-row">
                                    <td><input type="text" id="buscar-nombre" class="search-input" placeholder="Buscar nombre..."></td>
                                    <td><input type="text" id="buscar-telefono" class="search-input" placeholder="Buscar teléfono..."></td>
                                    <td><input type="text" id="buscar-ciudad" class="search-input" placeholder="Buscar ciudad..."></td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                </tr>
                            </thead>
                            <tbody id="tabla-clientes">
                                <tr>
                                    <td colspan="6" class="table-empty">
                                        <div class="empty-state">
                                            <div class="spinner"></div>
                                            <p>Cargando clientes...</p>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Paginación -->
                    <div class="table-footer">
                        <p class="table-info">
                            Mostrando <span id="pag-inicio">0</span> a <span id="pag-fin">0</span> de <span id="pag-total">0</span> clientes
                        </p>
                        <div class="pagination" id="paginacion"></div>
                    </div>
                </div>
            </div>
        `;
    },

    init() {
        this.page = 1;
        this.limit = 20;
        this.filters = {};
        
        this.cargarZonas();
        this.cargarClientes();
        this.eventos();
    },

    eventos() {
        // Filtro estatus
        $$('input[name="estatus"]').forEach(r => {
            r.addEventListener('change', e => {
                this.filters.estatus_id = e.target.value;
                this.page = 1;
                this.cargarClientes();
            });
        });

        // Filtro zona
        $('#filtro-zona')?.addEventListener('change', e => {
            this.filters.zona_id = e.target.value;
            this.page = 1;
            this.cargarClientes();
        });

        // Búsquedas
        ['buscar-nombre', 'buscar-telefono', 'buscar-ciudad'].forEach(id => {
            $(`#${id}`)?.addEventListener('input', debounce(() => {
                this.filters.search = $('#buscar-nombre').value || 
                                     $('#buscar-telefono').value || 
                                     $('#buscar-ciudad').value;
                this.page = 1;
                this.cargarClientes();
            }, 400));
        });
    },

    async cargarZonas() {
        const zonas = State.catalogos.zonas || [];
        const select = $('#filtro-zona');
        if (select) {
            select.innerHTML = '<option value="">Todas las zonas</option>' +
                zonas.map(z => `<option value="${z.id}">${z.nombre}</option>`).join('');
        }
    },

    async cargarClientes() {
        const tbody = $('#tabla-clientes');
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="table-empty">
                    <div class="empty-state">
                        <div class="spinner"></div>
                        <p>Cargando clientes...</p>
                    </div>
                </td>
            </tr>
        `;

        try {
            const params = new URLSearchParams({
                page: this.page,
                limit: this.limit,
                ...(this.filters.search && { search: this.filters.search }),
                ...(this.filters.estatus_id && { estatus_id: this.filters.estatus_id }),
                ...(this.filters.zona_id && { zona_id: this.filters.zona_id })
            });

            const res = await API.request(`/clientes?${params}`);
            
            if (res.success) {
                this.renderTabla(res.data);
                this.renderPaginacion(res.pagination);
            }
        } catch (error) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="table-empty">
                        <div class="empty-state error">
                            ${ICONS.alertCircle}
                            <p>Error al cargar clientes</p>
                        </div>
                    </td>
                </tr>
            `;
        }
    },

    renderTabla(clientes) {
        const tbody = $('#tabla-clientes');
        
        if (!clientes?.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="table-empty">
                        <div class="empty-state">
                            ${ICONS.users}
                            <p>No se encontraron clientes</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = clientes.map(c => {
            const iniciales = this.iniciales(c.nombre, c.apellido_paterno);
            const nombre = [c.nombre, c.apellido_paterno, c.apellido_materno].filter(Boolean).join(' ');
            const estatus = (c.estatus || 'Activo').toLowerCase();
            
            return `
                <tr class="table-row" onclick="window.location.hash='#/cliente/${c.id}'">
                    <td>
                        <div class="cliente-cell">
                            <div class="cliente-avatar">${iniciales}</div>
                            <div class="cliente-info">
                                <span class="cliente-nombre">${nombre}</span>
                                <span class="cliente-codigo">${c.codigo || ''}</span>
                            </div>
                        </div>
                    </td>
                    <td class="text-muted">${c.telefono1 || '-'}</td>
                    <td class="text-muted">${c.ciudad || '-'}</td>
                    <td class="text-muted">${c.zona || '-'}</td>
                    <td class="text-center">
                        <span class="badge badge-${estatus}">${c.estatus || 'Activo'}</span>
                    </td>
                    <td class="text-right">
                        <button class="btn-icon" onclick="event.stopPropagation(); ClientesView.menu(${c.id}, this)">
                            ${ICONS.moreVertical}
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        $('#total-clientes').textContent = clientes.length;
    },

    renderPaginacion(pag) {
        if (!pag) return;
        
        const { page, totalPages, total } = pag;
        const inicio = total > 0 ? ((page - 1) * this.limit) + 1 : 0;
        const fin = Math.min(page * this.limit, total);

        $('#pag-inicio').textContent = inicio;
        $('#pag-fin').textContent = fin;
        $('#pag-total').textContent = total;

        const div = $('#paginacion');
        if (totalPages <= 1) { div.innerHTML = ''; return; }

        let html = `<button class="pag-btn" ${page <= 1 ? 'disabled' : ''} onclick="ClientesView.irPagina(${page - 1})">${ICONS.chevronLeft}</button>`;

        const max = 5;
        let start = Math.max(1, page - Math.floor(max / 2));
        let end = Math.min(totalPages, start + max - 1);
        if (end - start + 1 < max) start = Math.max(1, end - max + 1);

        if (start > 1) {
            html += `<button class="pag-btn" onclick="ClientesView.irPagina(1)">1</button>`;
            if (start > 2) html += `<span class="pag-dots">...</span>`;
        }

        for (let i = start; i <= end; i++) {
            html += `<button class="pag-btn ${i === page ? 'active' : ''}" onclick="ClientesView.irPagina(${i})">${i}</button>`;
        }

        if (end < totalPages) {
            if (end < totalPages - 1) html += `<span class="pag-dots">...</span>`;
            html += `<button class="pag-btn" onclick="ClientesView.irPagina(${totalPages})">${totalPages}</button>`;
        }

        html += `<button class="pag-btn" ${page >= totalPages ? 'disabled' : ''} onclick="ClientesView.irPagina(${page + 1})">${ICONS.chevronRight}</button>`;

        div.innerHTML = html;
    },

    irPagina(p) {
        this.page = p;
        this.cargarClientes();
    },

    iniciales(nombre, apellido) {
        return (nombre?.charAt(0) || '') + (apellido?.charAt(0) || '') || '??';
    },

    menu(id, btn) {
        // TODO: Dropdown menu
        console.log('Menu cliente:', id);
    },

    exportar() {
        Components.toast.info('Exportando CSV...');
    },

    nuevo() {
        window.location.hash = '#/cliente/nuevo';
    }
};

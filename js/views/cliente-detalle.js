// ============================================
// SKYNET ISP - Cliente Detalle View
// ============================================

const ClienteDetalleView = {
    cliente: null,

    render() {
        const isNew = window.location.hash.includes('nuevo');
        
        if (isNew) {
            return this.renderFormulario();
        }
        return this.renderDetalle();
    },

    renderFormulario(cliente = null) {
        const estados = State.catalogos.estados || [];
        const zonas = State.catalogos.zonas || [];
        const estatusCliente = State.catalogos.estatusCliente || [];
        const isEdit = !!cliente;

        return `
            <div class="page-content">
                <!-- Breadcrumb -->
                <nav class="breadcrumb">
                    <a href="#/clientes" class="breadcrumb-link">Clientes</a>
                    <span class="breadcrumb-sep">${ICONS.chevronRight}</span>
                    <span class="breadcrumb-current">${isEdit ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}</span>
                </nav>

                <!-- Header -->
                <div class="page-header">
                    <div class="page-header-left">
                        <h1 class="page-title">${isEdit ? 'Editar Cliente' : 'Registro Skynet'}</h1>
                        <p class="page-subtitle">${isEdit ? 'Modifique la información del cliente.' : 'Complete la información para agregar un nuevo suscriptor a la red Skynet.'}</p>
                    </div>
                </div>

                <!-- Formulario -->
                <form id="form-cliente" class="form-sections">
                    <input type="hidden" name="id" value="${cliente?.id || ''}">

                    <!-- Estatus (solo en edición) -->
                    ${isEdit ? `
                    <section class="form-section">
                        <div class="form-section-header">
                            ${ICONS.settings}
                            <h2>Estado del Cliente</h2>
                        </div>
                        <div class="form-section-body">
                            <div class="form-grid cols-3">
                                <div class="form-group">
                                    <label class="form-label">Código</label>
                                    <input type="text" class="form-input" value="${cliente?.codigo || ''}" disabled>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Estatus</label>
                                    <select name="estatus_id" class="form-input">
                                        ${estatusCliente.map(e => `
                                            <option value="${e.id}" ${cliente?.estatus_id == e.id ? 'selected' : ''}>${e.nombre}</option>
                                        `).join('')}
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Fecha Registro</label>
                                    <input type="text" class="form-input" value="${cliente?.created_at ? new Date(cliente.created_at).toLocaleDateString('es-MX') : ''}" disabled>
                                </div>
                            </div>
                        </div>
                    </section>
                    ` : ''}

                    <!-- Datos Personales -->
                    <section class="form-section">
                        <div class="form-section-header">
                            ${ICONS.user}
                            <h2>Datos Personales</h2>
                        </div>
                        <div class="form-section-body">
                            <div class="form-grid cols-3">
                                <div class="form-group">
                                    <label class="form-label required">Nombre</label>
                                    <input type="text" name="nombre" class="form-input" placeholder="Nombre(s)" value="${cliente?.nombre || ''}" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Apellido Paterno</label>
                                    <input type="text" name="apellido_paterno" class="form-input" placeholder="Apellido paterno" value="${cliente?.apellido_paterno || ''}">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Apellido Materno</label>
                                    <input type="text" name="apellido_materno" class="form-input" placeholder="Apellido materno" value="${cliente?.apellido_materno || ''}">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Teléfono Principal</label>
                                    <input type="tel" name="telefono1" class="form-input" placeholder="(000) 000-0000" value="${cliente?.telefono1 || ''}">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Teléfono Secundario</label>
                                    <input type="tel" name="telefono2" class="form-input" placeholder="(000) 000-0000" value="${cliente?.telefono2 || ''}">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Teléfono Subcliente</label>
                                    <input type="tel" name="telefono3_subcliente" class="form-input" placeholder="(000) 000-0000" value="${cliente?.telefono3_subcliente || ''}">
                                </div>
                            </div>
                        </div>
                    </section>

                    <!-- Dirección -->
                    <section class="form-section">
                        <div class="form-section-header">
                            ${ICONS.mapPin}
                            <h2>Dirección</h2>
                        </div>
                        <div class="form-section-body">
                            <div class="form-grid cols-3">
                                <div class="form-group col-span-2">
                                    <label class="form-label">Calle</label>
                                    <input type="text" name="calle" class="form-input" placeholder="Nombre de la calle" value="${cliente?.calle || ''}">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Código Postal</label>
                                    <input type="text" name="codigo_postal" class="form-input" placeholder="00000" value="${cliente?.codigo_postal || ''}">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Número Exterior</label>
                                    <input type="text" name="numero_exterior" class="form-input" placeholder="123" value="${cliente?.numero_exterior || ''}">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Número Interior</label>
                                    <input type="text" name="numero_interior" class="form-input" placeholder="Depto 4B" value="${cliente?.numero_interior || ''}">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Estado</label>
                                    <select name="estado_id" class="form-input" id="select-estado" onchange="ClienteDetalleView.cargarCiudades(this.value)">
                                        <option value="">Seleccionar...</option>
                                        ${estados.map(e => `<option value="${e.id}" ${cliente?.estado_id == e.id ? 'selected' : ''}>${e.nombre}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Ciudad</label>
                                    <select name="ciudad_id" id="select-ciudad" class="form-input" data-selected="${cliente?.ciudad_id || ''}">
                                        <option value="">Seleccionar...</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Zona</label>
                                    <select name="zona_id" class="form-input">
                                        <option value="">Seleccionar...</option>
                                        ${zonas.map(z => `<option value="${z.id}" ${cliente?.zona_id == z.id ? 'selected' : ''}>${z.nombre}</option>`).join('')}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </section>

                    <!-- Botones -->
                    <div class="form-actions">
                        <button type="button" class="btn btn-outline" onclick="window.location.hash='${isEdit ? '#/cliente/' + cliente.id : '#/clientes'}'">
                            Cancelar
                        </button>
                        <button type="submit" class="btn btn-primary">
                            ${ICONS.save}
                            <span>${isEdit ? 'Actualizar Cliente' : 'Guardar Cliente'}</span>
                        </button>
                    </div>
                </form>
            </div>
        `;
    },

    renderDetalle() {
        return `
            <div class="page-content">
                <!-- Breadcrumb -->
                <nav class="breadcrumb">
                    <a href="#/clientes" class="breadcrumb-link">Clientes</a>
                    <span class="breadcrumb-sep">${ICONS.chevronRight}</span>
                    <span class="breadcrumb-current">Detalle del Cliente</span>
                </nav>

                <!-- Loading inicial -->
                <div id="cliente-loading" class="loading-state">
                    <div class="spinner"></div>
                    <p>Cargando información del cliente...</p>
                </div>

                <!-- Contenido (se llena dinámicamente) -->
                <div id="cliente-content" style="display: none;"></div>
            </div>
        `;
    },

    renderClienteContent(cliente) {
        const nombre = [cliente.nombre, cliente.apellido_paterno, cliente.apellido_materno].filter(Boolean).join(' ');
        const iniciales = (cliente.nombre?.charAt(0) || '') + (cliente.apellido_paterno?.charAt(0) || '');
        const direccion = [cliente.calle, cliente.numero_exterior, cliente.ciudad, cliente.estado].filter(Boolean).join(', ');
        const estatus = (cliente.estatus || 'Activo').toLowerCase();
        const saldo = parseFloat(cliente.saldo || 0);

        return `
            <!-- Header Card -->
            <div class="profile-card">
                <div class="profile-card-bg"></div>
                <div class="profile-card-content">
                    <div class="profile-info">
                        <div class="profile-avatar">${iniciales || '??'}</div>
                        <div class="profile-data">
                            <div class="profile-name-row">
                                <h2 class="profile-name">${nombre}</h2>
                                <span class="profile-code">#${cliente.codigo || 'N/A'}</span>
                                <span class="badge badge-${estatus}">${cliente.estatus || 'Activo'}</span>
                            </div>
                            <div class="profile-contacts">
                                <span class="profile-contact">
                                    ${ICONS.phone}
                                    ${cliente.telefono1 || 'Sin teléfono'}
                                </span>
                                <span class="profile-contact">
                                    ${ICONS.mapPin}
                                    ${direccion || 'Sin dirección'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="profile-actions">
                        <button class="btn btn-primary" onclick="ClienteDetalleView.registrarPago()">
                            ${ICONS.dollarSign}
                            <span>Registrar Pago</span>
                        </button>
                        <button class="btn btn-outline" onclick="ClienteDetalleView.editar()">
                            ${ICONS.edit}
                            <span>Editar</span>
                        </button>
                        <div class="dropdown">
                            <button class="btn btn-outline btn-icon" onclick="this.nextElementSibling.classList.toggle('show')">
                                ${ICONS.moreVertical}
                            </button>
                            <div class="dropdown-menu">
                                ${estatus === 'activo' ? `
                                    <a class="dropdown-item text-warning" onclick="ClienteDetalleView.cambiarEstatus('SUSPENDIDO')">
                                        ${ICONS.alertCircle} Suspender
                                    </a>
                                    <a class="dropdown-item text-danger" onclick="ClienteDetalleView.cambiarEstatus('CANCELADO')">
                                        ${ICONS.x} Cancelar
                                    </a>
                                ` : ''}
                                ${estatus === 'suspendido' ? `
                                    <a class="dropdown-item text-success" onclick="ClienteDetalleView.cambiarEstatus('ACTIVO')">
                                        ${ICONS.check} Reactivar
                                    </a>
                                    <a class="dropdown-item text-danger" onclick="ClienteDetalleView.cambiarEstatus('CANCELADO')">
                                        ${ICONS.x} Cancelar
                                    </a>
                                ` : ''}
                                ${estatus === 'cancelado' ? `
                                    <a class="dropdown-item text-success" onclick="ClienteDetalleView.cambiarEstatus('ACTIVO')">
                                        ${ICONS.check} Reactivar
                                    </a>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tarjetas Financieras -->
            <div class="finance-cards">
                <div class="finance-card">
                    <div class="finance-card-header">
                        <span class="finance-card-label">Tarifa Mensual</span>
                        <div class="finance-card-icon blue">
                            ${ICONS.dollarSign}
                        </div>
                    </div>
                    <p class="finance-card-value">$${parseFloat(cliente.tarifa_monto || 0).toFixed(2)} <span class="finance-card-currency">MXN</span></p>
                    <div class="finance-card-footer">
                        <span class="finance-card-dot blue"></span>
                        <span>${cliente.tarifa_nombre || 'Sin plan asignado'}</span>
                    </div>
                </div>

                <div class="finance-card ${saldo <= 0 ? 'success' : ''}">
                    <div class="finance-card-header">
                        <span class="finance-card-label">Saldo Actual</span>
                        <div class="finance-card-icon ${saldo > 0 ? 'red' : 'green'}">
                            ${ICONS.creditCard}
                        </div>
                    </div>
                    <p class="finance-card-value ${saldo > 0 ? 'text-danger' : 'text-success'}">$${saldo.toFixed(2)}</p>
                    <div class="finance-card-footer">
                        <span class="finance-card-dot ${saldo > 0 ? 'red' : 'green'}"></span>
                        <span>${saldo > 0 ? 'Saldo pendiente' : 'Cuenta al corriente'}</span>
                    </div>
                </div>

                <div class="finance-card">
                    <div class="finance-card-header">
                        <span class="finance-card-label">Próximo Vencimiento</span>
                        <div class="finance-card-icon yellow">
                            ${ICONS.calendar}
                        </div>
                    </div>
                    <p class="finance-card-value">${cliente.proximo_vencimiento || 'N/A'}</p>
                    <div class="finance-card-footer">
                        <span class="finance-card-dot yellow"></span>
                        <span>${cliente.dias_vencimiento !== null ? cliente.dias_vencimiento + ' días restantes' : 'Sin cargos pendientes'}</span>
                    </div>
                </div>
            </div>

            <!-- Tabs -->
            <div class="tabs-container">
                <div class="tabs-header">
                    <button class="tab-btn active" data-tab="servicios">Servicios</button>
                    <button class="tab-btn" data-tab="pagos">Estado de Cuenta</button>
                    <button class="tab-btn" data-tab="documentos">Documentos INE</button>
                    <button class="tab-btn" data-tab="notas">Notas</button>
                </div>

                <div class="tabs-content">
                    <!-- Tab Servicios -->
                    <div class="tab-panel active" id="tab-servicios">
                        <div class="card">
                            <div class="card-header">
                                <h3>${ICONS.wifi} Servicios Contratados</h3>
                                <button class="btn btn-sm btn-primary" onclick="ClienteDetalleView.nuevoServicio()">
                                    ${ICONS.plus} Agregar
                                </button>
                            </div>
                            <div class="table-wrapper">
                                <table class="table">
                                    <thead>
                                        <tr>
                                            <th>Plan</th>
                                            <th>Tarifa</th>
                                            <th>Fecha Alta</th>
                                            <th class="text-center">Estatus</th>
                                            <th class="text-right">Saldo</th>
                                            <th class="text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody id="tabla-servicios">
                                        <tr>
                                            <td colspan="6" class="table-empty">
                                                <div class="empty-state">
                                                    <p>Cargando servicios...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <!-- Tab Estado de Cuenta -->
                    <div class="tab-panel" id="tab-pagos">
                        <div class="card">
                            <div class="card-header">
                                <h3>${ICONS.fileText} Estado de Cuenta</h3>
                            </div>
                            <div class="table-wrapper" id="lista-pagos">
                                <p class="text-muted text-center py-4">Cargando movimientos...</p>
                            </div>
                        </div>
                    </div>

                    <!-- Tab Documentos INE -->
                    <div class="tab-panel" id="tab-documentos">
                        <div class="card">
                            <div class="card-header">
                                <h3>${ICONS.fileText} Identificación Oficial (INE)</h3>
                            </div>
                            <div class="card-body">
                                <div class="ine-grid">
                                    <!-- Frente -->
                                    <div class="ine-card" id="ine-frente">
                                        <p class="ine-label">Frente - ${cliente.ine_frente ? 'Verificado' : 'Pendiente'}</p>
                                        <div class="ine-upload ${cliente.ine_frente ? 'has-file' : ''}" 
                                             onclick="ClienteDetalleView.subirINE('FRENTE')">
                                            ${cliente.ine_frente 
                                                ? `<img src="${cliente.ine_frente}" alt="INE Frente">`
                                                : `${ICONS.upload}<span>Subir Imagen</span><span class="ine-hint">PNG, JPG hasta 10MB</span>`
                                            }
                                            ${cliente.ine_frente ? `<div class="ine-verified">${ICONS.check}</div>` : ''}
                                        </div>
                                        ${cliente.ine_frente_fecha ? `<p class="ine-date">${ICONS.clock} Subido: ${new Date(cliente.ine_frente_fecha).toLocaleDateString('es-MX')}</p>` : ''}
                                    </div>

                                    <!-- Reverso -->
                                    <div class="ine-card" id="ine-reverso">
                                        <p class="ine-label">Reverso - ${cliente.ine_reverso ? 'Verificado' : 'Pendiente'}</p>
                                        <div class="ine-upload ${cliente.ine_reverso ? 'has-file' : ''}"
                                             onclick="ClienteDetalleView.subirINE('REVERSO')">
                                            ${cliente.ine_reverso 
                                                ? `<img src="${cliente.ine_reverso}" alt="INE Reverso">`
                                                : `${ICONS.upload}<span>Subir Imagen</span><span class="ine-hint">PNG, JPG hasta 10MB</span>`
                                            }
                                            ${cliente.ine_reverso ? `<div class="ine-verified">${ICONS.check}</div>` : ''}
                                        </div>
                                        ${cliente.ine_reverso_fecha ? `<p class="ine-date">${ICONS.clock} Subido: ${new Date(cliente.ine_reverso_fecha).toLocaleDateString('es-MX')}</p>` : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Tab Notas -->
                    <div class="tab-panel" id="tab-notas">
                        <div class="card">
                            <div class="card-header">
                                <h3>${ICONS.fileText} Notas del Cliente</h3>
                                <button class="btn btn-sm btn-primary" onclick="ClienteDetalleView.nuevaNota()">
                                    ${ICONS.plus} Nueva Nota
                                </button>
                            </div>
                            <div id="lista-notas" class="notas-list">
                                <p class="text-muted text-center py-4">Cargando notas...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // ============================================
    // INIT
    // ============================================

    async init() {
        const hash = window.location.hash;
        const isNew = hash.includes('nuevo');
        const isEdit = hash.includes('editar');
        
        if (!State.catalogos.estatusCliente || !State.catalogos.estados) {
            await State.preloadCatalogos();
        }
        
        if (isNew) {
            this.initFormulario();
        } else if (isEdit) {
            await this.cargarClienteParaEditar();
        } else {
            await this.cargarCliente();
            this.initTabs();
        }
    },

    initFormulario() {
        const form = $('#form-cliente');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.guardarCliente();
        });

        const estadoSelect = $('#select-estado');
        if (estadoSelect?.value) {
            this.cargarCiudades(estadoSelect.value);
        }
    },

    initTabs() {
        $$('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                $$('.tab-btn').forEach(b => b.classList.remove('active'));
                $$('.tab-panel').forEach(p => p.classList.remove('active'));
                
                btn.classList.add('active');
                $(`#tab-${btn.dataset.tab}`).classList.add('active');
            });
        });
    },

    // ============================================
    // CARGAR CLIENTE
    // ============================================

    async cargarCliente() {
        const id = window.location.hash.split('/').pop();
        
        try {
            const res = await API.get(`/clientes/${id}`);
            
            if (res.success) {
                this.cliente = res.data;
                $('#cliente-loading').style.display = 'none';
                $('#cliente-content').style.display = 'block';
                $('#cliente-content').innerHTML = this.renderClienteContent(res.data);
                
                this.initTabs();
                this.cargarServicios();
                this.cargarEstadoCuenta();
                this.cargarNotas();
            }
        } catch (error) {
            $('#cliente-loading').innerHTML = `
                <div class="empty-state error">
                    ${ICONS.alertCircle}
                    <p>Error al cargar el cliente</p>
                    <a href="#/clientes" class="btn btn-outline mt-4">Volver a Clientes</a>
                </div>
            `;
        }
    },

    async cargarClienteParaEditar() {
        const parts = window.location.hash.split('/');
        const id = parts[2];
        
        try {
            const res = await API.get(`/clientes/${id}`);
            
            if (res.success) {
                this.cliente = res.data;
                const container = $('#view-container');
                container.innerHTML = this.renderFormulario(res.data);
                this.initFormulario();
            }
        } catch (error) {
            Components.toast.error('Error al cargar cliente');
            window.location.hash = '#/clientes';
        }
    },

    async cargarCiudades(estadoId) {
        const select = $('#select-ciudad');
        if (!select || !estadoId) {
            if (select) select.innerHTML = '<option value="">Seleccionar...</option>';
            return;
        }

        try {
            const res = await API.get(`/catalogos/ciudades/estado/${estadoId}`);
            if (res.success) {
                const selectedId = select.dataset.selected;
                select.innerHTML = '<option value="">Seleccionar...</option>' +
                    res.data.map(c => `<option value="${c.id}" ${c.id == selectedId ? 'selected' : ''}>${c.nombre}</option>`).join('');
            }
        } catch (error) {
            console.error('Error cargando ciudades:', error);
        }
    },

    // ============================================
    // GUARDAR CLIENTE
    // ============================================

    async guardarCliente() {
        const form = $('#form-cliente');
        const formData = new FormData(form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            data[key] = value || null;
        }

        const id = data.id;
        delete data.id;

        const btn = form.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<div class="spinner-sm"></div> Guardando...';

        try {
            let res;
            if (id) {
                res = await API.put(`/clientes/${id}`, data);
            } else {
                res = await API.post('/clientes', data);
            }
            
            if (res.success) {
                Components.toast.success(id ? 'Cliente actualizado' : 'Cliente creado');
                window.location.hash = `#/cliente/${id || res.data.id}`;
            } else {
                Components.toast.error(res.message || 'Error al guardar');
            }
        } catch (error) {
            Components.toast.error(error.message || 'Error al guardar cliente');
        } finally {
            btn.disabled = false;
            btn.innerHTML = `${ICONS.save}<span>${id ? 'Actualizar Cliente' : 'Guardar Cliente'}</span>`;
        }
    },

    // ============================================
    // CAMBIAR ESTATUS
    // ============================================

    async cambiarEstatus(nuevoEstatus) {
        if (!this.cliente) return;

        const estatusList = State.catalogos.estatusCliente || [];
        const estatusObj = estatusList.find(e => e.nombre.toUpperCase() === nuevoEstatus || e.clave === nuevoEstatus);
        
        if (!estatusObj) {
            Components.toast.error('Estatus no encontrado');
            return;
        }

        const confirmMsg = {
            'SUSPENDIDO': '¿Suspender este cliente?',
            'CANCELADO': '¿Cancelar este cliente? Esta acción puede afectar sus servicios.',
            'ACTIVO': '¿Reactivar este cliente?'
        };

        if (!confirm(confirmMsg[nuevoEstatus] || `¿Cambiar estatus a ${nuevoEstatus}?`)) {
            return;
        }

        try {
            const res = await API.put(`/clientes/${this.cliente.id}`, {
                estatus_id: estatusObj.id
            });

            if (res.success) {
                Components.toast.success(`Cliente ${nuevoEstatus.toLowerCase()}`);
                await this.cargarCliente();
            } else {
                Components.toast.error(res.message || 'Error al cambiar estatus');
            }
        } catch (error) {
            Components.toast.error(error.message);
        }
    },

    editar() {
        if (!this.cliente) return;
        window.location.hash = `#/cliente/${this.cliente.id}/editar`;
    },

    // ============================================
    // CARGAR SERVICIOS
    // ============================================

    async cargarServicios() {
        const tbody = $('#tabla-servicios');
        if (!tbody) return;

        if (this.cliente?.servicios?.length) {
            tbody.innerHTML = this.cliente.servicios.map(s => {
                const saldo = parseFloat(s.saldo || 0);
                const fechaAlta = s.fecha_instalacion ? new Date(s.fecha_instalacion).toLocaleDateString('es-MX') : '-';
                
                return `
                    <tr class="table-row" onclick="ClienteDetalleView.verServicio(${s.id})">
                        <td>
                            <strong>${s.tarifa_nombre || 'Sin plan'}</strong>
                            <div class="text-xs text-muted">${s.codigo || ''}</div>
                        </td>
                        <td>$${parseFloat(s.tarifa_monto || 0).toFixed(2)}</td>
                        <td>${fechaAlta}</td>
                        <td class="text-center">
                            <span class="badge badge-${(s.estatus || 'activo').toLowerCase()}">${s.estatus || 'Activo'}</span>
                        </td>
                        <td class="text-right ${saldo > 0 ? 'text-danger' : 'text-success'}">
                            $${saldo.toFixed(2)}
                        </td>
                        <td class="text-right">
                            <div class="dropdown" onclick="event.stopPropagation()">
                                <button class="btn-icon" onclick="this.nextElementSibling.classList.toggle('show')">
                                    ${ICONS.moreVertical}
                                </button>
                                <div class="dropdown-menu">
                                    <a class="dropdown-item" onclick="ClienteDetalleView.verServicio(${s.id})">
                                        ${ICONS.eye} Ver Detalle
                                    </a>
                                    ${s.estatus === 'ACTIVO' ? `
                                        <a class="dropdown-item text-warning" onclick="ClienteDetalleView.suspenderServicio(${s.id})">
                                            ${ICONS.alertCircle} Suspender
                                        </a>
                                    ` : ''}
                                    ${s.estatus === 'SUSPENDIDO' ? `
                                        <a class="dropdown-item text-success" onclick="ClienteDetalleView.reactivarServicio(${s.id})">
                                            ${ICONS.check} Reactivar
                                        </a>
                                    ` : ''}
                                </div>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="table-empty">
                        <div class="empty-state small">
                            ${ICONS.wifi}
                            <p>Sin servicios registrados</p>
                        </div>
                    </td>
                </tr>
            `;
        }
    },

    // ============================================
    // CARGAR ESTADO DE CUENTA
    // ============================================

    async cargarEstadoCuenta() {
        const container = $('#lista-pagos');
        if (!container || !this.cliente) return;

        const cargos = this.cliente.cargos || [];
        const pagos = this.cliente.pagos || [];

        if (cargos.length === 0 && pagos.length === 0) {
            container.innerHTML = `
                <div class="empty-state small" style="padding: 2rem;">
                    ${ICONS.fileText}
                    <p>Sin movimientos registrados</p>
                </div>
            `;
            return;
        }

        // Combinar cargos y pagos, ordenar por fecha
        const movimientos = [
            ...cargos.map(c => ({
                tipo: 'cargo',
                fecha: c.fecha_vencimiento,
                concepto: c.concepto || c.descripcion || 'Cargo',
                descripcion: c.descripcion,
                monto: parseFloat(c.monto),
                saldo: parseFloat(c.saldo_pendiente),
                estatus: c.estatus,
                servicio: c.servicio_codigo
            })),
            ...pagos.map(p => ({
                tipo: 'pago',
                fecha: p.fecha_pago,
                concepto: `Pago - ${p.metodo_pago || 'Efectivo'}`,
                monto: parseFloat(p.monto_total),
                recibo: p.numero_recibo,
                estatus: p.estatus,
                servicio: p.servicio_codigo
            }))
        ].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        container.innerHTML = `
            <table class="table">
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Concepto</th>
                        <th>Servicio</th>
                        <th class="text-center">Estatus</th>
                        <th class="text-right">Cargo</th>
                        <th class="text-right">Abono</th>
                        <th class="text-right">Saldo</th>
                    </tr>
                </thead>
                <tbody>
                    ${movimientos.map(m => `
                        <tr>
                            <td>${new Date(m.fecha).toLocaleDateString('es-MX')}</td>
                            <td>
                                <div class="d-flex align-center gap-2">
                                    <span class="${m.tipo === 'cargo' ? 'text-danger' : 'text-success'}" style="width:16px;height:16px;">
                                        ${m.tipo === 'cargo' ? ICONS.fileText : ICONS.dollarSign}
                                    </span>
                                    <div>
                                        ${m.concepto}
                                        ${m.descripcion && m.descripcion !== m.concepto ? `<div class="text-xs text-muted">${m.descripcion}</div>` : ''}
                                        ${m.recibo ? `<div class="text-xs text-muted">${m.recibo}</div>` : ''}
                                    </div>
                                </div>
                            </td>
                            <td><span class="text-xs text-muted">${m.servicio || '-'}</span></td>
                            <td class="text-center">
                                <span class="badge badge-${m.estatus === 'PAGADO' || m.estatus === 'APLICADO' ? 'success' : m.estatus === 'PENDIENTE' ? 'warning' : m.estatus === 'PARCIAL' ? 'info' : 'danger'}">
                                    ${m.estatus}
                                </span>
                            </td>
                            <td class="text-right ${m.tipo === 'cargo' ? 'text-danger' : ''}">
                                ${m.tipo === 'cargo' ? '$' + m.monto.toFixed(2) : '-'}
                            </td>
                            <td class="text-right ${m.tipo === 'pago' ? 'text-success' : ''}">
                                ${m.tipo === 'pago' ? '$' + m.monto.toFixed(2) : '-'}
                            </td>
                            <td class="text-right">
                                ${m.tipo === 'cargo' && m.saldo > 0 ? '<span class="text-danger">$' + m.saldo.toFixed(2) + '</span>' : '-'}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    },

    // ============================================
    // CARGAR NOTAS
    // ============================================

    async cargarNotas() {
        const container = $('#lista-notas');
        if (!container || !this.cliente) return;

        try {
            const res = await API.get(`/clientes/${this.cliente.id}/notas`);
            if (res.success && res.data.length) {
                container.innerHTML = res.data.map(nota => `
                    <div class="nota-item" style="padding: 1rem; border-bottom: 1px solid var(--border-color);">
                        <div class="nota-header" style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <span class="nota-autor" style="font-weight: 600;">${nota.creado_por || 'Sistema'}</span>
                            <span class="nota-fecha text-muted" style="font-size: 0.75rem;">${new Date(nota.created_at).toLocaleDateString('es-MX')}</span>
                        </div>
                        <p class="nota-texto" style="margin: 0; color: var(--text-secondary);">${nota.nota}</p>
                    </div>
                `).join('');
            } else {
                container.innerHTML = `
                    <div class="empty-state small" style="padding: 2rem;">
                        ${ICONS.fileText}
                        <p>No hay notas registradas</p>
                    </div>
                `;
            }
        } catch (error) {
            container.innerHTML = '<p class="text-muted text-center" style="padding: 2rem;">Error al cargar notas</p>';
        }
    },

    // ============================================
    // ACCIONES SERVICIO
    // ============================================

    verServicio(servicioId) {
        window.location.hash = `#/servicio/${servicioId}`;
    },

    async suspenderServicio(servicioId) {
        if (!confirm('¿Suspender este servicio?')) return;
        
        try {
            const res = await API.post(`/servicios/${servicioId}/suspender`, {});
            if (res.success) {
                Components.toast.success('Servicio suspendido');
                await this.cargarCliente();
            } else {
                Components.toast.error(res.message);
            }
        } catch (error) {
            Components.toast.error(error.message);
        }
    },

    async reactivarServicio(servicioId) {
        if (!confirm('¿Reactivar este servicio?')) return;
        
        try {
            const res = await API.post(`/servicios/${servicioId}/reactivar`, {});
            if (res.success) {
                Components.toast.success('Servicio reactivado');
                await this.cargarCliente();
            } else {
                Components.toast.error(res.message);
            }
        } catch (error) {
            Components.toast.error(error.message);
        }
    },

    // ============================================
    // PAGO
    // ============================================

    registrarPago() {
        Components.toast.info('Función de pago en desarrollo');
    },

    // ============================================
    // NUEVO SERVICIO
    // ============================================

    async nuevoServicio() {
        if (!this.cliente) return;

        await Promise.all([
            State.getCatalogo('tarifas'),
            State.getCatalogo('tipoEquipo'),
            State.getCatalogo('marcasEquipo')
        ]);

        const tarifas = State.catalogos.tarifas || [];
        const tiposEquipo = State.catalogos.tipoEquipo || [];

        const modalHTML = `
            <div class="modal-backdrop" id="modal-servicio">
                <div class="modal modal-lg">
                    <div class="modal-header">
                        <h2>Nuevo Servicio</h2>
                        <button class="btn-icon" onclick="ClienteDetalleView.cerrarModalServicio()">
                            ${ICONS.x}
                        </button>
                    </div>
                    <form id="form-servicio" onsubmit="ClienteDetalleView.guardarServicio(event)">
                        <div class="modal-body">
                            <!-- Datos del Servicio -->
                            <div class="form-section">
                                <h3 class="form-section-title">Datos del Servicio</h3>
                                <div class="form-grid cols-2">
                                    <div class="form-group">
                                        <label class="form-label required">Tarifa / Plan</label>
                                        <select name="tarifa_id" class="form-input" required onchange="ClienteDetalleView.calcularProrrateo()">
                                            <option value="">Seleccionar tarifa...</option>
                                            ${tarifas.map(t => `
                                                <option value="${t.id}" data-monto="${t.monto}">
                                                    ${t.nombre} - $${t.monto}/mes (${t.velocidad_mbps || '?'} Mbps)
                                                </option>
                                            `).join('')}
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label required">Fecha de Instalación</label>
                                        <input type="date" name="fecha_instalacion" class="form-input" 
                                               value="${new Date().toISOString().split('T')[0]}" 
                                               required onchange="ClienteDetalleView.calcularProrrateo()">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Día de Corte</label>
                                        <select name="dia_corte" class="form-input" onchange="ClienteDetalleView.calcularProrrateo()">
                                            ${[1,5,10,15,20,25].map(d => `
                                                <option value="${d}" ${d === 10 ? 'selected' : ''}>Día ${d} de cada mes</option>
                                            `).join('')}
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Costo de Instalación</label>
                                        <input type="number" name="costo_instalacion" class="form-input" 
                                               value="0" min="0" step="0.01" onchange="ClienteDetalleView.calcularProrrateo()">
                                    </div>
                                </div>
                            </div>

                            <!-- Resumen de Cargos -->
                            <div class="form-section">
                                <h3 class="form-section-title">Resumen de Cargos Iniciales</h3>
                                <div class="cargos-preview" id="cargos-preview">
                                    <p class="text-muted">Seleccione una tarifa para ver el desglose</p>
                                </div>
                            </div>

                            <!-- Equipo (Opcional) -->
                            <div class="form-section">
                                <h3 class="form-section-title">Equipo a Instalar (Opcional)</h3>
                                <div class="form-grid cols-2">
                                    <div class="form-group">
                                        <label class="form-label">Tipo de Equipo</label>
                                        <select name="tipo_equipo_id" class="form-input" id="select-tipo-equipo">
                                            <option value="">Sin equipo</option>
                                            ${tiposEquipo.map(t => `<option value="${t.id}">${t.nombre}</option>`).join('')}
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">MAC Address</label>
                                        <input type="text" name="mac" class="form-input" placeholder="AA:BB:CC:DD:EE:FF">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">IP</label>
                                        <input type="text" name="ip" class="form-input" placeholder="192.168.1.100">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Serie</label>
                                        <input type="text" name="serie" class="form-input" placeholder="Número de serie">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">SSID (WiFi)</label>
                                        <input type="text" name="ssid" class="form-input" placeholder="Nombre de la red">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Password WiFi</label>
                                        <input type="text" name="password_equipo" class="form-input" placeholder="Contraseña">
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline" onclick="ClienteDetalleView.cerrarModalServicio()">
                                Cancelar
                            </button>
                            <button type="submit" class="btn btn-primary">
                                ${ICONS.save} Crear Servicio
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.calcularProrrateo();
    },

    calcularProrrateo() {
        const form = $('#form-servicio');
        if (!form) return;

        const tarifaSelect = form.querySelector('[name="tarifa_id"]');
        const fechaInput = form.querySelector('[name="fecha_instalacion"]');
        const diaCorteSelect = form.querySelector('[name="dia_corte"]');
        const instalacionInput = form.querySelector('[name="costo_instalacion"]');
        const preview = $('#cargos-preview');

        const tarifaOption = tarifaSelect.selectedOptions[0];
        const tarifaMonto = parseFloat(tarifaOption?.dataset?.monto) || 0;
        const fechaInstalacion = fechaInput.value;
        const diaCorte = parseInt(diaCorteSelect.value) || 10;
        const costoInstalacion = parseFloat(instalacionInput.value) || 0;

        if (!tarifaMonto || !fechaInstalacion) {
            preview.innerHTML = '<p class="text-muted">Seleccione una tarifa para ver el desglose</p>';
            return;
        }

        const fecha = new Date(fechaInstalacion + 'T12:00:00');
        const dia = fecha.getDate();
        let diasProrrateo = 0;
        let prorrateo = 0;

        if (dia !== diaCorte) {
            if (dia < diaCorte) {
                diasProrrateo = diaCorte - dia;
            } else {
                const ultimoDiaMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0).getDate();
                diasProrrateo = (ultimoDiaMes - dia) + diaCorte;
            }
            const tarifaDiaria = tarifaMonto / 30;
            prorrateo = Math.round(tarifaDiaria * diasProrrateo * 100) / 100;
        }

        let fechaVencimiento;
        if (dia <= diaCorte) {
            fechaVencimiento = new Date(fecha.getFullYear(), fecha.getMonth(), diaCorte);
        } else {
            fechaVencimiento = new Date(fecha.getFullYear(), fecha.getMonth() + 1, diaCorte);
        }

        let total = costoInstalacion;
        if (prorrateo > 0) {
            total += prorrateo;
        } else {
            total += tarifaMonto;
        }

        preview.innerHTML = `
            <table class="table table-sm">
                <thead>
                    <tr>
                        <th>Concepto</th>
                        <th class="text-right">Monto</th>
                        <th>Vencimiento</th>
                    </tr>
                </thead>
                <tbody>
                    ${costoInstalacion > 0 ? `
                    <tr>
                        <td>Instalación</td>
                        <td class="text-right">$${costoInstalacion.toFixed(2)}</td>
                        <td>${fecha.toLocaleDateString('es-MX')}</td>
                    </tr>
                    ` : ''}
                    ${prorrateo > 0 ? `
                    <tr>
                        <td>Prorrateo (${diasProrrateo} días)</td>
                        <td class="text-right">$${prorrateo.toFixed(2)}</td>
                        <td>${fechaVencimiento.toLocaleDateString('es-MX')}</td>
                    </tr>
                    ` : `
                    <tr>
                        <td>Primera Mensualidad</td>
                        <td class="text-right">$${tarifaMonto.toFixed(2)}</td>
                        <td>${fechaVencimiento.toLocaleDateString('es-MX')}</td>
                    </tr>
                    `}
                </tbody>
                <tfoot>
                    <tr class="font-bold">
                        <td>Total a Pagar</td>
                        <td class="text-right text-primary">$${total.toFixed(2)}</td>
                        <td></td>
                    </tr>
                </tfoot>
            </table>
            <p class="text-sm text-muted mt-2">
                * Día de corte: ${diaCorte} de cada mes. 
                Siguiente mensualidad: $${tarifaMonto.toFixed(2)}
            </p>
        `;
    },

    async guardarServicio(e) {
        e.preventDefault();
        const form = $('#form-servicio');
        const formData = new FormData(form);
        
        const data = {
            cliente_id: this.cliente.id,
            tarifa_id: formData.get('tarifa_id'),
            fecha_instalacion: formData.get('fecha_instalacion'),
            dia_corte: parseInt(formData.get('dia_corte')),
            costo_instalacion: parseFloat(formData.get('costo_instalacion')) || 0
        };

        const tipoEquipo = formData.get('tipo_equipo_id');
        if (tipoEquipo) {
            data.equipos = [{
                tipo_equipo_id: tipoEquipo,
                mac: formData.get('mac') || null,
                ip: formData.get('ip') || null,
                serie: formData.get('serie') || null,
                ssid: formData.get('ssid') || null,
                password_equipo: formData.get('password_equipo') || null
            }];
        }

        const btn = form.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<div class="spinner-sm"></div> Creando...';

        try {
            const res = await API.post('/servicios', data);
            
            if (res.success) {
                Components.toast.success(`Servicio ${res.data.codigo} creado`);
                this.cerrarModalServicio();
                await this.cargarCliente();
            } else {
                Components.toast.error(res.message || 'Error al crear servicio');
            }
        } catch (error) {
            Components.toast.error(error.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = `${ICONS.save} Crear Servicio`;
        }
    },

    cerrarModalServicio() {
        const modal = $('#modal-servicio');
        if (modal) modal.remove();
    },

    // ============================================
    // NOTAS
    // ============================================

    async nuevaNota() {
        if (!this.cliente) return;

        const nota = prompt('Escribe la nota:');
        if (!nota?.trim()) return;

        try {
            const res = await API.post(`/clientes/${this.cliente.id}/notas`, { nota: nota.trim() });
            if (res.success) {
                Components.toast.success('Nota agregada');
                this.cargarNotas();
            }
        } catch (error) {
            Components.toast.error(error.message);
        }
    },

    // ============================================
    // INE
    // ============================================

    subirINE(tipo) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('archivo', file);
            formData.append('tipo', tipo);

            try {
                Components.toast.info('Subiendo imagen...');
                const res = await API.upload(`/clientes/${this.cliente.id}/ine`, formData);
                if (res.success) {
                    Components.toast.success('INE subida correctamente');
                    await this.cargarCliente();
                } else {
                    Components.toast.error(res.message);
                }
            } catch (error) {
                Components.toast.error(error.message);
            }
        };
        input.click();
    },

    descargarINE() {
        if (this.cliente?.ine_frente) {
            window.open(this.cliente.ine_frente, '_blank');
        }
        if (this.cliente?.ine_reverso) {
            window.open(this.cliente.ine_reverso, '_blank');
        }
        if (!this.cliente?.ine_frente && !this.cliente?.ine_reverso) {
            Components.toast.info('No hay documentos INE registrados');
        }
    }
};

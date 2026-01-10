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
        const estatusCliente = State.catalogos.estatus_cliente || [];
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
                                    <select name="estatus_cliente_id" class="form-input">
                                        ${estatusCliente.map(e => `
                                            <option value="${e.id}" ${cliente?.estatus_cliente_id == e.id ? 'selected' : ''}>${e.nombre}</option>
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
                    <p class="finance-card-value">$${cliente.tarifa_monto || '0.00'} <span class="finance-card-currency">MXN</span></p>
                    <div class="finance-card-footer">
                        <span class="finance-card-dot blue"></span>
                        <span>${cliente.tarifa_nombre || 'Sin plan asignado'}</span>
                    </div>
                </div>

                <div class="finance-card success">
                    <div class="finance-card-header">
                        <span class="finance-card-label">Saldo Actual</span>
                        <div class="finance-card-icon green">
                            ${ICONS.creditCard}
                        </div>
                    </div>
                    <p class="finance-card-value ${(cliente.saldo || 0) > 0 ? 'text-danger' : 'text-success'}">$${cliente.saldo || '0.00'}</p>
                    <div class="finance-card-footer">
                        <span class="finance-card-dot ${(cliente.saldo || 0) > 0 ? 'red' : 'green'}"></span>
                        <span>${(cliente.saldo || 0) > 0 ? 'Saldo pendiente' : 'Cuenta al corriente'}</span>
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
                        <span>${cliente.dias_vencimiento || 0} días restantes</span>
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
                                            <th class="text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody id="tabla-servicios">
                                        <tr>
                                            <td colspan="5" class="table-empty">
                                                <div class="empty-state">
                                                    <p>Sin servicios registrados</p>
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <!-- Tab Pagos -->
                    <div class="tab-panel" id="tab-pagos">
                        <div class="card">
                            <div class="card-header">
                                <h3>${ICONS.fileText} Historial de Movimientos</h3>
                                <button class="btn btn-sm btn-outline">Ver Todo</button>
                            </div>
                            <div id="lista-pagos" class="movimientos-list">
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
                                        ${cliente.ine_frente_fecha ? `<p class="ine-date">${ICONS.clock} Subido: ${cliente.ine_frente_fecha}</p>` : ''}
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
                                        ${cliente.ine_reverso_fecha ? `<p class="ine-date">${ICONS.clock} Subido: ${cliente.ine_reverso_fecha}</p>` : ''}
                                    </div>
                                </div>
                                <button class="btn btn-outline btn-block mt-4" onclick="ClienteDetalleView.descargarINE()">
                                    ${ICONS.download}
                                    <span>Descargar Archivos</span>
                                </button>
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

    async init() {
        const hash = window.location.hash;
        const isNew = hash.includes('nuevo');
        const isEdit = hash.includes('editar');
        
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

        // Cargar ciudades si hay estado seleccionado
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
        const id = parts[parts.indexOf('editar') - 1] || parts[2];
        
        try {
            const res = await API.get(`/clientes/${id}`);
            
            if (res.success) {
                this.cliente = res.data;
                // Re-renderizar con formulario de edición
                const container = $('.page-content')?.parentElement || $('#app');
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
                // Actualizar
                res = await API.put(`/clientes/${id}`, data);
            } else {
                // Crear nuevo
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

    async cambiarEstatus(nuevoEstatus) {
        if (!this.cliente) return;

        const estatusList = State.catalogos.estatus_cliente || [];
        const estatusObj = estatusList.find(e => e.nombre.toUpperCase() === nuevoEstatus);
        
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
                estatus_cliente_id: estatusObj.id
            });

            if (res.success) {
                Components.toast.success(`Cliente ${nuevoEstatus.toLowerCase()}`);
                await this.cargarCliente(); // Recargar
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

    async cargarServicios() {
        const tbody = $('#tabla-servicios');
        if (this.cliente?.servicios?.length) {
            tbody.innerHTML = this.cliente.servicios.map(s => `
                <tr>
                    <td><strong>${s.tarifa_nombre || 'Sin plan'}</strong></td>
                    <td>$${s.tarifa_monto || '0.00'}</td>
                    <td>${s.fecha_alta || '-'}</td>
                    <td class="text-center">
                        <span class="badge badge-${(s.estatus || 'activo').toLowerCase()}">${s.estatus || 'Activo'}</span>
                    </td>
                    <td class="text-right">
                        <button class="btn-icon">${ICONS.moreVertical}</button>
                    </td>
                </tr>
            `).join('');
        }
    },

    async cargarNotas() {
        const container = $('#lista-notas');
        if (!container || !this.cliente) return;

        try {
            const res = await API.get(`/clientes/${this.cliente.id}/notas`);
            if (res.success && res.data.length) {
                container.innerHTML = res.data.map(nota => `
                    <div class="nota-item">
                        <div class="nota-header">
                            <span class="nota-autor">${nota.usuario || 'Sistema'}</span>
                            <span class="nota-fecha">${new Date(nota.created_at).toLocaleDateString('es-MX')}</span>
                        </div>
                        <p class="nota-texto">${nota.nota}</p>
                    </div>
                `).join('');
            } else {
                container.innerHTML = `
                    <div class="empty-state small">
                        ${ICONS.fileText}
                        <p>No hay notas registradas</p>
                    </div>
                `;
            }
        } catch (error) {
            container.innerHTML = '<p class="text-muted text-center">Error al cargar notas</p>';
        }
    },

    registrarPago() {
        Components.toast.info('Función de pago en desarrollo');
    },

    nuevoServicio() {
        Components.toast.info('Función en desarrollo');
    },

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

    subirINE(tipo) {
        Components.toast.info(`Subir INE ${tipo} - En desarrollo`);
    },

    descargarINE() {
        Components.toast.info('Descarga en desarrollo');
    }
};

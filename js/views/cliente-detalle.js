// ============================================
// SKYNET ISP - Cliente Detalle View
// ============================================

const ClienteDetalleView = {
    state: {
        cliente: null,
        servicio: null,
        cargos: [],
        pagos: [],
        notas: [],
        historial: [],
        ines: []
    },
    
    render() {
        return `
            <div id="cliente-detalle-container">
                <div class="text-center p-6">
                    <div class="loader-inline animate-spin"></div>
                    <p class="mt-4 text-muted">Cargando información del cliente...</p>
                </div>
            </div>
        `;
    },
    
    async init(clienteId) {
        await this.loadCliente(clienteId);
    },
    
    async loadCliente(clienteId) {
        const container = $('#cliente-detalle-container');
        
        try {
            Components.loader.show();
            
            const response = await API.clientes.getById(clienteId);
            
            if (!response.success) {
                throw new Error('Cliente no encontrado');
            }
            
            this.state.cliente = response.data;
            this.state.servicio = response.data.servicios?.[0] || null;
            
            // Load additional data
            await Promise.all([
                this.loadINEs(clienteId),
                this.loadNotas(clienteId),
                this.state.servicio ? this.loadCargos(this.state.servicio.id) : null,
                this.state.servicio ? this.loadPagos(this.state.servicio.id) : null
            ]);
            
            container.innerHTML = this.renderContent();
            this.initTabs();
            
        } catch (error) {
            container.innerHTML = `
                <div class="card p-6 text-center">
                    <div class="text-danger mb-4">${ICONS.alertCircle}</div>
                    <h3>Error al cargar cliente</h3>
                    <p class="text-muted">${error.message}</p>
                    <button class="btn btn-primary mt-4" onclick="window.location.hash = '#/clientes'">
                        ${ICONS.arrowLeft} Volver a Clientes
                    </button>
                </div>
            `;
        } finally {
            Components.loader.hide();
        }
    },
    
    async loadINEs(clienteId) {
        try {
            const response = await API.clientes.getINE(clienteId);
            if (response.success) {
                this.state.ines = response.data;
            }
        } catch (e) { console.error(e); }
    },
    
    async loadNotas(clienteId) {
        try {
            const response = await API.clientes.getNotas(clienteId);
            if (response.success) {
                this.state.notas = response.data;
            }
        } catch (e) { console.error(e); }
    },
    
    async loadCargos(servicioId) {
        try {
            const response = await API.cargos.getByServicio(servicioId);
            if (response.success) {
                this.state.cargos = response.data.cargos || [];
                this.state.resumenCargos = response.data.resumen || {};
            }
        } catch (e) { console.error(e); }
    },
    
    async loadPagos(servicioId) {
        try {
            const response = await API.pagos.getByServicio(servicioId);
            if (response.success) {
                this.state.pagos = response.data;
            }
        } catch (e) { console.error(e); }
    },
    
    renderContent() {
        const cliente = this.state.cliente;
        const servicio = this.state.servicio;
        
        const nombreCompleto = `${cliente.nombre} ${cliente.apellido_paterno || ''} ${cliente.apellido_materno || ''}`.trim();
        const direccion = [cliente.calle, cliente.numero_exterior, cliente.colonia, cliente.ciudad].filter(Boolean).join(', ');
        
        // Calculate saldo
        const totalAdeudo = this.state.resumenCargos?.total_pendiente || 0;
        const saldoFavor = servicio?.saldo_favor || 0;
        const saldoContra = servicio?.saldo_contra || 0;
        
        let saldoDisplay, saldoClass, saldoLabel;
        if (totalAdeudo > 0) {
            saldoDisplay = Utils.formatCurrency(totalAdeudo);
            saldoClass = 'text-danger';
            saldoLabel = 'ADEUDO';
        } else if (saldoFavor > 0) {
            saldoDisplay = Utils.formatCurrency(saldoFavor);
            saldoClass = 'text-success';
            saldoLabel = 'A FAVOR';
        } else {
            saldoDisplay = Utils.formatCurrency(0);
            saldoClass = 'text-success';
            saldoLabel = 'AL CORRIENTE';
        }
        
        return `
            <!-- Back button -->
            <div class="mb-4">
                <a href="#/clientes" class="btn btn-ghost btn-sm">
                    ${ICONS.arrowLeft}
                    Volver a Clientes
                </a>
            </div>
            
            <!-- Header Card -->
            <div class="card mb-6">
                <div class="card-body">
                    <div class="d-flex align-center justify-between flex-wrap gap-4">
                        <div class="d-flex align-center gap-4">
                            <div class="avatar avatar-xl">
                                ${Utils.getInitials(cliente.nombre, cliente.apellido_paterno)}
                            </div>
                            <div>
                                <div class="d-flex align-center gap-3 mb-2">
                                    <h2 class="m-0">${nombreCompleto}</h2>
                                    <span class="text-muted">-</span>
                                    <span class="font-mono font-semibold">${cliente.codigo}</span>
                                    ${Components.statusBadge(cliente.estatus || 'ACTIVO')}
                                </div>
                                <div class="d-flex flex-wrap gap-4 text-sm text-secondary">
                                    ${cliente.telefono1 ? `
                                        <span class="d-flex align-center gap-2">
                                            ${ICONS.phone}
                                            ${Utils.formatPhone(cliente.telefono1)}
                                        </span>
                                    ` : ''}
                                    ${direccion ? `
                                        <span class="d-flex align-center gap-2">
                                            ${ICONS.mapPin}
                                            ${direccion}
                                        </span>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                        <div class="d-flex gap-3">
                            ${servicio ? `
                                <button class="btn btn-success" onclick="ClienteDetalleView.openPagoModal()">
                                    ${ICONS.creditCard}
                                    Registrar Pago
                                </button>
                            ` : `
                                <button class="btn btn-primary" onclick="ClienteDetalleView.openServicioModal()">
                                    ${ICONS.plus}
                                    Crear Servicio
                                </button>
                            `}
                            <button class="btn btn-secondary" onclick="ClienteDetalleView.openEditModal()">
                                ${ICONS.edit}
                                Editar
                            </button>
                            <div class="dropdown">
                                <button class="btn btn-secondary btn-icon" onclick="Components.dropdown.toggle(this)">
                                    ${ICONS.moreVertical}
                                </button>
                                <div class="dropdown-menu">
                                    ${servicio ? `
                                        <div class="dropdown-item" onclick="ClienteDetalleView.openCargoModal()">
                                            ${ICONS.plus}
                                            Agregar Cargo
                                        </div>
                                        <div class="dropdown-item" onclick="ClienteDetalleView.openCambiarTarifaModal()">
                                            ${ICONS.refresh}
                                            Cambiar Tarifa
                                        </div>
                                        <div class="dropdown-divider"></div>
                                        ${servicio.estatus === 'ACTIVO' ? `
                                            <div class="dropdown-item" onclick="ClienteDetalleView.suspenderServicio()">
                                                ${ICONS.pause}
                                                Suspender Servicio
                                            </div>
                                        ` : servicio.estatus === 'SUSPENDIDO' ? `
                                            <div class="dropdown-item" onclick="ClienteDetalleView.reactivarServicio()">
                                                ${ICONS.play}
                                                Reactivar Servicio
                                            </div>
                                        ` : ''}
                                    ` : ''}
                                    <div class="dropdown-divider"></div>
                                    <div class="dropdown-item danger" onclick="ClienteDetalleView.cancelarCliente()">
                                        ${ICONS.xCircle}
                                        Cancelar Cliente
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Stat Cards -->
            ${servicio ? `
                <div class="stat-cards">
                    <div class="stat-card">
                        <div class="stat-info">
                            <h3>Tarifa Mensual</h3>
                            <div class="stat-value">${Utils.formatCurrency(servicio.tarifa_monto)}</div>
                            <div class="stat-label">${servicio.tarifa || 'Sin plan'}</div>
                        </div>
                        <div class="stat-icon primary">${ICONS.dollarSign}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-info">
                            <h3>Saldo Actual</h3>
                            <div class="stat-value ${saldoClass}">${saldoDisplay}</div>
                            <div class="stat-label ${saldoClass}">${saldoLabel}</div>
                        </div>
                        <div class="stat-icon ${totalAdeudo > 0 ? 'danger' : 'success'}">${ICONS.creditCard}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-info">
                            <h3>Próximo Vencimiento</h3>
                            <div class="stat-value">${Utils.formatDate(this.getNextDueDate())}</div>
                            <div class="stat-label">${Utils.formatRelativeDate(this.getNextDueDate())}</div>
                        </div>
                        <div class="stat-icon info">${ICONS.calendar}</div>
                    </div>
                </div>
            ` : ''}
            
            <!-- Main Content -->
            <div class="d-flex gap-6" style="align-items: flex-start;">
                <!-- Left Column - Main Content -->
                <div class="flex-1">
                    ${this.renderTabs()}
                </div>
                
                <!-- Right Column - INE -->
                <div style="width: 280px; flex-shrink: 0;">
                    ${this.renderINECard()}
                </div>
            </div>
        `;
    },
    
    getNextDueDate() {
        const pendingCargo = this.state.cargos.find(c => c.estatus === 'PENDIENTE' || c.estatus === 'PARCIAL');
        return pendingCargo?.fecha_vencimiento || null;
    },
    
    renderTabs() {
        return `
            <div class="card" id="tabs-container">
                <div class="tabs">
                    <div class="tabs-list">
                        <button class="tab-btn active" data-tab="tab-servicio">
                            ${ICONS.router}
                            Servicio / Equipos
                        </button>
                        <button class="tab-btn" data-tab="tab-cargos">
                            ${ICONS.fileText}
                            Cargos
                        </button>
                        <button class="tab-btn" data-tab="tab-pagos">
                            ${ICONS.creditCard}
                            Pagos
                        </button>
                        <button class="tab-btn" data-tab="tab-notas">
                            ${ICONS.stickyNote}
                            Notas
                        </button>
                        <button class="tab-btn" data-tab="tab-historial">
                            ${ICONS.history}
                            Historial
                        </button>
                    </div>
                </div>
                
                <div class="card-body">
                    <!-- Tab: Servicio / Equipos -->
                    <div class="tab-content active" id="tab-servicio">
                        ${this.renderServicioTab()}
                    </div>
                    
                    <!-- Tab: Cargos -->
                    <div class="tab-content" id="tab-cargos">
                        ${this.renderCargosTab()}
                    </div>
                    
                    <!-- Tab: Pagos -->
                    <div class="tab-content" id="tab-pagos">
                        ${this.renderPagosTab()}
                    </div>
                    
                    <!-- Tab: Notas -->
                    <div class="tab-content" id="tab-notas">
                        ${this.renderNotasTab()}
                    </div>
                    
                    <!-- Tab: Historial -->
                    <div class="tab-content" id="tab-historial">
                        ${this.renderHistorialTab()}
                    </div>
                </div>
            </div>
        `;
    },
    
    renderServicioTab() {
        const servicio = this.state.servicio;
        
        if (!servicio) {
            return Components.emptyState(
                'No hay servicio activo',
                'wifi',
                'Crear Servicio',
                'ClienteDetalleView.openServicioModal()'
            );
        }
        
        return `
            <div class="d-flex justify-between align-center mb-4">
                <div>
                    <h4 class="m-0 d-flex align-center gap-2">
                        Servicio: <span class="font-mono">${servicio.codigo}</span>
                        ${Components.statusBadge(servicio.estatus || 'ACTIVO')}
                    </h4>
                    <p class="text-sm text-muted m-0 mt-1">
                        Instalado: ${Utils.formatDate(servicio.fecha_instalacion)} | 
                        Día de corte: ${servicio.dia_corte || 10}
                    </p>
                </div>
                <button class="btn btn-secondary btn-sm" onclick="ClienteDetalleView.openEquipoModal()">
                    ${ICONS.plus}
                    Agregar Equipo
                </button>
            </div>
            
            <div class="d-grid grid-cols-2 gap-4" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));">
                ${this.renderEquipos()}
            </div>
        `;
    },
    
    renderEquipos() {
        // Simular equipos del servicio - en producción vendría del API
        const equipos = this.state.servicio?.equipos || [];
        
        if (equipos.length === 0) {
            return `
                <div class="equipment-card">
                    <div class="text-center text-muted p-4">
                        <p>No hay equipos registrados</p>
                    </div>
                </div>
            `;
        }
        
        return equipos.map(equipo => `
            <div class="equipment-card">
                <div class="equipment-header">
                    <div class="equipment-title">
                        ${equipo.tipo === 'ANTENA' ? ICONS.radio : ICONS.wifi}
                        ${equipo.tipo || 'Equipo'}
                    </div>
                    <div class="d-flex gap-1">
                        <button class="table-action-btn" onclick="ClienteDetalleView.openEditEquipoModal(${equipo.id})" title="Editar">
                            ${ICONS.edit}
                        </button>
                        <button class="table-action-btn" onclick="ClienteDetalleView.removeEquipo(${equipo.id})" title="Retirar">
                            ${ICONS.trash}
                        </button>
                    </div>
                </div>
                <div class="equipment-grid">
                    <div class="equipment-field">
                        <label>Marca/Modelo</label>
                        <span>${equipo.marca || '-'} ${equipo.modelo || ''}</span>
                    </div>
                    <div class="equipment-field">
                        <label>MAC</label>
                        <span>${equipo.mac || '-'}</span>
                    </div>
                    <div class="equipment-field">
                        <label>IP</label>
                        <span>${equipo.ip || '-'}</span>
                    </div>
                    <div class="equipment-field">
                        <label>Serie</label>
                        <span>${equipo.serie || '-'}</span>
                    </div>
                    ${equipo.ssid ? `
                        <div class="equipment-field">
                            <label>SSID</label>
                            <span>${equipo.ssid}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    },
    
    renderCargosTab() {
        return `
            <div class="d-flex justify-between align-center mb-4">
                <h4 class="m-0">Estado de Cuenta</h4>
                <button class="btn btn-primary btn-sm" onclick="ClienteDetalleView.openCargoModal()">
                    ${ICONS.plus}
                    Nuevo Cargo
                </button>
            </div>
            
            ${this.state.cargos.length === 0 ? 
                Components.emptyState('No hay cargos registrados', 'fileText') :
                `<div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Concepto</th>
                                <th>Periodo</th>
                                <th>Vencimiento</th>
                                <th class="text-right">Monto</th>
                                <th class="text-right">Pendiente</th>
                                <th>Estatus</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.state.cargos.map(cargo => `
                                <tr>
                                    <td>${cargo.concepto || cargo.descripcion || '-'}</td>
                                    <td>${cargo.periodo_mes && cargo.periodo_anio ? `${cargo.periodo_mes}/${cargo.periodo_anio}` : '-'}</td>
                                    <td>
                                        ${Utils.formatDate(cargo.fecha_vencimiento)}
                                        ${new Date(cargo.fecha_vencimiento) < new Date() && cargo.estatus !== 'PAGADO' ? 
                                            '<span class="badge badge-danger ml-2">Vencido</span>' : ''}
                                    </td>
                                    <td class="text-right font-mono">${Utils.formatCurrency(cargo.monto)}</td>
                                    <td class="text-right font-mono ${cargo.saldo_pendiente > 0 ? 'text-danger' : ''}">${Utils.formatCurrency(cargo.saldo_pendiente)}</td>
                                    <td>${Components.statusBadge(cargo.estatus)}</td>
                                    <td>
                                        ${cargo.estatus !== 'PAGADO' && cargo.estatus !== 'CANCELADO' ? `
                                            <button class="table-action-btn" onclick="ClienteDetalleView.cancelarCargo(${cargo.id})" title="Cancelar">
                                                ${ICONS.xCircle}
                                            </button>
                                        ` : ''}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>`
            }
        `;
    },
    
    renderPagosTab() {
        return `
            <div class="d-flex justify-between align-center mb-4">
                <h4 class="m-0">Historial de Pagos</h4>
                <button class="btn btn-success btn-sm" onclick="ClienteDetalleView.openPagoModal()">
                    ${ICONS.creditCard}
                    Registrar Pago
                </button>
            </div>
            
            ${this.state.pagos.length === 0 ? 
                Components.emptyState('No hay pagos registrados', 'creditCard') :
                `<div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th># Recibo</th>
                                <th>Fecha</th>
                                <th>Método</th>
                                <th class="text-right">Monto</th>
                                <th>Estatus</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.state.pagos.map(pago => `
                                <tr>
                                    <td><span class="font-mono">${pago.numero_recibo}</span></td>
                                    <td>${Utils.formatDateTime(pago.fecha_pago)}</td>
                                    <td>${pago.metodo_pago || '-'}</td>
                                    <td class="text-right font-mono text-success">+${Utils.formatCurrency(pago.monto_total)}</td>
                                    <td>${Components.statusBadge(pago.estatus)}</td>
                                    <td>
                                        <div class="table-actions">
                                            <button class="table-action-btn" onclick="ClienteDetalleView.verRecibo(${pago.id})" title="Ver recibo">
                                                ${ICONS.printer}
                                            </button>
                                            ${pago.estatus === 'APLICADO' ? `
                                                <button class="table-action-btn" onclick="ClienteDetalleView.cancelarPago(${pago.id})" title="Cancelar">
                                                    ${ICONS.xCircle}
                                                </button>
                                            ` : ''}
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>`
            }
        `;
    },
    
    renderNotasTab() {
        return `
            <div class="d-flex justify-between align-center mb-4">
                <h4 class="m-0">Notas del Cliente</h4>
                <button class="btn btn-primary btn-sm" onclick="ClienteDetalleView.openNotaModal()">
                    ${ICONS.plus}
                    Nueva Nota
                </button>
            </div>
            
            ${this.state.notas.length === 0 ? 
                Components.emptyState('No hay notas', 'stickyNote') :
                `<div class="timeline">
                    ${this.state.notas.map(nota => `
                        <div class="timeline-item">
                            <div class="timeline-icon">${ICONS.stickyNote}</div>
                            <div class="timeline-content">
                                <div class="timeline-title">${nota.nota}</div>
                                <div class="timeline-date">
                                    ${nota.creado_por || 'Sistema'} - ${Utils.formatDateTime(nota.created_at)}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>`
            }
        `;
    },
    
    renderHistorialTab() {
        return `
            <div class="mb-4">
                <h4 class="m-0">Historial de Cambios</h4>
                <p class="text-sm text-muted">Registro de todas las modificaciones realizadas</p>
            </div>
            
            <div id="historial-content">
                <div class="text-center p-4">
                    <button class="btn btn-secondary" onclick="ClienteDetalleView.loadHistorial()">
                        ${ICONS.refresh}
                        Cargar Historial
                    </button>
                </div>
            </div>
        `;
    },
    
    async loadHistorial() {
        const container = $('#historial-content');
        container.innerHTML = '<div class="text-center p-4"><div class="loader-inline animate-spin"></div></div>';
        
        try {
            const response = await API.clientes.getHistorial(this.state.cliente.id);
            
            if (response.success && response.data.length > 0) {
                container.innerHTML = `
                    <div class="timeline">
                        ${response.data.map(item => `
                            <div class="timeline-item">
                                <div class="timeline-icon">${ICONS.clock}</div>
                                <div class="timeline-content">
                                    <div class="timeline-title">
                                        <strong>${item.campo}</strong>: 
                                        ${item.valor_anterior || '(vacío)'} → ${item.valor_nuevo || '(vacío)'}
                                    </div>
                                    <div class="timeline-desc">${item.accion}</div>
                                    <div class="timeline-date">
                                        ${item.usuario || 'Sistema'} - ${Utils.formatDateTime(item.created_at)}
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            } else {
                container.innerHTML = Components.emptyState('No hay historial de cambios', 'history');
            }
        } catch (error) {
            container.innerHTML = `<div class="text-center text-danger p-4">${error.message}</div>`;
        }
    },
    
    renderINECard() {
        const ineFront = this.state.ines.find(i => i.tipo === 'FRENTE');
        const ineBack = this.state.ines.find(i => i.tipo === 'REVERSO');
        
        return `
            <div class="card">
                <div class="card-header">
                    <h4 class="card-title">
                        ${ICONS.idCard}
                        Identificación (INE)
                    </h4>
                </div>
                <div class="card-body">
                    <div class="ine-container">
                        <!-- Frente -->
                        <div class="ine-card ${ineFront ? 'has-image' : ''}" onclick="ClienteDetalleView.uploadINE('FRENTE')">
                            <div class="ine-label">FRENTE</div>
                            ${ineFront ? `
                                <img src="${CONFIG.API_URL.replace('/api', '')}/${ineFront.archivo_path}" alt="INE Frente">
                                <div class="ine-status uploaded">
                                    ${ICONS.checkCircle}
                                    Subido
                                </div>
                                <div class="ine-date">
                                    ${Utils.formatDate(ineFront.created_at)}
                                </div>
                            ` : `
                                <div class="ine-placeholder">
                                    ${ICONS.upload}
                                    <span>Click para subir</span>
                                </div>
                            `}
                        </div>
                        
                        <!-- Reverso -->
                        <div class="ine-card ${ineBack ? 'has-image' : ''}" onclick="ClienteDetalleView.uploadINE('REVERSO')">
                            <div class="ine-label">REVERSO</div>
                            ${ineBack ? `
                                <img src="${CONFIG.API_URL.replace('/api', '')}/${ineBack.archivo_path}" alt="INE Reverso">
                                <div class="ine-status uploaded">
                                    ${ICONS.checkCircle}
                                    Subido
                                </div>
                                <div class="ine-date">
                                    ${Utils.formatDate(ineBack.created_at)}
                                </div>
                            ` : `
                                <div class="ine-placeholder">
                                    ${ICONS.upload}
                                    <span>Click para subir</span>
                                </div>
                            `}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    initTabs() {
        const container = $('#tabs-container');
        if (container) {
            Components.tabs.init(container);
        }
    },
    
    // ============================================
    // MODAL ACTIONS
    // ============================================
    
    async openEditModal() {
        const cliente = this.state.cliente;
        const estados = await State.getCatalogo('estados');
        const ciudades = await State.getCatalogo('ciudades');
        const zonas = await State.getCatalogo('zonas');
        
        Components.modal.form({
            title: 'Editar Cliente',
            size: 'lg',
            data: cliente,
            fields: [
                { type: 'text', name: 'nombre', label: 'Nombre(s)', required: true },
                { type: 'text', name: 'apellido_paterno', label: 'Apellido Paterno' },
                { type: 'text', name: 'apellido_materno', label: 'Apellido Materno' },
                { type: 'tel', name: 'telefono1', label: 'Teléfono Principal' },
                { type: 'tel', name: 'telefono2', label: 'Teléfono Secundario' },
                { type: 'text', name: 'calle', label: 'Calle' },
                { type: 'text', name: 'numero_exterior', label: 'Número Exterior' },
                { type: 'text', name: 'numero_interior', label: 'Número Interior' },
                { type: 'select', name: 'estado_id', label: 'Estado', options: estados.map(e => ({ value: e.id, label: e.nombre })) },
                { type: 'select', name: 'ciudad_id', label: 'Ciudad', options: ciudades.map(c => ({ value: c.id, label: c.nombre })), addButton: true, addCatalogo: 'ciudades' },
                { type: 'text', name: 'codigo_postal', label: 'Código Postal' },
                { type: 'select', name: 'zona_id', label: 'Zona', options: zonas.map(z => ({ value: z.id, label: z.nombre })), addButton: true, addCatalogo: 'zonas' }
            ],
            submitText: 'Guardar Cambios',
            onSubmit: async (data) => {
                try {
                    Components.loader.show();
                    const response = await API.clientes.update(cliente.id, data);
                    if (response.success) {
                        Components.toast.success('Cliente actualizado');
                        Components.modal.hide();
                        this.loadCliente(cliente.id);
                    }
                } catch (error) {
                    Components.toast.error(error.message);
                } finally {
                    Components.loader.hide();
                }
            }
        });
    },
    
    async openServicioModal() {
        const tarifas = await State.getCatalogo('tarifas');
        
        Components.modal.form({
            title: 'Crear Servicio',
            size: 'lg',
            fields: [
                { 
                    type: 'select', 
                    name: 'tarifa_id', 
                    label: 'Plan / Tarifa', 
                    required: true,
                    options: tarifas.map(t => ({ value: t.id, label: `${t.nombre} - ${Utils.formatCurrency(t.monto)}` })),
                    addButton: true,
                    addCatalogo: 'tarifas'
                },
                { type: 'date', name: 'fecha_instalacion', label: 'Fecha de Instalación', required: true },
                { type: 'number', name: 'dia_corte', label: 'Día de Corte', value: 10, min: 1, max: 28 },
                { type: 'checkbox', name: 'generar_cargo_instalacion', label: 'Generar cargo de instalación', value: true },
                { type: 'number', name: 'monto_instalacion', label: 'Monto Instalación', value: 500, step: 0.01 },
                { type: 'textarea', name: 'notas', label: 'Notas de instalación' }
            ],
            submitText: 'Crear Servicio',
            onSubmit: async (data) => {
                try {
                    Components.loader.show();
                    data.cliente_id = this.state.cliente.id;
                    const response = await API.servicios.create(data);
                    if (response.success) {
                        Components.toast.success('Servicio creado correctamente');
                        Components.modal.hide();
                        this.loadCliente(this.state.cliente.id);
                    }
                } catch (error) {
                    Components.toast.error(error.message);
                } finally {
                    Components.loader.hide();
                }
            }
        });
    },
    
    async openPagoModal() {
        const metodosPago = await State.getCatalogo('metodosPago');
        const bancos = await State.getCatalogo('bancos');
        const cargosPendientes = this.state.cargos.filter(c => c.estatus === 'PENDIENTE' || c.estatus === 'PARCIAL');
        
        const totalPendiente = cargosPendientes.reduce((sum, c) => sum + parseFloat(c.saldo_pendiente || 0), 0);
        
        Components.modal.form({
            title: 'Registrar Pago',
            size: 'lg',
            fields: [
                { 
                    type: 'number', 
                    name: 'monto_total', 
                    label: `Monto a Pagar (Pendiente: ${Utils.formatCurrency(totalPendiente)})`, 
                    required: true,
                    step: 0.01,
                    min: 0.01,
                    value: totalPendiente,
                    hint: 'El monto excedente se guardará como saldo a favor'
                },
                { 
                    type: 'select', 
                    name: 'metodo_pago_id', 
                    label: 'Método de Pago', 
                    required: true,
                    options: metodosPago.map(m => ({ value: m.id, label: m.nombre })),
                    addButton: true,
                    addCatalogo: 'metodos-pago'
                },
                { 
                    type: 'select', 
                    name: 'banco_id', 
                    label: 'Banco (si aplica)',
                    options: bancos.map(b => ({ value: b.id, label: b.nombre })),
                    addButton: true,
                    addCatalogo: 'bancos'
                },
                { type: 'text', name: 'referencia', label: 'Referencia / Folio', placeholder: 'Número de operación, folio, etc.' },
                { type: 'text', name: 'quien_paga', label: '¿Quién realiza el pago?', placeholder: 'Nombre de quien paga' },
                { type: 'textarea', name: 'notas', label: 'Notas adicionales' }
            ],
            submitText: 'Registrar Pago',
            onSubmit: async (data) => {
                try {
                    Components.loader.show();
                    data.servicio_id = this.state.servicio.id;
                    const response = await API.pagos.create(data);
                    if (response.success) {
                        Components.toast.success(`Pago registrado. Recibo: ${response.data.numero_recibo}`);
                        Components.modal.hide();
                        this.loadCliente(this.state.cliente.id);
                    }
                } catch (error) {
                    Components.toast.error(error.message);
                } finally {
                    Components.loader.hide();
                }
            }
        });
    },
    
    async openCargoModal() {
        const conceptos = await State.getCatalogo('conceptosCobro');
        
        Components.modal.form({
            title: 'Agregar Cargo',
            fields: [
                { 
                    type: 'select', 
                    name: 'concepto_id', 
                    label: 'Concepto', 
                    required: true,
                    options: conceptos.map(c => ({ value: c.id, label: c.nombre })),
                    addButton: true,
                    addCatalogo: 'conceptos-cobro'
                },
                { type: 'number', name: 'monto', label: 'Monto', required: true, step: 0.01, min: 0.01 },
                { type: 'date', name: 'fecha_vencimiento', label: 'Fecha de Vencimiento', required: true },
                { type: 'text', name: 'descripcion', label: 'Descripción', placeholder: 'Detalle del cargo' }
            ],
            submitText: 'Agregar Cargo',
            onSubmit: async (data) => {
                try {
                    Components.loader.show();
                    data.servicio_id = this.state.servicio.id;
                    const response = await API.cargos.create(data);
                    if (response.success) {
                        Components.toast.success('Cargo agregado');
                        Components.modal.hide();
                        await this.loadCargos(this.state.servicio.id);
                        Components.tabs.activate($('#tabs-container'), 'tab-cargos');
                        $('#tab-cargos').innerHTML = this.renderCargosTab();
                    }
                } catch (error) {
                    Components.toast.error(error.message);
                } finally {
                    Components.loader.hide();
                }
            }
        });
    },
    
    async openCambiarTarifaModal() {
        const tarifas = await State.getCatalogo('tarifas');
        
        Components.modal.form({
            title: 'Cambiar Tarifa',
            fields: [
                { 
                    type: 'select', 
                    name: 'tarifa_id', 
                    label: 'Nueva Tarifa', 
                    required: true,
                    options: tarifas.map(t => ({ 
                        value: t.id, 
                        label: `${t.nombre} - ${Utils.formatCurrency(t.monto)}` 
                    })),
                    addButton: true,
                    addCatalogo: 'tarifas'
                }
            ],
            submitText: 'Cambiar Tarifa',
            onSubmit: async (data) => {
                try {
                    Components.loader.show();
                    const response = await API.servicios.cambiarTarifa(this.state.servicio.id, data.tarifa_id);
                    if (response.success) {
                        Components.toast.success('Tarifa actualizada');
                        Components.modal.hide();
                        this.loadCliente(this.state.cliente.id);
                    }
                } catch (error) {
                    Components.toast.error(error.message);
                } finally {
                    Components.loader.hide();
                }
            }
        });
    },
    
    async openEquipoModal() {
        const tiposEquipo = await State.getCatalogo('tipoEquipo');
        const marcas = await State.getCatalogo('marcasEquipo');
        
        Components.modal.form({
            title: 'Agregar Equipo',
            size: 'lg',
            fields: [
                { 
                    type: 'select', 
                    name: 'tipo_equipo_id', 
                    label: 'Tipo de Equipo', 
                    required: true,
                    options: tiposEquipo.map(t => ({ value: t.id, label: t.nombre })),
                    addButton: true,
                    addCatalogo: 'tipo-equipo'
                },
                { 
                    type: 'select', 
                    name: 'marca_id', 
                    label: 'Marca',
                    options: marcas.map(m => ({ value: m.id, label: m.nombre })),
                    addButton: true,
                    addCatalogo: 'marcas-equipo'
                },
                { type: 'text', name: 'modelo', label: 'Modelo', placeholder: 'Modelo del equipo' },
                { type: 'text', name: 'mac', label: 'Dirección MAC', placeholder: 'AA:BB:CC:DD:EE:FF' },
                { type: 'text', name: 'ip', label: 'Dirección IP', placeholder: '192.168.1.1' },
                { type: 'text', name: 'serie', label: 'Número de Serie', placeholder: 'SN-XXXXXXXXX' },
                { type: 'text', name: 'ssid', label: 'SSID (WiFi)', placeholder: 'Nombre de la red' },
                { type: 'text', name: 'password_wifi', label: 'Contraseña WiFi', placeholder: 'Contraseña de la red' }
            ],
            submitText: 'Agregar Equipo',
            onSubmit: async (data) => {
                try {
                    Components.loader.show();
                    const response = await API.servicios.addEquipo(this.state.servicio.id, data);
                    if (response.success) {
                        Components.toast.success('Equipo agregado');
                        Components.modal.hide();
                        this.loadCliente(this.state.cliente.id);
                    }
                } catch (error) {
                    Components.toast.error(error.message);
                } finally {
                    Components.loader.hide();
                }
            }
        });
    },
    
    async openEditEquipoModal(equipoId) {
        const equipo = this.state.servicio.equipos?.find(e => e.id === equipoId);
        if (!equipo) return;
        
        const tiposEquipo = await State.getCatalogo('tipoEquipo');
        const marcas = await State.getCatalogo('marcasEquipo');
        
        Components.modal.form({
            title: 'Editar Equipo',
            size: 'lg',
            data: equipo,
            fields: [
                { type: 'select', name: 'tipo_equipo_id', label: 'Tipo de Equipo', required: true, options: tiposEquipo.map(t => ({ value: t.id, label: t.nombre })) },
                { type: 'select', name: 'marca_id', label: 'Marca', options: marcas.map(m => ({ value: m.id, label: m.nombre })) },
                { type: 'text', name: 'modelo', label: 'Modelo' },
                { type: 'text', name: 'mac', label: 'Dirección MAC' },
                { type: 'text', name: 'ip', label: 'Dirección IP' },
                { type: 'text', name: 'serie', label: 'Número de Serie' },
                { type: 'text', name: 'ssid', label: 'SSID (WiFi)' },
                { type: 'text', name: 'password_wifi', label: 'Contraseña WiFi' }
            ],
            submitText: 'Guardar Cambios',
            onSubmit: async (data) => {
                try {
                    Components.loader.show();
                    const response = await API.servicios.updateEquipo(this.state.servicio.id, equipoId, data);
                    if (response.success) {
                        Components.toast.success('Equipo actualizado');
                        Components.modal.hide();
                        this.loadCliente(this.state.cliente.id);
                    }
                } catch (error) {
                    Components.toast.error(error.message);
                } finally {
                    Components.loader.hide();
                }
            }
        });
    },
    
    async removeEquipo(equipoId) {
        Components.modal.confirm({
            title: '¿Retirar equipo?',
            message: 'El equipo será retirado del servicio.',
            confirmText: 'Sí, retirar',
            type: 'warning',
            onConfirm: async () => {
                try {
                    Components.loader.show();
                    const response = await API.servicios.removeEquipo(this.state.servicio.id, equipoId);
                    if (response.success) {
                        Components.toast.success('Equipo retirado');
                        this.loadCliente(this.state.cliente.id);
                    }
                } catch (error) {
                    Components.toast.error(error.message);
                } finally {
                    Components.loader.hide();
                }
            }
        });
    },
    
    openNotaModal() {
        Components.modal.form({
            title: 'Nueva Nota',
            fields: [
                { type: 'textarea', name: 'nota', label: 'Nota', required: true, placeholder: 'Escribe la nota aquí...' }
            ],
            submitText: 'Guardar Nota',
            onSubmit: async (data) => {
                try {
                    Components.loader.show();
                    const response = await API.clientes.addNota(this.state.cliente.id, data.nota);
                    if (response.success) {
                        Components.toast.success('Nota agregada');
                        Components.modal.hide();
                        await this.loadNotas(this.state.cliente.id);
                        Components.tabs.activate($('#tabs-container'), 'tab-notas');
                        $('#tab-notas').innerHTML = this.renderNotasTab();
                    }
                } catch (error) {
                    Components.toast.error(error.message);
                } finally {
                    Components.loader.hide();
                }
            }
        });
    },
    
    uploadINE(tipo) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,.pdf';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            if (file.size > CONFIG.MAX_FILE_SIZE) {
                Components.toast.error('El archivo es muy grande (máximo 5MB)');
                return;
            }
            
            try {
                Components.loader.show();
                const response = await API.clientes.uploadINE(this.state.cliente.id, file, tipo);
                if (response.success) {
                    Components.toast.success('INE subido correctamente');
                    this.loadCliente(this.state.cliente.id);
                }
            } catch (error) {
                Components.toast.error(error.message);
            } finally {
                Components.loader.hide();
            }
        };
        
        input.click();
    },
    
    async cancelarCargo(cargoId) {
        Components.modal.confirm({
            title: '¿Cancelar cargo?',
            message: 'Esta acción no se puede deshacer.',
            confirmText: 'Sí, cancelar',
            type: 'danger',
            onConfirm: async () => {
                try {
                    Components.loader.show();
                    const response = await API.cargos.cancelar(cargoId, 'Cancelado por usuario');
                    if (response.success) {
                        Components.toast.success('Cargo cancelado');
                        await this.loadCargos(this.state.servicio.id);
                        $('#tab-cargos').innerHTML = this.renderCargosTab();
                    }
                } catch (error) {
                    Components.toast.error(error.message);
                } finally {
                    Components.loader.hide();
                }
            }
        });
    },
    
    async cancelarPago(pagoId) {
        Components.modal.confirm({
            title: '¿Cancelar pago?',
            message: 'Se revertirán los cargos asociados a este pago.',
            confirmText: 'Sí, cancelar',
            type: 'danger',
            onConfirm: async () => {
                try {
                    Components.loader.show();
                    const response = await API.pagos.cancelar(pagoId, 'Cancelado por usuario');
                    if (response.success) {
                        Components.toast.success('Pago cancelado');
                        this.loadCliente(this.state.cliente.id);
                    }
                } catch (error) {
                    Components.toast.error(error.message);
                } finally {
                    Components.loader.hide();
                }
            }
        });
    },
    
    async verRecibo(pagoId) {
        try {
            Components.loader.show();
            const response = await API.pagos.getRecibo(pagoId);
            if (response.success) {
                const recibo = response.data;
                // Abrir ventana de impresión con el recibo
                const win = window.open('', '_blank');
                win.document.write(this.generateReciboHTML(recibo));
                win.document.close();
                win.print();
            }
        } catch (error) {
            Components.toast.error(error.message);
        } finally {
            Components.loader.hide();
        }
    },
    
    generateReciboHTML(recibo) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Recibo ${recibo.numero_recibo}</title>
                <style>
                    body { font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .header h1 { margin: 0; font-size: 24px; }
                    .header p { margin: 5px 0; color: #666; }
                    .info { margin-bottom: 20px; }
                    .info p { margin: 5px 0; }
                    .divider { border-top: 1px dashed #ccc; margin: 15px 0; }
                    .total { font-size: 20px; font-weight: bold; text-align: right; }
                    .footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>SKYNET ISP</h1>
                    <p>Recibo de Pago</p>
                    <p><strong># ${recibo.numero_recibo}</strong></p>
                </div>
                <div class="info">
                    <p><strong>Cliente:</strong> ${recibo.cliente_nombre}</p>
                    <p><strong>Código:</strong> ${recibo.cliente_codigo}</p>
                    <p><strong>Fecha:</strong> ${Utils.formatDateTime(recibo.fecha_pago)}</p>
                    <p><strong>Método:</strong> ${recibo.metodo_pago}</p>
                    ${recibo.referencia ? `<p><strong>Ref:</strong> ${recibo.referencia}</p>` : ''}
                </div>
                <div class="divider"></div>
                <div class="total">
                    Total: ${Utils.formatCurrency(recibo.monto_total)}
                </div>
                <div class="divider"></div>
                <div class="footer">
                    <p>¡Gracias por su pago!</p>
                    <p>${new Date().toLocaleDateString()}</p>
                </div>
            </body>
            </html>
        `;
    },
    
    async suspenderServicio() {
        Components.modal.confirm({
            title: '¿Suspender servicio?',
            message: 'El servicio será suspendido y el cliente no tendrá acceso a internet.',
            confirmText: 'Sí, suspender',
            type: 'warning',
            onConfirm: async () => {
                try {
                    Components.loader.show();
                    const response = await API.servicios.suspender(this.state.servicio.id);
                    if (response.success) {
                        Components.toast.success('Servicio suspendido');
                        this.loadCliente(this.state.cliente.id);
                    }
                } catch (error) {
                    Components.toast.error(error.message);
                } finally {
                    Components.loader.hide();
                }
            }
        });
    },
    
    async reactivarServicio() {
        Components.modal.confirm({
            title: '¿Reactivar servicio?',
            message: '¿Desea generar cargo de reconexión?',
            confirmText: 'Reactivar con cargo',
            cancelText: 'Reactivar sin cargo',
            type: 'primary',
            onConfirm: async () => {
                await this.doReactivar(true);
            }
        });
        
        // Override cancel to also reactivate without charge
        setTimeout(() => {
            const cancelBtn = $('.modal-footer .btn-secondary');
            if (cancelBtn) {
                cancelBtn.onclick = async () => {
                    Components.modal.hide();
                    await this.doReactivar(false);
                };
            }
        }, 100);
    },
    
    async doReactivar(conCargo) {
        try {
            Components.loader.show();
            const response = await API.servicios.reactivar(this.state.servicio.id, conCargo);
            if (response.success) {
                Components.toast.success('Servicio reactivado');
                this.loadCliente(this.state.cliente.id);
            }
        } catch (error) {
            Components.toast.error(error.message);
        } finally {
            Components.loader.hide();
        }
    },
    
    async cancelarCliente() {
        const motivos = await State.getCatalogo('motivosCancelacion');
        
        Components.modal.form({
            title: 'Cancelar Cliente',
            fields: [
                { 
                    type: 'select', 
                    name: 'motivo_cancelacion_id', 
                    label: 'Motivo de Cancelación', 
                    required: true,
                    options: motivos.map(m => ({ value: m.id, label: m.nombre })),
                    addButton: true,
                    addCatalogo: 'motivos-cancelacion'
                }
            ],
            submitText: 'Cancelar Cliente',
            onSubmit: async (data) => {
                try {
                    Components.loader.show();
                    const response = await API.clientes.cancelar(this.state.cliente.id, data.motivo_cancelacion_id);
                    if (response.success) {
                        Components.toast.success('Cliente cancelado');
                        Components.modal.hide();
                        window.location.hash = '#/clientes';
                    }
                } catch (error) {
                    Components.toast.error(error.message);
                } finally {
                    Components.loader.hide();
                }
            }
        });
    }
};

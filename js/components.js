// ============================================
// SKYNET ISP - Reusable Components
// ============================================

const Components = {
    
    // ============================================
    // TOAST NOTIFICATIONS
    // ============================================
    
    toast: {
        show(message, type = 'info', title = null) {
            const container = $('#toast-container');
            const id = Utils.generateId();
            
            const icons = {
                success: ICONS.checkCircle,
                error: ICONS.xCircle,
                warning: ICONS.alertCircle,
                info: ICONS.info
            };
            
            const titles = {
                success: 'Éxito',
                error: 'Error',
                warning: 'Advertencia',
                info: 'Información'
            };
            
            const toast = Utils.createElement('div', {
                className: `toast ${type}`,
                id: `toast-${id}`,
                innerHTML: `
                    <div class="toast-icon">${icons[type]}</div>
                    <div class="toast-content">
                        <div class="toast-title">${title || titles[type]}</div>
                        <div class="toast-message">${message}</div>
                    </div>
                    <button class="toast-close" onclick="Components.toast.hide('${id}')">
                        ${ICONS.close}
                    </button>
                `
            });
            
            container.appendChild(toast);
            
            // Auto remove
            setTimeout(() => this.hide(id), CONFIG.TOAST_DURATION);
            
            return id;
        },
        
        hide(id) {
            const toast = $(`#toast-${id}`);
            if (toast) {
                toast.style.animation = 'slideIn 0.3s ease reverse';
                setTimeout(() => toast.remove(), 300);
            }
        },
        
        success(message, title) { return this.show(message, 'success', title); },
        error(message, title) { return this.show(message, 'error', title); },
        warning(message, title) { return this.show(message, 'warning', title); },
        info(message, title) { return this.show(message, 'info', title); }
    },
    
    // ============================================
    // LOADER
    // ============================================
    
    loader: {
        show() {
            $('#loader').style.display = 'flex';
        },
        
        hide() {
            $('#loader').style.display = 'none';
        }
    },
    
    // ============================================
    // MODAL
    // ============================================
    
    modal: {
        current: null,
        
        show(options) {
            const {
                title = '',
                content = '',
                size = '', // '', 'lg', 'xl'
                footer = null,
                onClose = null,
                closeOnOverlay = true
            } = options;
            
            const modalId = Utils.generateId();
            this.current = modalId;
            
            const sizeClass = size ? `modal-${size}` : '';
            
            const footerHtml = footer ? `
                <div class="modal-footer">
                    ${footer}
                </div>
            ` : '';
            
            const overlay = Utils.createElement('div', {
                className: 'modal-overlay',
                id: `modal-${modalId}`,
                innerHTML: `
                    <div class="modal ${sizeClass}">
                        <div class="modal-header">
                            <h3 class="modal-title">${title}</h3>
                            <button class="modal-close" onclick="Components.modal.hide()">
                                ${ICONS.close}
                            </button>
                        </div>
                        <div class="modal-body">
                            ${content}
                        </div>
                        ${footerHtml}
                    </div>
                `
            });
            
            if (closeOnOverlay) {
                overlay.addEventListener('click', (e) => {
                    if (e.target === overlay) {
                        this.hide();
                    }
                });
            }
            
            // Close on Escape
            const escHandler = (e) => {
                if (e.key === 'Escape') {
                    this.hide();
                    document.removeEventListener('keydown', escHandler);
                }
            };
            document.addEventListener('keydown', escHandler);
            
            this.onCloseCallback = onClose;
            
            $('#modal-container').appendChild(overlay);
            
            // Trigger animation
            requestAnimationFrame(() => {
                overlay.classList.add('active');
            });
            
            return modalId;
        },
        
        hide() {
            if (!this.current) return;
            
            const overlay = $(`#modal-${this.current}`);
            if (overlay) {
                overlay.classList.remove('active');
                setTimeout(() => {
                    overlay.remove();
                    if (this.onCloseCallback) {
                        this.onCloseCallback();
                    }
                }, 200);
            }
            
            this.current = null;
        },
        
        // Form modal helper
        form(options) {
            const {
                title,
                fields = [],
                submitText = 'Guardar',
                onSubmit,
                size = '',
                data = {}
            } = options;
            
            const formId = `form-${Utils.generateId()}`;
            
            let fieldsHtml = fields.map(field => this.renderField(field, data)).join('');
            
            const content = `
                <form id="${formId}" class="modal-form">
                    ${fieldsHtml}
                </form>
            `;
            
            const footer = `
                <button type="button" class="btn btn-secondary" onclick="Components.modal.hide()">
                    Cancelar
                </button>
                <button type="submit" form="${formId}" class="btn btn-primary">
                    ${ICONS.check}
                    ${submitText}
                </button>
            `;
            
            this.show({ title, content, footer, size });
            
            // Handle form submit
            const form = $(`#${formId}`);
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(form);
                const data = Object.fromEntries(formData.entries());
                
                // Convert checkboxes to boolean
                fields.filter(f => f.type === 'checkbox').forEach(f => {
                    data[f.name] = form.querySelector(`[name="${f.name}"]`).checked;
                });
                
                if (onSubmit) {
                    await onSubmit(data);
                }
            });
        },
        
        renderField(field, data = {}) {
            const {
                type = 'text',
                name,
                label,
                required = false,
                placeholder = '',
                options = [],
                value = data[name] || '',
                className = '',
                hint = '',
                addButton = false, // Para agregar nuevo al catálogo
                addCatalogo = null // Nombre del catálogo
            } = field;
            
            const requiredMark = required ? '<span class="required">*</span>' : '';
            const requiredAttr = required ? 'required' : '';
            
            let inputHtml = '';
            
            switch (type) {
                case 'select':
                    const addBtnHtml = addButton ? `
                        <button type="button" class="btn btn-add btn-icon" 
                                onclick="Components.modal.addCatalogoItem('${addCatalogo}', '${name}')"
                                title="Agregar nuevo">
                            ${ICONS.plus}
                        </button>
                    ` : '';
                    
                    inputHtml = `
                        <div class="${addButton ? 'select-with-add' : ''}">
                            <select name="${name}" class="form-select ${className}" ${requiredAttr}>
                                <option value="">Seleccionar...</option>
                                ${options.map(opt => `
                                    <option value="${opt.value}" ${opt.value == value ? 'selected' : ''}>
                                        ${opt.label}
                                    </option>
                                `).join('')}
                            </select>
                            ${addBtnHtml}
                        </div>
                    `;
                    break;
                    
                case 'textarea':
                    inputHtml = `
                        <textarea name="${name}" class="form-control form-textarea ${className}" 
                                  placeholder="${placeholder}" ${requiredAttr}>${value}</textarea>
                    `;
                    break;
                    
                case 'checkbox':
                    inputHtml = `
                        <label class="form-check">
                            <input type="checkbox" name="${name}" class="form-check-input" 
                                   ${value ? 'checked' : ''}>
                            <span class="form-check-label">${label}</span>
                        </label>
                    `;
                    return `<div class="form-group">${inputHtml}</div>`;
                    
                case 'number':
                    inputHtml = `
                        <input type="number" name="${name}" class="form-control ${className}" 
                               value="${value}" placeholder="${placeholder}" ${requiredAttr}
                               step="${field.step || 'any'}" min="${field.min || ''}" max="${field.max || ''}">
                    `;
                    break;
                    
                case 'date':
                    inputHtml = `
                        <input type="date" name="${name}" class="form-control ${className}" 
                               value="${value}" ${requiredAttr}>
                    `;
                    break;
                    
                case 'password':
                    inputHtml = `
                        <div class="input-group">
                            <input type="password" name="${name}" class="form-control ${className}" 
                                   placeholder="${placeholder}" ${requiredAttr} style="padding-left: var(--space-4)">
                            <button type="button" class="input-group-btn btn btn-ghost btn-icon"
                                    onclick="Components.modal.togglePassword(this)">
                                ${ICONS.eye}
                            </button>
                        </div>
                    `;
                    break;
                    
                default:
                    inputHtml = `
                        <input type="${type}" name="${name}" class="form-control ${className}" 
                               value="${value}" placeholder="${placeholder}" ${requiredAttr}>
                    `;
            }
            
            const hintHtml = hint ? `<div class="form-hint">${hint}</div>` : '';
            
            return `
                <div class="form-group">
                    <label class="form-label">${label}${requiredMark}</label>
                    ${inputHtml}
                    ${hintHtml}
                </div>
            `;
        },
        
        togglePassword(btn) {
            const input = btn.parentElement.querySelector('input');
            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            btn.innerHTML = isPassword ? ICONS.eyeOff : ICONS.eye;
        },
        
        // Modal para agregar item a catálogo inline
        async addCatalogoItem(catalogo, selectName) {
            const catalogoLabels = {
                'zonas': 'Zona',
                'ciudades': 'Ciudad',
                'colonias': 'Colonia',
                'bancos': 'Banco',
                'marcas-equipo': 'Marca',
                'tarifas': 'Tarifa'
            };
            
            const label = catalogoLabels[catalogo] || 'Item';
            
            // Cerrar modal actual temporalmente
            const currentModal = $(`#modal-${this.current}`);
            currentModal.style.display = 'none';
            
            this.form({
                title: `Agregar ${label}`,
                fields: [
                    { name: 'nombre', label: 'Nombre', required: true }
                ],
                submitText: 'Agregar',
                onSubmit: async (data) => {
                    try {
                        Components.loader.show();
                        const response = await API.catalogos.create(catalogo, data);
                        
                        if (response.success) {
                            // Recargar catálogo
                            await State.getCatalogo(catalogo.replace('-', ''), true);
                            
                            // Actualizar select en el form original
                            const select = currentModal.querySelector(`[name="${selectName}"]`);
                            if (select) {
                                const option = document.createElement('option');
                                option.value = response.data.id;
                                option.textContent = data.nombre;
                                option.selected = true;
                                select.appendChild(option);
                            }
                            
                            Components.toast.success(`${label} agregado`);
                            this.hide();
                            currentModal.style.display = '';
                        }
                    } catch (error) {
                        Components.toast.error(error.message);
                    } finally {
                        Components.loader.hide();
                    }
                }
            });
        },
        
        // Confirm dialog
        confirm(options) {
            const {
                title = '¿Confirmar acción?',
                message = '',
                confirmText = 'Confirmar',
                cancelText = 'Cancelar',
                type = 'danger', // 'danger', 'warning', 'primary'
                onConfirm
            } = options;
            
            const iconMap = {
                danger: ICONS.alertCircle,
                warning: ICONS.alertCircle,
                primary: ICONS.info
            };
            
            const content = `
                <div class="text-center">
                    <div class="mb-4 text-${type}">${iconMap[type]}</div>
                    <p>${message}</p>
                </div>
            `;
            
            const footer = `
                <button type="button" class="btn btn-secondary" onclick="Components.modal.hide()">
                    ${cancelText}
                </button>
                <button type="button" class="btn btn-${type}" id="confirm-btn">
                    ${confirmText}
                </button>
            `;
            
            this.show({ title, content, footer });
            
            $('#confirm-btn').addEventListener('click', async () => {
                if (onConfirm) {
                    await onConfirm();
                }
                this.hide();
            });
        }
    },
    
    // ============================================
    // DROPDOWN
    // ============================================
    
    dropdown: {
        toggle(element) {
            const dropdown = element.closest('.dropdown');
            const isActive = dropdown.classList.contains('active');
            
            // Close all dropdowns
            $$('.dropdown.active').forEach(d => d.classList.remove('active'));
            
            if (!isActive) {
                dropdown.classList.add('active');
                
                // Close on click outside
                const closeHandler = (e) => {
                    if (!dropdown.contains(e.target)) {
                        dropdown.classList.remove('active');
                        document.removeEventListener('click', closeHandler);
                    }
                };
                
                setTimeout(() => {
                    document.addEventListener('click', closeHandler);
                }, 0);
            }
        }
    },
    
    // ============================================
    // TABS
    // ============================================
    
    tabs: {
        init(container) {
            const tabBtns = container.querySelectorAll('.tab-btn');
            const tabContents = container.querySelectorAll('.tab-content');
            
            tabBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const target = btn.dataset.tab;
                    
                    tabBtns.forEach(b => b.classList.remove('active'));
                    tabContents.forEach(c => c.classList.remove('active'));
                    
                    btn.classList.add('active');
                    container.querySelector(`#${target}`).classList.add('active');
                });
            });
        },
        
        activate(container, tabId) {
            const tabBtns = container.querySelectorAll('.tab-btn');
            const tabContents = container.querySelectorAll('.tab-content');
            
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            container.querySelector(`[data-tab="${tabId}"]`)?.classList.add('active');
            container.querySelector(`#${tabId}`)?.classList.add('active');
        }
    },
    
    // ============================================
    // PAGINATION
    // ============================================
    
    pagination: {
        render(pagination, onPageChange) {
            const { total, page, limit, pages } = pagination;
            
            if (pages <= 1) return '';
            
            let html = '<div class="d-flex align-center justify-between mt-4">';
            html += `<div class="text-sm text-muted">Mostrando ${((page - 1) * limit) + 1} - ${Math.min(page * limit, total)} de ${total}</div>`;
            html += '<div class="d-flex gap-2">';
            
            // Previous
            html += `
                <button class="btn btn-secondary btn-sm" ${page === 1 ? 'disabled' : ''} 
                        onclick="(${onPageChange})(${page - 1})">
                    ${ICONS.chevronLeft}
                </button>
            `;
            
            // Page numbers
            const maxVisible = 5;
            let start = Math.max(1, page - Math.floor(maxVisible / 2));
            let end = Math.min(pages, start + maxVisible - 1);
            
            if (end - start < maxVisible - 1) {
                start = Math.max(1, end - maxVisible + 1);
            }
            
            if (start > 1) {
                html += `<button class="btn btn-secondary btn-sm" onclick="(${onPageChange})(1)">1</button>`;
                if (start > 2) html += '<span class="px-2">...</span>';
            }
            
            for (let i = start; i <= end; i++) {
                html += `
                    <button class="btn ${i === page ? 'btn-primary' : 'btn-secondary'} btn-sm" 
                            onclick="(${onPageChange})(${i})">${i}</button>
                `;
            }
            
            if (end < pages) {
                if (end < pages - 1) html += '<span class="px-2">...</span>';
                html += `<button class="btn btn-secondary btn-sm" onclick="(${onPageChange})(${pages})">${pages}</button>`;
            }
            
            // Next
            html += `
                <button class="btn btn-secondary btn-sm" ${page === pages ? 'disabled' : ''} 
                        onclick="(${onPageChange})(${page + 1})">
                    ${ICONS.chevronRight}
                </button>
            `;
            
            html += '</div></div>';
            
            return html;
        }
    },
    
    // ============================================
    // BADGE
    // ============================================
    
    badge(text, type = 'muted', withDot = false) {
        const dot = withDot ? '<span class="dot"></span>' : '';
        return `<span class="badge badge-${type}">${dot}${text}</span>`;
    },
    
    // ============================================
    // STATUS BADGE
    // ============================================
    
    statusBadge(status) {
        const statusMap = {
            'ACTIVO': { type: 'success', text: 'Activo' },
            'SUSPENDIDO': { type: 'warning', text: 'Suspendido' },
            'CANCELADO': { type: 'danger', text: 'Cancelado' },
            'PENDIENTE': { type: 'info', text: 'Pendiente' },
            'PROSPECTO': { type: 'info', text: 'Prospecto' },
            'PAGADO': { type: 'success', text: 'Pagado' },
            'PARCIAL': { type: 'warning', text: 'Parcial' },
            'APLICADO': { type: 'success', text: 'Aplicado' }
        };
        
        const config = statusMap[status] || { type: 'muted', text: status };
        return this.badge(config.text, config.type, true);
    },
    
    // ============================================
    // EMPTY STATE
    // ============================================
    
    emptyState(message = 'No hay datos', icon = 'inbox', buttonText = null, buttonAction = null) {
        let buttonHtml = '';
        if (buttonText && buttonAction) {
            buttonHtml = `
                <button class="btn btn-primary" onclick="${buttonAction}">
                    ${ICONS.plus} ${buttonText}
                </button>
            `;
        }
        
        return `
            <div class="empty-state">
                ${ICONS[icon] || ICONS.info}
                <h3>${message}</h3>
                ${buttonHtml}
            </div>
        `;
    }
};

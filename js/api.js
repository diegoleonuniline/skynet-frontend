// ============================================
// SKYNET ISP - API Module
// ============================================

const API = {
    // Base request method
    async request(endpoint, options = {}) {
        const url = `${CONFIG.API_URL}${endpoint}`;
        const token = Utils.storage.get(CONFIG.STORAGE_TOKEN);
        
        const defaultHeaders = {
            'Content-Type': 'application/json'
        };
        
        if (token) {
            defaultHeaders['Authorization'] = `Bearer ${token}`;
        }
        
        const config = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers
            }
        };
        
        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                if (response.status === 401) {
                    // Token expired or invalid
                    State.logout();
                    window.location.hash = '#/login';
                }
                throw new Error(data.message || 'Error en la solicitud');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },
    
    // HTTP Methods
    get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    },
    
    post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    
    put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    
    delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    },
    
    // File upload
    async upload(endpoint, formData) {
        const url = `${CONFIG.API_URL}${endpoint}`;
        const token = Utils.storage.get(CONFIG.STORAGE_TOKEN);
        
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: formData
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Error al subir archivo');
        }
        
        return data;
    },
    
    // ============================================
    // AUTH
    // ============================================
    auth: {
        login(username, password) {
            return API.post('/auth/login', { username, password });
        },
        
        logout() {
            return API.post('/auth/logout', {});
        },
        
        me() {
            return API.get('/auth/me');
        },
        
        changePassword(password_actual, password_nuevo) {
            return API.put('/auth/cambiar-password', { password_actual, password_nuevo });
        }
    },
    
    // ============================================
    // CLIENTES
    // ============================================
    clientes: {
        getAll(params = {}) {
            const query = Utils.buildQueryString(params);
            return API.get(`/clientes${query ? '?' + query : ''}`);
        },
        
        search(q) {
            return API.get(`/clientes/buscar?q=${encodeURIComponent(q)}`);
        },
        
        getById(id) {
            return API.get(`/clientes/${id}`);
        },
        
        create(data) {
            return API.post('/clientes', data);
        },
        
        update(id, data) {
            return API.put(`/clientes/${id}`, data);
        },
        
        delete(id) {
            return API.delete(`/clientes/${id}`);
        },
        
        cancelar(id, motivo_cancelacion_id) {
            return API.post(`/clientes/${id}/cancelar`, { motivo_cancelacion_id });
        },
        
        reactivar(id) {
            return API.post(`/clientes/${id}/reactivar`, {});
        },
        
        // INE
        uploadINE(id, file, tipo) {
            const formData = new FormData();
            formData.append('ine', file);
            formData.append('tipo', tipo);
            return API.upload(`/clientes/${id}/ine`, formData);
        },
        
        getINE(id) {
            return API.get(`/clientes/${id}/ine`);
        },
        
        deleteINE(id, ineId) {
            return API.delete(`/clientes/${id}/ine/${ineId}`);
        },
        
        // Notas
        getNotas(id) {
            return API.get(`/clientes/${id}/notas`);
        },
        
        addNota(id, nota) {
            return API.post(`/clientes/${id}/notas`, { nota });
        },
        
        deleteNota(id, notaId) {
            return API.delete(`/clientes/${id}/notas/${notaId}`);
        },
        
        // Historial
        getHistorial(id) {
            return API.get(`/clientes/${id}/historial`);
        }
    },
    
    // ============================================
    // SERVICIOS
    // ============================================
    servicios: {
        getAll(params = {}) {
            const query = Utils.buildQueryString(params);
            return API.get(`/servicios${query ? '?' + query : ''}`);
        },
        
        getById(id) {
            return API.get(`/servicios/${id}`);
        },
        
        create(data) {
            return API.post('/servicios', data);
        },
        
        update(id, data) {
            return API.put(`/servicios/${id}`, data);
        },
        
        delete(id) {
            return API.delete(`/servicios/${id}`);
        },
        
        // Equipos
        getEquipos(id) {
            return API.get(`/servicios/${id}/equipos`);
        },
        
        addEquipo(id, data) {
            return API.post(`/servicios/${id}/equipos`, data);
        },
        
        updateEquipo(id, equipoId, data) {
            return API.put(`/servicios/${id}/equipos/${equipoId}`, data);
        },
        
        removeEquipo(id, equipoId) {
            return API.delete(`/servicios/${id}/equipos/${equipoId}`);
        },
        
        // Cambio de tarifa
        cambiarTarifa(id, tarifa_id) {
            return API.post(`/servicios/${id}/cambiar-tarifa`, { tarifa_id });
        },
        
        // Estados
        suspender(id) {
            return API.post(`/servicios/${id}/suspender`, {});
        },
        
        reactivar(id, generar_cargo_reconexion = false) {
            return API.post(`/servicios/${id}/reactivar`, { generar_cargo_reconexion });
        },
        
        cancelar(id, motivo_cancelacion_id) {
            return API.post(`/servicios/${id}/cancelar`, { motivo_cancelacion_id });
        },
        
        getHistorial(id) {
            return API.get(`/servicios/${id}/historial`);
        },
        
        getHistorialTarifas(id) {
            return API.get(`/servicios/${id}/historial-tarifas`);
        }
    },
    
    // ============================================
    // CARGOS
    // ============================================
    cargos: {
        getAll(params = {}) {
            const query = Utils.buildQueryString(params);
            return API.get(`/cargos${query ? '?' + query : ''}`);
        },
        
        getPendientes(params = {}) {
            const query = Utils.buildQueryString(params);
            return API.get(`/cargos/pendientes${query ? '?' + query : ''}`);
        },
        
        getByServicio(servicioId) {
            return API.get(`/cargos/servicio/${servicioId}`);
        },
        
        getById(id) {
            return API.get(`/cargos/${id}`);
        },
        
        create(data) {
            return API.post('/cargos', data);
        },
        
        update(id, data) {
            return API.put(`/cargos/${id}`, data);
        },
        
        delete(id) {
            return API.delete(`/cargos/${id}`);
        },
        
        cancelar(id, motivo) {
            return API.post(`/cargos/${id}/cancelar`, { motivo });
        },
        
        generarMensualidades(mes, anio) {
            return API.post('/cargos/generar-mensualidades', { mes, anio });
        }
    },
    
    // ============================================
    // PAGOS
    // ============================================
    pagos: {
        getAll(params = {}) {
            const query = Utils.buildQueryString(params);
            return API.get(`/pagos${query ? '?' + query : ''}`);
        },
        
        getByServicio(servicioId) {
            return API.get(`/pagos/servicio/${servicioId}`);
        },
        
        getById(id) {
            return API.get(`/pagos/${id}`);
        },
        
        create(data) {
            return API.post('/pagos', data);
        },
        
        cancelar(id, motivo) {
            return API.post(`/pagos/${id}/cancelar`, { motivo });
        },
        
        getRecibo(id) {
            return API.get(`/pagos/${id}/recibo`);
        }
    },
    
    // ============================================
    // CATÁLOGOS
    // ============================================
    catalogos: {
        getRoles: () => API.get('/catalogos/roles'),
        getEstados: () => API.get('/catalogos/estados'),
        getCiudades: () => API.get('/catalogos/ciudades'),
        getCiudadesByEstado: (estadoId) => API.get(`/catalogos/ciudades/estado/${estadoId}`),
        getColonias: () => API.get('/catalogos/colonias'),
        getColoniasByCiudad: (ciudadId) => API.get(`/catalogos/colonias/ciudad/${ciudadId}`),
        getZonas: () => API.get('/catalogos/zonas'),
        getBancos: () => API.get('/catalogos/bancos'),
        getMetodosPago: () => API.get('/catalogos/metodos-pago'),
        getConceptosCobro: () => API.get('/catalogos/conceptos-cobro'),
        getCargosTipo: () => API.get('/catalogos/cargos-tipo'),
        getTarifas: () => API.get('/catalogos/tarifas'),
        getEstatusCliente: () => API.get('/catalogos/estatus-cliente'),
        getEstatusServicio: () => API.get('/catalogos/estatus-servicio'),
        getTipoEquipo: () => API.get('/catalogos/tipo-equipo'),
        getMarcasEquipo: () => API.get('/catalogos/marcas-equipo'),
        getModelosEquipo: () => API.get('/catalogos/modelos-equipo'),
        getModelosByMarca: (marcaId) => API.get(`/catalogos/modelos-equipo/marca/${marcaId}`),
        getMotivosCancelacion: () => API.get('/catalogos/motivos-cancelacion'),
        getPermisos: () => API.get('/catalogos/permisos'),
        
        // CRUD genérico
        create(catalogo, data) {
            return API.post(`/catalogos/${catalogo}`, data);
        },
        
        update(catalogo, id, data) {
            return API.put(`/catalogos/${catalogo}/${id}`, data);
        },
        
        delete(catalogo, id) {
            return API.delete(`/catalogos/${catalogo}/${id}`);
        }
    },
    
    // ============================================
    // DASHBOARD
    // ============================================
    dashboard: {
        getResumen: () => API.get('/dashboard/resumen'),
        getGraficoIngresos: (meses = 6) => API.get(`/dashboard/grafico-ingresos?meses=${meses}`),
        getGraficoServicios: () => API.get('/dashboard/grafico-servicios'),
        getProximosVencer: (dias = 5) => API.get(`/dashboard/proximos-vencer?dias=${dias}`),
        getActividadReciente: (limite = 15) => API.get(`/dashboard/actividad-reciente?limite=${limite}`)
    },
    
    // ============================================
    // REPORTES
    // ============================================
    reportes: {
        adeudos: (params = {}) => {
            const query = Utils.buildQueryString(params);
            return API.get(`/reportes/adeudos${query ? '?' + query : ''}`);
        },
        clientesPorCiudad: () => API.get('/reportes/clientes-por-ciudad'),
        clientesPorZona: () => API.get('/reportes/clientes-por-zona'),
        clientesPorCalle: (params = {}) => {
            const query = Utils.buildQueryString(params);
            return API.get(`/reportes/clientes-por-calle${query ? '?' + query : ''}`);
        },
        ingresos: (params = {}) => {
            const query = Utils.buildQueryString(params);
            return API.get(`/reportes/ingresos${query ? '?' + query : ''}`);
        },
        cobranza: (mes, anio) => API.get(`/reportes/cobranza?mes=${mes}&anio=${anio}`),
        altasBajas: (params = {}) => {
            const query = Utils.buildQueryString(params);
            return API.get(`/reportes/altas-bajas${query ? '?' + query : ''}`);
        },
        serviciosPorTarifa: () => API.get('/reportes/servicios-por-tarifa'),
        equipos: (params = {}) => {
            const query = Utils.buildQueryString(params);
            return API.get(`/reportes/equipos${query ? '?' + query : ''}`);
        }
    },
    
    // ============================================
    // HISTORIAL
    // ============================================
    historial: {
        getAll: (params = {}) => {
            const query = Utils.buildQueryString(params);
            return API.get(`/historial${query ? '?' + query : ''}`);
        },
        getByTabla: (tabla, params = {}) => {
            const query = Utils.buildQueryString(params);
            return API.get(`/historial/tabla/${tabla}${query ? '?' + query : ''}`);
        },
        getByRegistro: (tabla, id) => API.get(`/historial/registro/${tabla}/${id}`),
        getByUsuario: (usuarioId, params = {}) => {
            const query = Utils.buildQueryString(params);
            return API.get(`/historial/usuario/${usuarioId}${query ? '?' + query : ''}`);
        }
    }
};

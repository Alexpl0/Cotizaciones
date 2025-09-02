/**
 * Módulo de API - Portal de Cotización Inteligente
 * Manejo de todas las comunicaciones con el backend
 * @author Alejandro Pérez
 */

import Utils from './utils.js';
import Notifications from './notifications.js';

const API = {
    
    /**
     * Configuración base para fetch
     */
    baseConfig: {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        credentials: 'same-origin'
    },

    /**
     * Realiza una petición HTTP genérica
     * @param {string} endpoint 
     * @param {Object} data 
     * @param {Object} config 
     * @returns {Promise}
     */
    async request(endpoint, data = {}, config = {}) {
        const url = CONFIG.buildUrl(endpoint);
        const requestConfig = {
            ...this.baseConfig,
            ...config,
            body: JSON.stringify(data)
        };

        try {
            console.log(`📡 API Request: ${endpoint}`, data);
            
            const response = await fetch(url, requestConfig);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const responseData = await response.json();
            
            console.log(`✅ API Response: ${endpoint}`, responseData);
            
            return responseData;
            
        } catch (error) {
            console.error(`❌ API Error: ${endpoint}`, error);
            Utils.handleError(error, `API request to ${endpoint}`);
            throw error;
        }
    },

    /**
     * Manejo de respuestas de API estandarizado
     * @param {Promise} apiPromise 
     * @param {Object} options 
     * @returns {Promise}
     */
    async handleResponse(apiPromise, options = {}) {
        const {
            showLoading = false,
            showSuccessMessage = false,
            successMessage = 'Operación completada exitosamente',
            showErrorMessage = true,
            onSuccess = null,
            onError = null
        } = options;

        if (showLoading) {
            Notifications.loading();
        }

        try {
            const response = await apiPromise;
            
            if (showLoading) {
                Notifications.close();
            }

            if (response.success) {
                if (showSuccessMessage) {
                    Notifications.toastSuccess(successMessage);
                }
                
                if (onSuccess && typeof onSuccess === 'function') {
                    onSuccess(response.data);
                }
                
                return response.data;
            } else {
                throw new Error(response.message || 'Error desconocido');
            }
            
        } catch (error) {
            if (showLoading) {
                Notifications.close();
            }
            
            if (showErrorMessage) {
                Notifications.toastError(error.message || 'Ha ocurrido un error');
            }
            
            if (onError && typeof onError === 'function') {
                onError(error);
            }
            
            throw error;
        }
    },

    // ==================== ENDPOINTS ESPECÍFICOS ====================

    /**
     * Envía una nueva solicitud de cotización
     * @param {Object} requestData 
     * @returns {Promise}
     */
    async sendShippingRequest(requestData) {
        return this.handleResponse(
            this.request(CONFIG.API.SEND_REQUEST, requestData),
            {
                showLoading: true,
                showSuccessMessage: true,
                successMessage: 'Solicitud enviada correctamente. Se han notificado los transportistas.',
            }
        );
    },

    /**
     * Obtiene la lista de solicitudes
     * @param {Object} filters 
     * @returns {Promise}
     */
    async getShippingRequests(filters = {}) {
        return this.handleResponse(
            this.request(CONFIG.API.GET_REQUESTS, filters),
            {
                showErrorMessage: false // No mostrar error toast, manejar silenciosamente
            }
        );
    },

    /**
     * Obtiene las cotizaciones de una solicitud específica
     * @param {number} requestId 
     * @returns {Promise}
     */
    async getQuotes(requestId) {
        return this.handleResponse(
            this.request(CONFIG.API.GET_QUOTES, { request_id: requestId }),
            {
                showErrorMessage: false
            }
        );
    },

    /**
     * Obtiene la lista de transportistas
     * @returns {Promise}
     */
    async getCarriers() {
        return this.handleResponse(
            this.request(CONFIG.API.GET_CARRIERS),
            {
                showErrorMessage: false
            }
        );
    },

    /**
     * Actualiza el estado de una solicitud
     * @param {number} requestId 
     * @param {string} status 
     * @returns {Promise}
     */
    async updateRequestStatus(requestId, status) {
        return this.handleResponse(
            this.request(CONFIG.API.UPDATE_REQUEST_STATUS, {
                request_id: requestId,
                status: status
            }),
            {
                showLoading: true,
                showSuccessMessage: true,
                successMessage: 'Estado actualizado correctamente'
            }
        );
    },

    /**
     * Selecciona una cotización específica
     * @param {number} quoteId 
     * @returns {Promise}
     */
    async selectQuote(quoteId) {
        return this.handleResponse(
            this.request(CONFIG.API.SELECT_QUOTE, { quote_id: quoteId }),
            {
                showLoading: true,
                showSuccessMessage: true,
                successMessage: 'Cotización seleccionada. Se ha agregado a la cola de SAP.'
            }
        );
    },

    // ==================== MÉTODOS DE POLLING ====================

    /**
     * Sistema de polling para actualizar datos automáticamente
     * @param {Function} apiCall 
     * @param {number} interval 
     * @param {Function} callback 
     * @returns {Object} Control del polling
     */
    startPolling(apiCall, interval = CONFIG.POLLING.INTERVAL, callback = null) {
        let retryCount = 0;
        const maxRetries = CONFIG.POLLING.MAX_RETRIES;
        
        const poll = async () => {
            try {
                const data = await apiCall();
                retryCount = 0; // Reset retry count on success
                
                if (callback && typeof callback === 'function') {
                    callback(data);
                }
            } catch (error) {
                retryCount++;
                console.warn(`Polling error (${retryCount}/${maxRetries}):`, error);
                
                if (retryCount >= maxRetries) {
                    console.error('Max polling retries reached. Stopping polling.');
                    clearInterval(pollingInterval);
                }
            }
        };
        
        // Ejecutar inmediatamente
        poll();
        
        // Configurar intervalo
        const pollingInterval = setInterval(poll, interval);
        
        // Retornar control del polling
        return {
            stop: () => {
                clearInterval(pollingInterval);
                console.log('Polling stopped');
            },
            restart: () => {
                clearInterval(pollingInterval);
                const newPolling = this.startPolling(apiCall, interval, callback);
                return newPolling;
            }
        };
    },

    /**
     * Polling específico para solicitudes
     * @param {Function} callback 
     * @returns {Object}
     */
    startRequestsPolling(callback) {
        return this.startPolling(
            () => this.getShippingRequests(),
            CONFIG.POLLING.INTERVAL,
            callback
        );
    },

    /**
     * Polling específico para cotizaciones de una solicitud
     * @param {number} requestId 
     * @param {Function} callback 
     * @returns {Object}
     */
    startQuotesPolling(requestId, callback) {
        return this.startPolling(
            () => this.getQuotes(requestId),
            CONFIG.POLLING.INTERVAL,
            callback
        );
    },

    // ==================== VALIDACIONES ====================

    /**
     * Valida los datos de una solicitud antes de enviar
     * @param {Object} requestData 
     * @returns {Object}
     */
    validateShippingRequest(requestData) {
        const errors = [];

        // Validar información básica
        if (!requestData.user_name || requestData.user_name.trim() === '') {
            errors.push('El nombre del usuario es obligatorio');
        }

        // Validar origen
        if (!requestData.origin_details) {
            errors.push('Los detalles del origen son obligatorios');
        } else {
            const origin = requestData.origin_details;
            if (!origin.country) errors.push('El país de origen es obligatorio');
            if (!origin.address) errors.push('La dirección de origen es obligatoria');
        }

        // Validar destino
        if (!requestData.destination_details) {
            errors.push('Los detalles del destino son obligatorios');
        } else {
            const destination = requestData.destination_details;
            if (!destination.country) errors.push('El país de destino es obligatorio');
            if (!destination.address) errors.push('La dirección de destino es obligatoria');
        }

        // Validar paquetes
        if (!requestData.package_details || !Array.isArray(requestData.package_details)) {
            errors.push('Debe agregar al menos un paquete');
        } else {
            requestData.package_details.forEach((pkg, index) => {
                if (!pkg.description) {
                    errors.push(`La descripción del paquete ${index + 1} es obligatoria`);
                }
                if (!pkg.weight || pkg.weight <= 0) {
                    errors.push(`El peso del paquete ${index + 1} debe ser mayor a 0`);
                }
                if (!pkg.quantity || pkg.quantity <= 0) {
                    errors.push(`La cantidad del paquete ${index + 1} debe ser mayor a 0`);
                }
            });
        }

        // Validar tipo de servicio
        if (!requestData.service_type || !Object.values(CONFIG.SERVICE_TYPES).includes(requestData.service_type)) {
            errors.push('Debe seleccionar un tipo de servicio válido');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
};

// Exportar para módulos
export default API;
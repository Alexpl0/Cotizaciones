/**
 * Configuración global del Portal de Cotización Inteligente
 * @author Alejandro Pérez
 * @version 1.0
 */

const CONFIG = {
    // URL base del proyecto (cambiar según el dominio)
    URLBASE: 'https://grammermx.com/Jesus//Cotizaciones/', // Cambiar por tu dominio real
    
    // Endpoints de la API
    API: {
        SEND_REQUEST: 'dao/daoSendRequest.php',
        GET_REQUESTS: 'dao/daoGetRequests.php',
        GET_QUOTES: 'dao/daoGetQuotes.php',
        GET_CARRIERS: 'dao/daoGetCarriers.php',
        UPDATE_REQUEST_STATUS: 'dao/daoUpdateRequestStatus.php',
        SELECT_QUOTE: 'dao/daoSelectQuote.php'
    },
    
    // Configuración de la aplicación
    APP: {
        NAME: 'Portal de Cotización Inteligente',
        VERSION: '1.0',
        COMPANY: 'Tu Empresa'
    },
    
    // Configuración de notificaciones
    NOTIFICATIONS: {
        SUCCESS_TIMEOUT: 3000,
        ERROR_TIMEOUT: 5000,
        WARNING_TIMEOUT: 4000
    },
    
    // Configuración de formularios
    FORMS: {
        MAX_PACKAGES: 10,
        WEIGHT_UNIT: 'kg',
        DIMENSION_UNIT: 'cm'
    },
    
    // Estados del sistema
    REQUEST_STATUS: {
        PENDING: 'pending',
        QUOTING: 'quoting', 
        COMPLETED: 'completed',
        CANCELED: 'canceled'
    },
    
    // Tipos de servicio
    SERVICE_TYPES: {
        AIR: 'air',
        SEA: 'sea', 
        LAND: 'land'
    },
    
    // Configuración de polling para el dashboard
    POLLING: {
        INTERVAL: 30000, // 30 segundos
        MAX_RETRIES: 3
    },
    
    // Mensajes del sistema
    MESSAGES: {
        LOADING: 'Cargando...',
        NO_DATA: 'No hay datos disponibles',
        ERROR_GENERIC: 'Ha ocurrido un error inesperado',
        SUCCESS_SAVE: 'Información guardada correctamente',
        CONFIRM_DELETE: '¿Está seguro de que desea eliminar este elemento?'
    }
};

// Función para construir URLs completas
CONFIG.buildUrl = function(endpoint) {
    return this.URLBASE + endpoint;
};

// Función para obtener URL de API
CONFIG.getApiUrl = function(apiKey) {
    if (!this.API[apiKey]) {
        throw new Error(`API endpoint '${apiKey}' no encontrado`);
    }
    return this.buildUrl(this.API[apiKey]);
};

// Validar configuración al cargar
CONFIG.validate = function() {
    if (!this.URLBASE.endsWith('/')) {
        console.warn('URLBASE debería terminar con "/"');
    }
    
    if (this.URLBASE.includes('tudominio.hostinger.com')) {
        console.warn('Recuerda cambiar URLBASE por tu dominio real');
    }
    
    return true;
};

// Auto-validar al cargar
document.addEventListener('DOMContentLoaded', function() {
    CONFIG.validate();
});

// Exportar configuración para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}

// Hacer disponible globalmente
window.CONFIG = CONFIG;
/**
 * Módulo de Utilidades - Portal de Cotización Inteligente
 * Funciones comunes reutilizables
 * @author Alejandro Pérez
 */

const Utils = {
    
    /**
     * Valida un email
     * @param {string} email 
     * @returns {boolean}
     */
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    /**
     * Valida un número positivo
     * @param {number} num 
     * @returns {boolean}
     */
    validatePositiveNumber(num) {
        return !isNaN(num) && parseFloat(num) > 0;
    },

    /**
     * Sanitiza una cadena para evitar XSS
     * @param {string} str 
     * @returns {string}
     */
    sanitizeString(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    /**
     * Formatea un número como moneda
     * @param {number} amount 
     * @param {string} currency 
     * @returns {string}
     */
    formatCurrency(amount, currency = 'USD') {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2
        }).format(amount);
    },

    /**
     * Formatea una fecha
     * @param {Date|string} date 
     * @returns {string}
     */
    formatDate(date) {
        const d = new Date(date);
        return d.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    /**
     * Convierte fecha a formato ISO para inputs
     * @param {Date} date 
     * @returns {string}
     */
    dateToInputValue(date) {
        const d = new Date(date);
        return d.toISOString().slice(0, 16);
    },

    /**
     * Capitaliza la primera letra de cada palabra
     * @param {string} str 
     * @returns {string}
     */
    capitalizeWords(str) {
        return str.replace(/\w\S*/g, (txt) => 
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
    },

    /**
     * Genera un ID único
     * @returns {string}
     */
    generateUniqueId() {
        return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    },

    /**
     * Debounce para limitar ejecución de funciones
     * @param {Function} func 
     * @param {number} delay 
     * @returns {Function}
     */
    debounce(func, delay = 300) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    },

    /**
     * Throttle para limitar ejecución de funciones
     * @param {Function} func 
     * @param {number} limit 
     * @returns {Function}
     */
    throttle(func, limit = 100) {
        let inThrottle;
        return function (...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Copia texto al portapapeles
     * @param {string} text 
     * @returns {Promise<boolean>}
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            // Fallback para navegadores más antiguos
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                document.body.removeChild(textArea);
                return true;
            } catch (err) {
                document.body.removeChild(textArea);
                return false;
            }
        }
    },

    /**
     * Verifica si un elemento está visible en el viewport
     * @param {HTMLElement} element 
     * @returns {boolean}
     */
    isElementInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    },

    /**
     * Scroll suave a un elemento
     * @param {string|HTMLElement} target 
     * @param {number} offset 
     */
    smoothScrollTo(target, offset = 0) {
        const element = typeof target === 'string' 
            ? document.querySelector(target) 
            : target;
            
        if (element) {
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    },

    /**
     * Valida un formulario y muestra errores
     * @param {HTMLFormElement} form 
     * @returns {boolean}
     */
    validateForm(form) {
        const invalidInputs = form.querySelectorAll(':invalid');
        let isValid = true;

        // Remover clases de error previas
        form.querySelectorAll('.is-invalid').forEach(input => {
            input.classList.remove('is-invalid');
        });

        invalidInputs.forEach(input => {
            input.classList.add('is-invalid');
            isValid = false;
        });

        return isValid;
    },

    /**
     * Muestra/oculta el estado de carga en un elemento
     * @param {HTMLElement} element 
     * @param {boolean} loading 
     */
    setLoadingState(element, loading = true) {
        if (loading) {
            element.classList.add('loading');
            element.setAttribute('disabled', 'disabled');
        } else {
            element.classList.remove('loading');
            element.removeAttribute('disabled');
        }
    },

    /**
     * Parsea parámetros de la URL
     * @returns {Object}
     */
    getUrlParams() {
        const params = {};
        const urlSearchParams = new URLSearchParams(window.location.search);
        
        for (const [key, value] of urlSearchParams) {
            params[key] = value;
        }
        
        return params;
    },

    /**
     * Actualiza los parámetros de la URL sin recargar
     * @param {Object} params 
     */
    updateUrlParams(params) {
        const url = new URL(window.location);
        
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined) {
                url.searchParams.set(key, params[key]);
            } else {
                url.searchParams.delete(key);
            }
        });
        
        window.history.replaceState({}, '', url);
    },

    /**
     * Manejo de errores global
     * @param {Error} error 
     * @param {string} context 
     */
    handleError(error, context = '') {
        console.error(`Error en ${context}:`, error);
        
        // Log del error (se puede enviar a un servicio de logging)
        const errorData = {
            message: error.message,
            stack: error.stack,
            context: context,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        // En un entorno de producción, aquí se enviaría a un servicio de logging
        console.warn('Error logged:', errorData);
    }
};

// Exportar para módulos
export default Utils;
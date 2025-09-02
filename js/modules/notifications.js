/**
 * Módulo de Notificaciones - Portal de Cotización Inteligente
 * Sistema de notificaciones usando SweetAlert2
 * @author Alejandro Pérez
 */

const Notifications = {
    
    /**
     * Configuración por defecto de SweetAlert
     */
    defaultConfig: {
        showConfirmButton: true,
        allowOutsideClick: false,
        allowEscapeKey: true,
        customClass: {
            container: 'swal-custom-container',
            popup: 'swal-custom-popup',
            title: 'swal-custom-title',
            content: 'swal-custom-content',
            confirmButton: 'btn btn-custom-primary',
            cancelButton: 'btn btn-outline-secondary'
        },
        buttonsStyling: false
    },

    /**
     * Notificación de éxito
     * @param {string} title 
     * @param {string} message 
     * @param {number} timer 
     */
    success(title, message = '', timer = null) {
        return Swal.fire({
            ...this.defaultConfig,
            icon: 'success',
            title: title,
            text: message,
            timer: timer || CONFIG.NOTIFICATIONS.SUCCESS_TIMEOUT,
            timerProgressBar: true,
            showConfirmButton: !timer,
            customClass: {
                ...this.defaultConfig.customClass,
                confirmButton: 'btn btn-success'
            }
        });
    },

    /**
     * Notificación de error
     * @param {string} title 
     * @param {string} message 
     * @param {number} timer 
     */
    error(title, message = '', timer = null) {
        return Swal.fire({
            ...this.defaultConfig,
            icon: 'error',
            title: title,
            text: message,
            timer: timer || CONFIG.NOTIFICATIONS.ERROR_TIMEOUT,
            timerProgressBar: timer ? true : false,
            showConfirmButton: true,
            customClass: {
                ...this.defaultConfig.customClass,
                confirmButton: 'btn btn-danger'
            }
        });
    },

    /**
     * Notificación de advertencia
     * @param {string} title 
     * @param {string} message 
     * @param {number} timer 
     */
    warning(title, message = '', timer = null) {
        return Swal.fire({
            ...this.defaultConfig,
            icon: 'warning',
            title: title,
            text: message,
            timer: timer || CONFIG.NOTIFICATIONS.WARNING_TIMEOUT,
            timerProgressBar: timer ? true : false,
            showConfirmButton: true,
            customClass: {
                ...this.defaultConfig.customClass,
                confirmButton: 'btn btn-warning'
            }
        });
    },

    /**
     * Notificación informativa
     * @param {string} title 
     * @param {string} message 
     * @param {number} timer 
     */
    info(title, message = '', timer = null) {
        return Swal.fire({
            ...this.defaultConfig,
            icon: 'info',
            title: title,
            text: message,
            timer: timer || CONFIG.NOTIFICATIONS.WARNING_TIMEOUT,
            timerProgressBar: timer ? true : false,
            showConfirmButton: true,
            customClass: {
                ...this.defaultConfig.customClass,
                confirmButton: 'btn btn-info'
            }
        });
    },

    /**
     * Confirmación con botones Sí/No
     * @param {string} title 
     * @param {string} message 
     * @param {string} confirmText 
     * @param {string} cancelText 
     */
    confirm(title, message = '', confirmText = 'Sí, continuar', cancelText = 'Cancelar') {
        return Swal.fire({
            ...this.defaultConfig,
            icon: 'question',
            title: title,
            text: message,
            showCancelButton: true,
            confirmButtonText: confirmText,
            cancelButtonText: cancelText,
            customClass: {
                ...this.defaultConfig.customClass,
                confirmButton: 'btn btn-custom-primary me-2',
                cancelButton: 'btn btn-outline-secondary'
            }
        });
    },

    /**
     * Confirmación de eliminación
     * @param {string} itemName 
     */
    confirmDelete(itemName = 'este elemento') {
        return Swal.fire({
            ...this.defaultConfig,
            icon: 'warning',
            title: '¿Eliminar elemento?',
            html: `¿Está seguro de que desea eliminar <strong>${itemName}</strong>?<br><small class="text-muted">Esta acción no se puede deshacer.</small>`,
            showCancelButton: true,
            confirmButtonText: '<i class="fas fa-trash"></i> Sí, eliminar',
            cancelButtonText: 'Cancelar',
            customClass: {
                ...this.defaultConfig.customClass,
                confirmButton: 'btn btn-danger me-2',
                cancelButton: 'btn btn-outline-secondary'
            }
        });
    },

    /**
     * Modal de carga
     * @param {string} title 
     * @param {string} message 
     */
    loading(title = 'Procesando...', message = 'Por favor espere un momento.') {
        return Swal.fire({
            title: title,
            text: message,
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            },
            customClass: {
                popup: 'swal-custom-popup',
                title: 'swal-custom-title',
                content: 'swal-custom-content'
            }
        });
    },

    /**
     * Cierra cualquier modal activo
     */
    close() {
        Swal.close();
    },

    /**
     * Toast notification (esquina superior derecha)
     * @param {string} icon 
     * @param {string} title 
     * @param {number} timer 
     */
    toast(icon, title, timer = 3000) {
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: timer,
            timerProgressBar: true,
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer);
                toast.addEventListener('mouseleave', Swal.resumeTimer);
            },
            customClass: {
                popup: 'swal-toast-popup',
                title: 'swal-toast-title'
            }
        });

        return Toast.fire({
            icon: icon,
            title: title
        });
    },

    /**
     * Toast de éxito
     * @param {string} message 
     */
    toastSuccess(message) {
        return this.toast('success', message);
    },

    /**
     * Toast de error
     * @param {string} message 
     */
    toastError(message) {
        return this.toast('error', message, 5000);
    },

    /**
     * Toast de advertencia
     * @param {string} message 
     */
    toastWarning(message) {
        return this.toast('warning', message, 4000);
    },

    /**
     * Toast informativo
     * @param {string} message 
     */
    toastInfo(message) {
        return this.toast('info', message);
    },

    /**
     * Modal personalizado con HTML
     * @param {string} title 
     * @param {string} htmlContent 
     * @param {Object} options 
     */
    customModal(title, htmlContent, options = {}) {
        return Swal.fire({
            ...this.defaultConfig,
            title: title,
            html: htmlContent,
            showConfirmButton: true,
            confirmButtonText: 'Cerrar',
            ...options,
            customClass: {
                ...this.defaultConfig.customClass,
                ...options.customClass
            }
        });
    },

    /**
     * Input modal para obtener datos del usuario
     * @param {string} title 
     * @param {string} inputType 
     * @param {string} placeholder 
     * @param {*} inputValue 
     */
    inputModal(title, inputType = 'text', placeholder = '', inputValue = '') {
        return Swal.fire({
            ...this.defaultConfig,
            title: title,
            input: inputType,
            inputPlaceholder: placeholder,
            inputValue: inputValue,
            showCancelButton: true,
            confirmButtonText: 'Aceptar',
            cancelButtonText: 'Cancelar',
            inputValidator: (value) => {
                if (!value) {
                    return 'Este campo es obligatorio';
                }
            },
            customClass: {
                ...this.defaultConfig.customClass,
                confirmButton: 'btn btn-custom-primary me-2',
                cancelButton: 'btn btn-outline-secondary'
            }
        });
    },

    /**
     * Progreso con barra
     * @param {string} title 
     * @param {string} message 
     */
    progressModal(title = 'Procesando...', message = '') {
        return Swal.fire({
            title: title,
            text: message,
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            html: `
                <div class="progress mb-3" style="height: 20px;">
                    <div id="swal-progress-bar" class="progress-bar bg-primary" 
                         role="progressbar" style="width: 0%" 
                         aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
                        <span class="progress-text">0%</span>
                    </div>
                </div>
                <p id="swal-progress-text">${message}</p>
            `,
            customClass: {
                popup: 'swal-custom-popup',
                title: 'swal-custom-title'
            }
        });
    },

    /**
     * Actualiza el progreso del modal de progreso
     * @param {number} percentage 
     * @param {string} text 
     */
    updateProgress(percentage, text = '') {
        const progressBar = document.getElementById('swal-progress-bar');
        const progressText = document.getElementById('swal-progress-text');
        
        if (progressBar) {
            progressBar.style.width = percentage + '%';
            progressBar.setAttribute('aria-valuenow', percentage);
            progressBar.querySelector('.progress-text').textContent = percentage + '%';
        }
        
        if (progressText && text) {
            progressText.textContent = text;
        }
    }
};

// Exportar para módulos
export default Notifications;
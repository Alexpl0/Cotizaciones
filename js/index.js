/**
 * JavaScript para index.html - Portal de Cotización GRAMMER Logística
 * Archivo principal refactorizado usando módulos
 * @author Alejandro Pérez
 */

import API from './modules/api.js';
import Utils from './modules/utils.js';
import Notifications from './modules/notifications.js';
import FormManager from './forms/FormManager.js';

class GrammerShippingRequestForm {
    
    constructor() {
        this.form = document.getElementById('shippingRequestForm');
        this.methodSelector = document.getElementById('shippingMethodSelector');
        this.formContainer = document.getElementById('dynamicFormContainer');
        this.submitBtn = document.getElementById('submitBtn');
        this.clearFormBtn = document.getElementById('clearFormBtn');
        
        this.formManager = new FormManager();
        this.currentMethod = null;
        this.formData = {};
        
        this.init();
    }
    
    /**
     * Inicializa el formulario y sus eventos
     */
    init() {
        this.setupEventListeners();
        this.loadUserData();
        this.showMethodSelector();
        
        console.log('🚚 Portal GRAMMER Logística inicializado');
    }
    
    /**
     * Configura todos los event listeners
     */
    setupEventListeners() {
        // Envío del formulario
        this.form.addEventListener('submit', this.handleSubmit.bind(this));
        
        // Botón para limpiar formulario
        this.clearFormBtn.addEventListener('click', this.clearForm.bind(this));
        
        // Validación en tiempo real
        this.form.addEventListener('input', Utils.debounce(this.validateField.bind(this), 300));
        this.form.addEventListener('change', this.validateField.bind(this));
        
        // Auto-guardar borrador cada 30 segundos
        setInterval(this.saveDraft.bind(this), 30000);
        
        // Confirmar antes de salir si hay cambios
        window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    }
    
    /**
     * Muestra el selector de método de envío
     */
    showMethodSelector() {
        this.formContainer.innerHTML = `
            <div class="method-selector-container">
                <div class="text-center mb-4">
                    <h3 class="text-primary mb-3">
                        <i class="fas fa-shipping-fast me-2"></i>
                        Seleccionar Método de Envío
                    </h3>
                    <p class="text-muted">Elige el tipo de envío que necesitas gestionar</p>
                </div>
                
                <div class="row g-4">
                    <div class="col-md-4">
                        <div class="method-card" data-method="fedex">
                            <div class="method-icon">
                                <i class="fas fa-box"></i>
                            </div>
                            <h5>Fedex Express</h5>
                            <p>Envíos urgentes y documentos importantes</p>
                            <ul class="method-features">
                                <li>Empresas origen/destino</li>
                                <li>Contactos específicos</li>
                                <li>Detalles de embalaje</li>
                                <li>Centro de costos</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="col-md-4">
                        <div class="method-card" data-method="aereo_maritimo">
                            <div class="method-icon">
                                <i class="fas fa-globe"></i>
                            </div>
                            <h5>Aéreo-Marítimo</h5>
                            <p>Envíos internacionales por aire o mar</p>
                            <ul class="method-features">
                                <li>Pallets y cajas</li>
                                <li>INCOTERMS</li>
                                <li>Puertos/Aeropuertos</li>
                                <li>Fechas de entrega</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="col-md-4">
                        <div class="method-card" data-method="nacional">
                            <div class="method-icon">
                                <i class="fas fa-truck"></i>
                            </div>
                            <h5>Nacional</h5>
                            <p>Envíos domésticos dentro de México</p>
                            <ul class="method-features">
                                <li>Entrega a planta GRAMMER</li>
                                <li>Horarios de recolección</li>
                                <li>Pallets optimizados</li>
                                <li>Seguimiento nacional</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Agregar event listeners a las tarjetas
        document.querySelectorAll('.method-card').forEach(card => {
            card.addEventListener('click', () => {
                const method = card.dataset.method;
                this.selectShippingMethod(method);
            });
        });
    }
    
    /**
     * Selecciona un método de envío y muestra su formulario
     */
    selectShippingMethod(method) {
        this.currentMethod = method;
        
        // Animación de salida para el selector
        const container = document.querySelector('.method-selector-container');
        container.style.animation = 'slideOutUp 0.3s ease-in';
        
        setTimeout(() => {
            this.renderMethodForm(method);
        }, 300);
    }
    
    /**
     * Renderiza el formulario específico del método seleccionado
     */
    renderMethodForm(method) {
        const success = this.formManager.renderForm(method, this.formContainer);
        
        if (!success) {
            console.error('No se pudo renderizar el formulario para:', method);
            this.showMethodSelector();
        }
    }
    
    /**
     * Maneja el envío del formulario
     */
    async handleSubmit(event) {
        event.preventDefault();
        
        if (!this.currentMethod) {
            Notifications.error('Error', 'Debe seleccionar un método de envío.');
            return;
        }
        
        if (!this.formManager.validateCurrentForm()) {
            Notifications.warning(
                'Formulario incompleto', 
                'Por favor complete todos los campos obligatorios.'
            );
            return;
        }
        
        const formData = this.formManager.collectCurrentFormData(this.form.elements);
        
        try {
            Utils.setLoadingState(this.submitBtn, true);
            this.form.classList.add('form-loading');
            
            const response = await API.sendGrammerShippingRequest(formData);
            
            // Mostrar modal de éxito con información específica
            const result = await Notifications.customModal(
                '¡Solicitud GRAMMER enviada correctamente!',
                `
                <div class="text-center">
                    <i class="fas fa-check-circle fa-3x text-success mb-3"></i>
                    <p class="mb-2"><strong>Referencia:</strong> ${response.internal_reference}</p>
                    <p class="mb-3">Su solicitud ha sido enviada a todos los transportistas.</p>
                    <p class="text-muted mb-4">
                        <i class="fas fa-clock me-1"></i>
                        Las cotizaciones aparecerán en el dashboard próximamente.
                    </p>
                </div>
                `,
                {
                    showCancelButton: true,
                    confirmButtonText: '<i class="fas fa-chart-line me-1"></i> Ver Dashboard',
                    cancelButtonText: 'Nueva Solicitud',
                    customClass: {
                        confirmButton: 'btn btn-custom-primary me-2',
                        cancelButton: 'btn btn-outline-secondary'
                    }
                }
            );
            
            if (result.isConfirmed) {
                window.location.href = `dashboard.html?request_id=${response.id}`;
            } else {
                this.clearForm();
            }
            
            this.clearDraft();
            
        } catch (error) {
            Notifications.error(
                'Error al enviar solicitud GRAMMER',
                'No se pudo enviar la solicitud. Por favor intente nuevamente.'
            );
            Utils.handleError(error, 'Submit GRAMMER shipping request');
            
        } finally {
            Utils.setLoadingState(this.submitBtn, false);
            this.form.classList.remove('form-loading');
        }
    }
    
    /**
     * Valida un campo específico
     */
    validateField(event) {
        const field = event.target;
        
        if (field.checkValidity()) {
            field.classList.remove('is-invalid');
            field.classList.add('is-valid');
        } else {
            field.classList.remove('is-valid');
            field.classList.add('is-invalid');
        }
    }
    
    /**
     * Limpia el formulario
     */
    async clearForm() {
        const result = await Notifications.confirm(
            '¿Limpiar formulario?',
            'Se perderán todos los datos ingresados.',
            'Sí, limpiar'
        );
        
        if (result.isConfirmed) {
            this.form.reset();
            this.currentMethod = null;
            this.showMethodSelector();
            this.clearDraft();
            
            Notifications.toastSuccess('Formulario limpiado correctamente');
        }
    }
    
    /**
     * Carga datos del usuario
     */
    loadUserData() {
        const savedUserName = localStorage.getItem('grammerLastUserName');
        if (savedUserName) {
            this.savedUserName = savedUserName;
        }
        
        this.loadDraft();
    }
    
    /**
     * Guarda borrador
     */
    saveDraft() {
        if (this.currentMethod && this.formManager.currentFormHasData()) {
            try {
                const formData = this.formManager.collectCurrentFormData(this.form.elements);
                localStorage.setItem('grammerShippingRequestDraft', JSON.stringify({
                    method: this.currentMethod,
                    data: formData,
                    timestamp: new Date().toISOString()
                }));
                console.log('💾 Borrador GRAMMER guardado automáticamente');
            } catch (error) {
                console.warn('No se pudo guardar el borrador:', error);
            }
        }
    }
    
    /**
     * Carga borrador
     */
    loadDraft() {
        try {
            const draft = localStorage.getItem('grammerShippingRequestDraft');
            if (draft) {
                const draftData = JSON.parse(draft);
                const draftAge = new Date() - new Date(draftData.timestamp);
                
                if (draftAge < 24 * 60 * 60 * 1000) {
                    this.showDraftNotification(draftData);
                } else {
                    this.clearDraft();
                }
            }
        } catch (error) {
            console.warn('No se pudo cargar el borrador:', error);
            this.clearDraft();
        }
    }
    
    /**
     * Muestra notificación de borrador
     */
    async showDraftNotification(draftData) {
        const draftDate = Utils.formatDate(draftData.timestamp);
        
        const result = await Notifications.info(
            'Borrador GRAMMER encontrado',
            `Se encontró un borrador del método ${draftData.method} guardado el ${draftDate}. ¿Desea cargarlo?`,
            null
        );
        
        if (result.isConfirmed) {
            this.currentMethod = draftData.method;
            this.renderMethodForm(draftData.method);
            
            setTimeout(() => {
                this.fillFormFromData(draftData.data);
                Notifications.toastSuccess('Borrador GRAMMER cargado correctamente');
            }, 500);
        } else {
            this.clearDraft();
        }
    }
    
    /**
     * Llena formulario con datos del borrador
     */
    fillFormFromData(data) {
        // Llenar campos comunes
        if (data.user_name) {
            const userNameField = document.getElementById('userName');
            if (userNameField) userNameField.value = data.user_name;
        }
        
        // Llenar datos específicos del método
        if (data.method_data) {
            const methodData = data.method_data;
            Object.keys(methodData).forEach(key => {
                const field = document.querySelector(`[name="${key}"]`);
                if (field && methodData[key] !== null && methodData[key] !== undefined) {
                    field.value = methodData[key];
                }
            });
        }
    }
    
    /**
     * Limpia borrador
     */
    clearDraft() {
        localStorage.removeItem('grammerShippingRequestDraft');
    }
    
    /**
     * Maneja evento antes de salir
     */
    handleBeforeUnload(event) {
        if (this.formManager.currentFormHasData()) {
            this.saveDraft();
            event.preventDefault();
            return event.returnValue = '¿Está seguro de que desea salir? Los cambios no guardados se perderán.';
        }
    }
}

// Instancia global
let grammerForm;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    grammerForm = new GrammerShippingRequestForm();
    
    // Hacer disponible globalmente
    window.grammerForm = grammerForm;
    
    // Guardar nombre de usuario para futuras sesiones
    document.addEventListener('change', (event) => {
        if (event.target.name === 'user_name' && event.target.value.trim()) {
            localStorage.setItem('grammerLastUserName', event.target.value.trim());
        }
    });
});
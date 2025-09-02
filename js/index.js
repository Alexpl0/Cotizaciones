/**
 * JavaScript para index.html - Portal de Cotización Inteligente
 * Manejo del formulario de solicitud de cotizaciones
 * @author Alejandro Pérez
 */

import API from './modules/api.js';
import Utils from './modules/utils.js';
import Notifications from './modules/notifications.js';

class ShippingRequestForm {
    
    constructor() {
        this.form = document.getElementById('shippingRequestForm');
        this.packagesContainer = document.getElementById('packagesContainer');
        this.addPackageBtn = document.getElementById('addPackageBtn');
        this.submitBtn = document.getElementById('submitBtn');
        this.clearFormBtn = document.getElementById('clearFormBtn');
        
        this.packageCount = 0;
        this.maxPackages = CONFIG.FORMS.MAX_PACKAGES;
        
        this.init();
    }
    
    /**
     * Inicializa el formulario y sus eventos
     */
    init() {
        this.setupEventListeners();
        this.addPackage(); // Agregar el primer paquete por defecto
        this.loadUserData();
        
        console.log('💼 Formulario de cotización inicializado');
    }
    
    /**
     * Configura todos los event listeners
     */
    setupEventListeners() {
        // Envío del formulario
        this.form.addEventListener('submit', this.handleSubmit.bind(this));
        
        // Botón para agregar paquete
        this.addPackageBtn.addEventListener('click', this.addPackage.bind(this));
        
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
     * Maneja el envío del formulario
     * @param {Event} event 
     */
    async handleSubmit(event) {
        event.preventDefault();
        
        if (!this.validateForm()) {
            Notifications.warning(
                'Formulario incompleto', 
                'Por favor complete todos los campos obligatorios.'
            );
            return;
        }
        
        const formData = this.collectFormData();
        const validation = API.validateShippingRequest(formData);
        
        if (!validation.isValid) {
            Notifications.error(
                'Error de validación',
                validation.errors.join('\n')
            );
            return;
        }
        
        try {
            Utils.setLoadingState(this.submitBtn, true);
            this.form.classList.add('form-loading');
            
            const response = await API.sendShippingRequest(formData);
            
            // Mostrar modal de éxito con opciones
            const result = await Notifications.customModal(
                '¡Solicitud enviada correctamente!',
                `
                <div class="text-center">
                    <i class="fas fa-check-circle fa-3x text-success mb-3"></i>
                    <p class="mb-3">Su solicitud #${response.id} ha sido enviada a todos los transportistas.</p>
                    <p class="text-muted mb-4">
                        <i class="fas fa-clock me-1"></i>
                        Las cotizaciones comenzarán a aparecer en el dashboard en los próximos minutos.
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
                // Redirigir al dashboard con el ID de la solicitud
                window.location.href = `dashboard.html?request_id=${response.id}`;
            } else {
                // Limpiar formulario para nueva solicitud
                this.clearForm();
            }
            
            this.clearDraft();
            
        } catch (error) {
            Notifications.error(
                'Error al enviar solicitud',
                'No se pudo enviar la solicitud. Por favor intente nuevamente.'
            );
            Utils.handleError(error, 'Submit shipping request');
            
        } finally {
            Utils.setLoadingState(this.submitBtn, false);
            this.form.classList.remove('form-loading');
        }
    }
    
    /**
     * Recolecta todos los datos del formulario
     * @returns {Object}
     */
    collectFormData() {
        const formData = new FormData(this.form);
        const data = {};
        
        // Datos básicos
        data.user_name = formData.get('user_name');
        data.service_type = formData.get('service_type');
        
        // Detalles de origen
        data.origin_details = {
            country: formData.get('origin_country'),
            postal_code: formData.get('origin_postal_code'),
            address: formData.get('origin_address'),
            contact: formData.get('origin_contact') || ''
        };
        
        // Detalles de destino
        data.destination_details = {
            country: formData.get('destination_country'),
            postal_code: formData.get('destination_postal_code'),
            address: formData.get('destination_address'),
            contact: formData.get('destination_contact') || ''
        };
        
        // Detalles de paquetes
        data.package_details = [];
        const packages = this.packagesContainer.querySelectorAll('.package-item');
        
        packages.forEach((packageElement, index) => {
            const packageData = {
                description: packageElement.querySelector(`[name="package_description_${index}"]`).value,
                quantity: parseInt(packageElement.querySelector(`[name="package_quantity_${index}"]`).value),
                weight: parseFloat(packageElement.querySelector(`[name="package_weight_${index}"]`).value),
                dimensions: {
                    length: parseFloat(packageElement.querySelector(`[name="package_length_${index}"]`).value) || 0,
                    width: parseFloat(packageElement.querySelector(`[name="package_width_${index}"]`).value) || 0,
                    height: parseFloat(packageElement.querySelector(`[name="package_height_${index}"]`).value) || 0
                }
            };
            
            data.package_details.push(packageData);
        });
        
        return data;
    }
    
    /**
     * Agrega un nuevo paquete al formulario
     */
    addPackage() {
        if (this.packageCount >= this.maxPackages) {
            Notifications.warning(
                'Límite alcanzado',
                `Solo se pueden agregar hasta ${this.maxPackages} paquetes por solicitud.`
            );
            return;
        }
        
        const packageElement = this.createPackageElement(this.packageCount);
        packageElement.classList.add('adding');
        
        this.packagesContainer.appendChild(packageElement);
        this.packageCount++;
        
        this.updatePackageNumbers();
        this.updateAddPackageButton();
        
        // Focus en el primer campo del nuevo paquete
        setTimeout(() => {
            const firstInput = packageElement.querySelector('input, select, textarea');
            if (firstInput) firstInput.focus();
        }, 100);
    }
    
    /**
     * Crea un elemento de paquete
     * @param {number} index 
     * @returns {HTMLElement}
     */
    createPackageElement(index) {
        const packageDiv = document.createElement('div');
        packageDiv.className = 'package-item';
        packageDiv.dataset.packageIndex = index;
        
        packageDiv.innerHTML = `
            <div class="package-header">
                <span class="package-number">Paquete ${index + 1}</span>
                ${this.packageCount > 0 ? '<button type="button" class="remove-package-btn" aria-label="Eliminar paquete"><i class="fas fa-times"></i></button>' : ''}
            </div>
            
            <div class="row mb-3">
                <div class="col-12">
                    <label for="package_description_${index}" class="form-label">Descripción del contenido</label>
                    <textarea class="form-control form-control-custom" 
                              id="package_description_${index}" 
                              name="package_description_${index}" 
                              rows="2" 
                              required 
                              placeholder="Descripción detallada del contenido del paquete..."></textarea>
                    <div class="invalid-feedback">La descripción del paquete es obligatoria.</div>
                </div>
            </div>
            
            <div class="row mb-3">
                <div class="col-md-6">
                    <label for="package_quantity_${index}" class="form-label">Cantidad</label>
                    <input type="number" class="form-control form-control-custom" 
                           id="package_quantity_${index}" 
                           name="package_quantity_${index}" 
                           min="1" 
                           required 
                           value="1">
                    <div class="invalid-feedback">La cantidad debe ser mayor a 0.</div>
                </div>
                <div class="col-md-6">
                    <label for="package_weight_${index}" class="form-label">Peso (${CONFIG.FORMS.WEIGHT_UNIT})</label>
                    <input type="number" class="form-control form-control-custom" 
                           id="package_weight_${index}" 
                           name="package_weight_${index}" 
                           step="0.1" 
                           min="0.1" 
                           required 
                           placeholder="0.0">
                    <div class="invalid-feedback">El peso debe ser mayor a 0.</div>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-4">
                    <label for="package_length_${index}" class="form-label">Largo (${CONFIG.FORMS.DIMENSION_UNIT})</label>
                    <input type="number" class="form-control form-control-custom" 
                           id="package_length_${index}" 
                           name="package_length_${index}" 
                           step="0.1" 
                           min="0" 
                           placeholder="0.0">
                </div>
                <div class="col-md-4">
                    <label for="package_width_${index}" class="form-label">Ancho (${CONFIG.FORMS.DIMENSION_UNIT})</label>
                    <input type="number" class="form-control form-control-custom" 
                           id="package_width_${index}" 
                           name="package_width_${index}" 
                           step="0.1" 
                           min="0" 
                           placeholder="0.0">
                </div>
                <div class="col-md-4">
                    <label for="package_height_${index}" class="form-label">Alto (${CONFIG.FORMS.DIMENSION_UNIT})</label>
                    <input type="number" class="form-control form-control-custom" 
                           id="package_height_${index}" 
                           name="package_height_${index}" 
                           step="0.1" 
                           min="0" 
                           placeholder="0.0">
                </div>
            </div>
        `;
        
        // Agregar evento de eliminación
        const removeBtn = packageDiv.querySelector('.remove-package-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => this.removePackage(packageDiv));
        }
        
        return packageDiv;
    }
    
    /**
     * Elimina un paquete
     * @param {HTMLElement} packageElement 
     */
    async removePackage(packageElement) {
        if (this.packageCount <= 1) {
            Notifications.info(
                'Información',
                'Debe mantener al menos un paquete en la solicitud.'
            );
            return;
        }
        
        const result = await Notifications.confirm(
            '¿Eliminar paquete?',
            'Se eliminará este paquete y toda su información.',
            'Sí, eliminar'
        );
        
        if (result.isConfirmed) {
            packageElement.classList.add('removing');
            
            setTimeout(() => {
                packageElement.remove();
                this.packageCount--;
                this.updatePackageNumbers();
                this.updateAddPackageButton();
            }, 300);
        }
    }
    
    /**
     * Actualiza la numeración de los paquetes
     */
    updatePackageNumbers() {
        const packages = this.packagesContainer.querySelectorAll('.package-item');
        packages.forEach((packageElement, index) => {
            const numberSpan = packageElement.querySelector('.package-number');
            if (numberSpan) {
                numberSpan.textContent = `Paquete ${index + 1}`;
            }
            packageElement.dataset.packageIndex = index;
        });
    }
    
    /**
     * Actualiza el estado del botón agregar paquete
     */
    updateAddPackageButton() {
        if (this.packageCount >= this.maxPackages) {
            this.addPackageBtn.disabled = true;
            this.addPackageBtn.innerHTML = '<i class="fas fa-exclamation-triangle me-1"></i>Límite alcanzado';
        } else {
            this.addPackageBtn.disabled = false;
            this.addPackageBtn.innerHTML = '<i class="fas fa-plus me-1"></i>Añadir Paquete';
        }
    }
    
    /**
     * Valida el formulario completo
     * @returns {boolean}
     */
    validateForm() {
        const isValid = Utils.validateForm(this.form);
        
        // Validación adicional para paquetes
        const packages = this.packagesContainer.querySelectorAll('.package-item');
        if (packages.length === 0) {
            Notifications.warning('Error de validación', 'Debe agregar al menos un paquete.');
            return false;
        }
        
        return isValid;
    }
    
    /**
     * Valida un campo específico
     * @param {Event} event 
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
            
            // Limpiar clases de validación
            this.form.querySelectorAll('.is-valid, .is-invalid').forEach(element => {
                element.classList.remove('is-valid', 'is-invalid');
            });
            
            // Limpiar paquetes y agregar uno nuevo
            this.packagesContainer.innerHTML = '';
            this.packageCount = 0;
            this.addPackage();
            
            // Limpiar borrador
            this.clearDraft();
            
            // Focus en el primer campo
            const firstInput = this.form.querySelector('input, select, textarea');
            if (firstInput) firstInput.focus();
            
            Notifications.toastSuccess('Formulario limpiado correctamente');
        }
    }
    
    /**
     * Carga datos del usuario si están disponibles
     */
    loadUserData() {
        // Intentar cargar el nombre del usuario desde localStorage o sesión previa
        const savedUserName = localStorage.getItem('lastUserName');
        if (savedUserName) {
            document.getElementById('userName').value = savedUserName;
        }
        
        // Cargar borrador si existe
        this.loadDraft();
    }
    
    /**
     * Guarda un borrador del formulario
     */
    saveDraft() {
        if (this.hasFormData()) {
            try {
                const formData = this.collectFormData();
                localStorage.setItem('shippingRequestDraft', JSON.stringify({
                    data: formData,
                    timestamp: new Date().toISOString()
                }));
                console.log('💾 Borrador guardado automáticamente');
            } catch (error) {
                console.warn('No se pudo guardar el borrador:', error);
            }
        }
    }
    
    /**
     * Carga un borrador del formulario
     */
    loadDraft() {
        try {
            const draft = localStorage.getItem('shippingRequestDraft');
            if (draft) {
                const draftData = JSON.parse(draft);
                const draftAge = new Date() - new Date(draftData.timestamp);
                
                // Solo cargar borradores de menos de 24 horas
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
     * Muestra notificación de borrador disponible
     * @param {Object} draftData 
     */
    async showDraftNotification(draftData) {
        const draftDate = Utils.formatDate(draftData.timestamp);
        
        const result = await Notifications.info(
            'Borrador encontrado',
            `Se encontró un borrador guardado el ${draftDate}. ¿Desea cargarlo?`,
            null
        );
        
        if (result.isConfirmed) {
            this.fillFormFromData(draftData.data);
            Notifications.toastSuccess('Borrador cargado correctamente');
        } else {
            this.clearDraft();
        }
    }
    
    /**
     * Llena el formulario con datos específicos
     * @param {Object} data 
     */
    fillFormFromData(data) {
        // Datos básicos
        if (data.user_name) document.getElementById('userName').value = data.user_name;
        if (data.service_type) document.querySelector(`input[value="${data.service_type}"]`).checked = true;
        
        // Origen
        if (data.origin_details) {
            const origin = data.origin_details;
            if (origin.country) document.getElementById('originCountry').value = origin.country;
            if (origin.postal_code) document.getElementById('originPostalCode').value = origin.postal_code;
            if (origin.address) document.getElementById('originAddress').value = origin.address;
            if (origin.contact) document.getElementById('originContact').value = origin.contact;
        }
        
        // Destino
        if (data.destination_details) {
            const destination = data.destination_details;
            if (destination.country) document.getElementById('destinationCountry').value = destination.country;
            if (destination.postal_code) document.getElementById('destinationPostalCode').value = destination.postal_code;
            if (destination.address) document.getElementById('destinationAddress').value = destination.address;
            if (destination.contact) document.getElementById('destinationContact').value = destination.contact;
        }
        
        // Paquetes
        if (data.package_details && data.package_details.length > 0) {
            // Limpiar paquetes existentes
            this.packagesContainer.innerHTML = '';
            this.packageCount = 0;
            
            // Agregar paquetes del borrador
            data.package_details.forEach((pkg, index) => {
                this.addPackage();
                const packageElement = this.packagesContainer.children[index];
                
                if (pkg.description) packageElement.querySelector(`[name="package_description_${index}"]`).value = pkg.description;
                if (pkg.quantity) packageElement.querySelector(`[name="package_quantity_${index}"]`).value = pkg.quantity;
                if (pkg.weight) packageElement.querySelector(`[name="package_weight_${index}"]`).value = pkg.weight;
                if (pkg.dimensions) {
                    if (pkg.dimensions.length) packageElement.querySelector(`[name="package_length_${index}"]`).value = pkg.dimensions.length;
                    if (pkg.dimensions.width) packageElement.querySelector(`[name="package_width_${index}"]`).value = pkg.dimensions.width;
                    if (pkg.dimensions.height) packageElement.querySelector(`[name="package_height_${index}"]`).value = pkg.dimensions.height;
                }
            });
        }
    }
    
    /**
     * Elimina el borrador guardado
     */
    clearDraft() {
        localStorage.removeItem('shippingRequestDraft');
    }
    
    /**
     * Verifica si el formulario tiene datos
     * @returns {boolean}
     */
    hasFormData() {
        const formData = new FormData(this.form);
        for (const [key, value] of formData) {
            if (value && value.toString().trim() !== '') {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Maneja el evento antes de salir de la página
     * @param {Event} event 
     */
    handleBeforeUnload(event) {
        if (this.hasFormData()) {
            this.saveDraft();
            // Mostrar confirmación del navegador
            event.preventDefault();
            return event.returnValue = '¿Está seguro de que desea salir? Los cambios no guardados se perderán.';
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new ShippingRequestForm();
    
    // Guardar el nombre del usuario para futuras sesiones
    document.getElementById('userName').addEventListener('blur', (event) => {
        if (event.target.value.trim()) {
            localStorage.setItem('lastUserName', event.target.value.trim());
        }
    });
});
/**
 * Clase base para todos los formularios de envío GRAMMER
 * @author Alejandro Pérez
 */

import Utils from '../modules/utils.js';
import Notifications from '../modules/notifications.js';

export default class BaseForm {
    constructor() {
        this.form = document.getElementById('shippingRequestForm');
        this.formContainer = document.getElementById('dynamicFormContainer');
        this.submitBtn = document.getElementById('submitBtn');
        this.clearFormBtn = document.getElementById('clearFormBtn');
        
        this.currentMethod = null;
        this.formData = {};
    }

    /**
     * Configura validación básica de campos
     */
    setupBasicValidation() {
        // Configurar fechas mínimas
        const today = new Date().toISOString().split('T')[0];
        const pickupDateField = document.getElementById('pickupDate');
        if (pickupDateField) {
            pickupDateField.min = today;
        }
        
        const deliveryDateField = document.getElementById('deliveryDatePlant');
        if (deliveryDateField) {
            deliveryDateField.min = today;
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
     * Genera sección de usuario solicitante común a todos los formularios
     */
    generateUserSection() {
        return `
            <!-- Usuario Solicitante -->
            <div class="section-header mb-3">
                <h4 class="text-primary">
                    <i class="fas fa-user me-2"></i>
                    Usuario Solicitante
                </h4>
                <hr>
            </div>
            
            <div class="row mb-4">
                <div class="col-md-6">
                    <label for="userName" class="form-label">Nombre del Solicitante</label>
                    <input type="text" class="form-control form-control-custom" 
                           id="userName" name="user_name" required>
                    <div class="invalid-feedback">Por favor ingrese el nombre del solicitante.</div>
                </div>
                <div class="col-md-6">
                    <label for="companyArea" class="form-label">Área</label>
                    <input type="text" class="form-control form-control-custom" 
                           id="companyArea" name="company_area" value="Logística y Tráfico" readonly>
                </div>
            </div>
        `;
    }

    /**
     * Valida el formulario según el método actual
     */
    validateForm() {
        if (!this.currentMethod) return false;
        
        const form = this.form.querySelector('.method-form-container');
        if (!form) return false;
        
        return Utils.validateForm(form);
    }

    /**
     * Verifica si hay datos en el formulario
     */
    hasFormData() {
        if (!this.currentMethod) return false;
        
        const inputs = this.form.querySelectorAll('input, select, textarea');
        for (const input of inputs) {
            if (input.value && input.value.trim() !== '' && !input.readOnly) {
                return true;
            }
        }
        return false;
    }
}
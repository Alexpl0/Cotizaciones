/**
 * Gestor principal de formularios GRAMMER
 * @author Alejandro Pérez
 */

import FedexForm from './FedexForm.js';
import AereoMaritimoForm from './AereoMaritimoForm.js';
import NacionalForm from './NacionalForm.js';

export default class FormManager {
    constructor() {
        this.forms = {
            fedex: new FedexForm(),
            aereo_maritimo: new AereoMaritimoForm(),
            nacional: new NacionalForm()
        };
        
        this.currentForm = null;
        this.currentMethod = null;
    }

    /**
     * Obtiene la instancia del formulario según el método
     */
    getForm(method) {
        return this.forms[method] || null;
    }

    /**
     * Renderiza el formulario del método seleccionado
     */
    renderForm(method, container) {
        const form = this.getForm(method);
        if (!form) {
            console.error('Método no reconocido:', method);
            return false;
        }

        this.currentForm = form;
        this.currentMethod = method;

        const formHTML = form.generateForm();
        
        container.innerHTML = `
            <div class="method-form-container" style="animation: slideInUp 0.4s ease-out;">
                <div class="method-header mb-4">
                    <button type="button" class="btn btn-outline-secondary btn-sm" onclick="grammerForm.showMethodSelector()">
                        <i class="fas fa-arrow-left me-1"></i>Cambiar Método
                    </button>
                    <h3 class="text-primary mt-2">${this.getMethodTitle(method)}</h3>
                </div>
                ${formHTML}
            </div>
        `;

        // Inicializar componentes específicos
        setTimeout(() => {
            form.initializeComponents();
        }, 100);

        return true;
    }

    /**
     * Colecta datos del formulario actual
     */
    collectCurrentFormData(formElements) {
        if (!this.currentForm) return null;

        return {
            shipping_method: this.currentMethod,
            user_name: formElements.user_name.value,
            company_area: formElements.company_area.value,
            method_data: this.currentForm.collectData(formElements)
        };
    }

    /**
     * Valida el formulario actual
     */
    validateCurrentForm() {
        return this.currentForm ? this.currentForm.validateForm() : false;
    }

    /**
     * Verifica si el formulario actual tiene datos
     */
    currentFormHasData() {
        return this.currentForm ? this.currentForm.hasFormData() : false;
    }

    /**
     * Obtiene el título del método
     */
    getMethodTitle(method) {
        const titles = {
            fedex: 'Fedex Express - Envío Urgente',
            aereo_maritimo: 'Aéreo-Marítimo - Internacional',
            nacional: 'Nacional - Envío Doméstico'
        };
        return titles[method] || method;
    }
}
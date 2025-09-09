/**
 * Formulario específico para envíos Fedex Express
 * @author Alejandro Pérez
 */

import BaseForm from './BaseForm.js';

export default class FedexForm extends BaseForm {
    constructor() {
        super();
    }

    /**
     * Genera el formulario completo para Fedex
     */
    generateForm() {
        return `
            ${this.generateUserSection()}
            
            <!-- 1. Información de Origen -->
            <div class="section-header mb-3">
                <h4 class="text-primary">
                    <i class="fas fa-building me-2"></i>
                    1. Información de Origen
                </h4>
                <hr>
            </div>
            
            <div class="row mb-3">
                <div class="col-md-6">
                    <label for="originCompanyName" class="form-label">Nombre de la empresa</label>
                    <input type="text" class="form-control form-control-custom" 
                           id="originCompanyName" name="origin_company_name" required>
                    <div class="invalid-feedback">Ingrese el nombre de la empresa origen.</div>
                </div>
                <div class="col-md-6">
                    <label for="originContactName" class="form-label">Nombre de quién envía</label>
                    <input type="text" class="form-control form-control-custom" 
                           id="originContactName" name="origin_contact_name" required>
                    <div class="invalid-feedback">Ingrese el nombre del contacto.</div>
                </div>
            </div>
            
            <div class="mb-3">
                <label for="originAddress" class="form-label">Dirección</label>
                <textarea class="form-control form-control-custom" 
                          id="originAddress" name="origin_address" rows="2" required 
                          placeholder="Dirección completa de origen..."></textarea>
                <div class="invalid-feedback">Ingrese la dirección de origen.</div>
            </div>
            
            <div class="row mb-4">
                <div class="col-md-6">
                    <label for="originContactPhone" class="form-label">Teléfono de contacto</label>
                    <input type="tel" class="form-control form-control-custom" 
                           id="originContactPhone" name="origin_contact_phone">
                </div>
                <div class="col-md-6">
                    <label for="originContactEmail" class="form-label">Correo de contacto</label>
                    <input type="email" class="form-control form-control-custom" 
                           id="originContactEmail" name="origin_contact_email">
                </div>
            </div>
            
            <!-- 2. Información de Destino -->
            <div class="section-header mb-3">
                <h4 class="text-primary">
                    <i class="fas fa-map-marker-alt me-2"></i>
                    2. Información de Destino
                </h4>
                <hr>
            </div>
            
            <div class="row mb-3">
                <div class="col-md-6">
                    <label for="destCompanyName" class="form-label">Nombre de la empresa</label>
                    <input type="text" class="form-control form-control-custom" 
                           id="destCompanyName" name="destination_company_name" required>
                    <div class="invalid-feedback">Ingrese el nombre de la empresa destino.</div>
                </div>
                <div class="col-md-6">
                    <label for="destContactName" class="form-label">Nombre de quien recibe</label>
                    <input type="text" class="form-control form-control-custom" 
                           id="destContactName" name="destination_contact_name" required>
                    <div class="invalid-feedback">Ingrese el nombre del contacto.</div>
                </div>
            </div>
            
            <div class="mb-3">
                <label for="destinationAddress" class="form-label">Dirección</label>
                <textarea class="form-control form-control-custom" 
                          id="destinationAddress" name="destination_address" rows="2" required 
                          placeholder="Dirección completa de destino..."></textarea>
                <div class="invalid-feedback">Ingrese la dirección de destino.</div>
            </div>
            
            <div class="row mb-4">
                <div class="col-md-6">
                    <label for="destContactPhone" class="form-label">Teléfono de contacto</label>
                    <input type="tel" class="form-control form-control-custom" 
                           id="destContactPhone" name="destination_contact_phone">
                </div>
                <div class="col-md-6">
                    <label for="destContactEmail" class="form-label">Correo de contacto</label>
                    <input type="email" class="form-control form-control-custom" 
                           id="destContactEmail" name="destination_contact_email">
                </div>
            </div>
            
            <!-- 3. Embalaje -->
            <div class="section-header mb-3">
                <h4 class="text-primary">
                    <i class="fas fa-boxes me-2"></i>
                    3. Embalaje
                </h4>
                <hr>
            </div>
            
            <div class="row mb-3">
                <div class="col-md-4">
                    <label for="totalPackages" class="form-label">Total de paquetes a enviar</label>
                    <input type="number" class="form-control form-control-custom" 
                           id="totalPackages" name="total_packages" min="1" required value="1">
                    <div class="invalid-feedback">Ingrese el total de paquetes.</div>
                </div>
                <div class="col-md-4">
                    <label for="totalWeight" class="form-label">Peso total (kg)</label>
                    <input type="number" class="form-control form-control-custom" 
                           id="totalWeight" name="total_weight" step="0.1" min="0.1" required>
                    <div class="invalid-feedback">Ingrese el peso total.</div>
                </div>
                <div class="col-md-4">
                    <label for="measurementUnits" class="form-label">Unidades de medida</label>
                    <select class="form-select form-control-custom" 
                            id="measurementUnits" name="measurement_units">
                        <option value="cm/kg">Centímetros / Kilogramos</option>
                        <option value="in/lb">Pulgadas / Libras</option>
                        <option value="m/kg">Metros / Kilogramos</option>
                    </select>
                </div>
            </div>
            
            <div class="mb-4">
                <label for="packageDimensions" class="form-label">Dimensiones de la caja o pallet</label>
                <textarea class="form-control form-control-custom" 
                          id="packageDimensions" name="package_dimensions" rows="2" 
                          placeholder="Ej: 100 x 80 x 60 cm, pallet estándar, cajas individuales, etc."></textarea>
            </div>
            
            <!-- 4. Detalles de Envío -->
            <div class="section-header mb-3">
                <h4 class="text-primary">
                    <i class="fas fa-clipboard-list me-2"></i>
                    4. Detalles de Envío
                </h4>
                <hr>
            </div>
            
            <div class="mb-3">
                <label for="orderNumber" class="form-label">
                    Orden o centro de costos a la cual se va a cargar (Si es a cuenta de GRAMMER)
                </label>
                <input type="text" class="form-control form-control-custom" 
                       id="orderNumber" name="order_number" 
                       placeholder="Número de orden o centro de costos">
            </div>
            
            <div class="mb-3">
                <label for="merchandiseDescription" class="form-label">Descripción detallada de la mercancía</label>
                <textarea class="form-control form-control-custom" 
                          id="merchandiseDescription" name="merchandise_description" 
                          rows="3" required 
                          placeholder="Describa detalladamente qué se está enviando..."></textarea>
                <div class="invalid-feedback">La descripción de la mercancía es obligatoria.</div>
            </div>
            
            <div class="row mb-4">
                <div class="col-md-6">
                    <label for="merchandiseType" class="form-label">¿Qué es?</label>
                    <input type="text" class="form-control form-control-custom" 
                           id="merchandiseType" name="merchandise_type" 
                           placeholder="Ej: Repuestos automotrices, documentos, etc.">
                </div>
                <div class="col-md-6">
                    <label for="merchandiseMaterial" class="form-label">¿De qué está hecho?</label>
                    <input type="text" class="form-control form-control-custom" 
                           id="merchandiseMaterial" name="merchandise_material" 
                           placeholder="Ej: Metal, plástico, papel, etc.">
                </div>
            </div>
        `;
    }

    /**
     * Inicializa componentes específicos de Fedex
     */
    initializeComponents() {
        this.setupBasicValidation();
        // Cualquier lógica específica de Fedex aquí
    }

    /**
     * Colecta datos específicos de Fedex
     */
    collectData(formElements) {
        return {
            origin_company_name: formElements.origin_company_name.value,
            origin_address: formElements.origin_address.value,
            origin_contact_name: formElements.origin_contact_name.value,
            origin_contact_phone: formElements.origin_contact_phone?.value || '',
            origin_contact_email: formElements.origin_contact_email?.value || '',
            
            destination_company_name: formElements.destination_company_name.value,
            destination_address: formElements.destination_address.value,
            destination_contact_name: formElements.destination_contact_name.value,
            destination_contact_phone: formElements.destination_contact_phone?.value || '',
            destination_contact_email: formElements.destination_contact_email?.value || '',
            
            total_packages: parseInt(formElements.total_packages.value),
            total_weight: parseFloat(formElements.total_weight.value),
            measurement_units: formElements.measurement_units.value,
            package_dimensions: formElements.package_dimensions?.value || '',
            
            order_number: formElements.order_number?.value || '',
            merchandise_description: formElements.merchandise_description.value,
            merchandise_type: formElements.merchandise_type?.value || '',
            merchandise_material: formElements.merchandise_material?.value || ''
        };
    }
}
/**
 * Formulario específico para envíos Aéreo-Marítimo
 * @author Alejandro Pérez
 */

import BaseForm from './BaseForm.js';

export default class AereoMaritimoForm extends BaseForm {
    constructor() {
        super();
    }

    /**
     * Genera el formulario completo para Aéreo-Marítimo
     */
    generateForm() {
        return `
            ${this.generateUserSection()}
            
            <!-- Unidades -->
            <div class="section-header mb-3">
                <h4 class="text-primary">
                    <i class="fas fa-cubes me-2"></i>
                    Unidades de Carga
                </h4>
                <hr>
            </div>
            
            <div class="row mb-3">
                <div class="col-md-4">
                    <label for="totalPallets" class="form-label">Total de Pallets</label>
                    <input type="number" class="form-control form-control-custom" 
                           id="totalPallets" name="total_pallets" min="0" value="0">
                </div>
                <div class="col-md-4">
                    <label for="totalBoxes" class="form-label">Total de Cajas</label>
                    <input type="number" class="form-control form-control-custom" 
                           id="totalBoxes" name="total_boxes" min="0" value="0">
                </div>
                <div class="col-md-4">
                    <label for="weightPerUnit" class="form-label">Peso por unidad (kg)</label>
                    <input type="number" class="form-control form-control-custom" 
                           id="weightPerUnit" name="weight_per_unit" step="0.1" min="0.1" required>
                    <div class="invalid-feedback">Ingrese el peso por unidad.</div>
                </div>
            </div>
            
            <!-- Dimensiones por Unidad -->
            <div class="section-header mb-3">
                <h4 class="text-primary">
                    <i class="fas fa-ruler-combined me-2"></i>
                    Dimensiones por Unidad
                </h4>
                <hr>
            </div>
            
            <div class="row mb-4">
                <div class="col-md-4">
                    <label for="unitLength" class="form-label">Largo (cm)</label>
                    <input type="number" class="form-control form-control-custom" 
                           id="unitLength" name="unit_length" step="0.1" min="0">
                </div>
                <div class="col-md-4">
                    <label for="unitWidth" class="form-label">Ancho (cm)</label>
                    <input type="number" class="form-control form-control-custom" 
                           id="unitWidth" name="unit_width" step="0.1" min="0">
                </div>
                <div class="col-md-4">
                    <label for="unitHeight" class="form-label">Alto (cm)</label>
                    <input type="number" class="form-control form-control-custom" 
                           id="unitHeight" name="unit_height" step="0.1" min="0">
                </div>
            </div>
            
            <!-- Recolección -->
            <div class="section-header mb-3">
                <h4 class="text-primary">
                    <i class="fas fa-calendar-alt me-2"></i>
                    Información de Recolección
                </h4>
                <hr>
            </div>
            
            <div class="row mb-3">
                <div class="col-md-4">
                    <label for="pickupDate" class="form-label">Fecha de Recolección</label>
                    <input type="date" class="form-control form-control-custom" 
                           id="pickupDate" name="pickup_date" required>
                    <div class="invalid-feedback">Seleccione la fecha de recolección.</div>
                </div>
                <div class="col-md-4">
                    <label for="shipHoursStart" class="form-label">Horario Inicial</label>
                    <input type="time" class="form-control form-control-custom" 
                           id="shipHoursStart" name="ship_hours_start">
                </div>
                <div class="col-md-4">
                    <label for="shipHoursEnd" class="form-label">Horario Final</label>
                    <input type="time" class="form-control form-control-custom" 
                           id="shipHoursEnd" name="ship_hours_end">
                </div>
            </div>
            
            <div class="mb-4">
                <label for="pickupAddress" class="form-label">Dirección de Recolección</label>
                <textarea class="form-control form-control-custom" 
                          id="pickupAddress" name="pickup_address" rows="2" required 
                          placeholder="Dirección completa donde se recogerá la mercancía..."></textarea>
                <div class="invalid-feedback">Ingrese la dirección de recolección.</div>
            </div>
            
            <!-- Contacto -->
            <div class="section-header mb-3">
                <h4 class="text-primary">
                    <i class="fas fa-address-book me-2"></i>
                    Información de Contacto
                </h4>
                <hr>
            </div>
            
            <div class="row mb-4">
                <div class="col-md-6">
                    <label for="contactName" class="form-label">Nombre del Contacto</label>
                    <input type="text" class="form-control form-control-custom" 
                           id="contactName" name="contact_name" required>
                    <div class="invalid-feedback">Ingrese el nombre del contacto.</div>
                </div>
                <div class="col-md-6">
                    <label for="contactPhone" class="form-label">Teléfono</label>
                    <input type="tel" class="form-control form-control-custom" 
                           id="contactPhone" name="contact_phone">
                </div>
            </div>
            
            <!-- INCOTERM y Destino -->
            <div class="section-header mb-3">
                <h4 class="text-primary">
                    <i class="fas fa-globe-americas me-2"></i>
                    INCOTERM y Destino
                </h4>
                <hr>
            </div>
            
            <div class="row mb-3">
                <div class="col-md-6">
                    <label for="incoterm" class="form-label">INCOTERM</label>
                    <select class="form-select form-control-custom" 
                            id="incoterm" name="incoterm" required>
                        <option value="">Seleccionar INCOTERM...</option>
                        <option value="EXW">EXW - Ex Works</option>
                        <option value="FCA">FCA - Free Carrier</option>
                        <option value="FAS">FAS - Free Alongside Ship</option>
                        <option value="FOB">FOB - Free On Board</option>
                        <option value="CFR">CFR - Cost and Freight</option>
                        <option value="CIF">CIF - Cost Insurance & Freight</option>
                        <option value="CPT">CPT - Carriage Paid To</option>
                        <option value="CIP">CIP - Carriage and Insurance Paid to</option>
                        <option value="DAP">DAP - Delivered at Place</option>
                        <option value="DPU">DPU - Delivered at Place Unloaded</option>
                    </select>
                    <div class="invalid-feedback">Seleccione un INCOTERM.</div>
                </div>
                <div class="col-md-6">
                    <label for="deliveryType" class="form-label">Tipo de Entrega</label>
                    <select class="form-select form-control-custom" 
                            id="deliveryType" name="delivery_type">
                        <option value="">Seleccionar tipo...</option>
                        <option value="airport">Aeropuerto</option>
                        <option value="port">Puerto</option>
                    </select>
                </div>
            </div>
            
            <div class="row mb-4">
                <div class="col-md-6">
                    <label for="deliveryPlace" class="form-label">Lugar de Entrega</label>
                    <textarea class="form-control form-control-custom" 
                              id="deliveryPlace" name="delivery_place" rows="2" required 
                              placeholder="Dirección o puerto/aeropuerto de destino..."></textarea>
                    <div class="invalid-feedback">Ingrese el lugar de entrega.</div>
                </div>
                <div class="col-md-6">
                    <div class="mb-3">
                        <label for="deliveryDatePlant" class="form-label">Fecha de Entrega en Planta</label>
                        <input type="date" class="form-control form-control-custom" 
                               id="deliveryDatePlant" name="delivery_date_plant">
                    </div>
                    <div>
                        <label for="orderNumber" class="form-label">Número de Orden</label>
                        <input type="text" class="form-control form-control-custom" 
                               id="orderNumber" name="order_number" 
                               placeholder="Número de orden GRAMMER">
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Inicializa componentes específicos de Aéreo-Marítimo
     */
    initializeComponents() {
        this.setupBasicValidation();
        this.setupUnitsValidation();
    }

    /**
     * Configura validación de unidades (pallets/cajas)
     */
    setupUnitsValidation() {
        const palletsField = document.getElementById('totalPallets');
        const boxesField = document.getElementById('totalBoxes');
        
        if (palletsField && boxesField) {
            const validateUnits = () => {
                const pallets = parseInt(palletsField.value) || 0;
                const boxes = parseInt(boxesField.value) || 0;
                
                if (pallets === 0 && boxes === 0) {
                    palletsField.setCustomValidity('Debe especificar al menos 1 pallet o 1 caja');
                    boxesField.setCustomValidity('Debe especificar al menos 1 pallet o 1 caja');
                } else {
                    palletsField.setCustomValidity('');
                    boxesField.setCustomValidity('');
                }
            };
            
            palletsField.addEventListener('input', validateUnits);
            boxesField.addEventListener('input', validateUnits);
        }
    }

    /**
     * Colecta datos específicos de Aéreo-Marítimo
     */
    collectData(formElements) {
        return {
            total_pallets: parseInt(formElements.total_pallets.value) || 0,
            total_boxes: parseInt(formElements.total_boxes.value) || 0,
            weight_per_unit: parseFloat(formElements.weight_per_unit.value),
            
            unit_length: parseFloat(formElements.unit_length?.value) || 0,
            unit_width: parseFloat(formElements.unit_width?.value) || 0,
            unit_height: parseFloat(formElements.unit_height?.value) || 0,
            
            pickup_date: formElements.pickup_date.value,
            pickup_address: formElements.pickup_address.value,
            ship_hours_start: formElements.ship_hours_start?.value || null,
            ship_hours_end: formElements.ship_hours_end?.value || null,
            
            contact_name: formElements.contact_name.value,
            contact_phone: formElements.contact_phone?.value || '',
            
            incoterm: formElements.incoterm.value,
            delivery_type: formElements.delivery_type?.value || null,
            delivery_place: formElements.delivery_place.value,
            delivery_date_plant: formElements.delivery_date_plant?.value || null,
            order_number: formElements.order_number?.value || ''
        };
    }
}
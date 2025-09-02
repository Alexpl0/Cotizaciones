/**
 * JavaScript para index.html - Portal de Cotización GRAMMER Logística
 * Manejo del formulario con múltiples métodos de envío
 * @author Alejandro Pérez
 */

import API from './modules/api.js';
import Utils from './modules/utils.js';
import Notifications from './modules/notifications.js';

class GrammerShippingRequestForm {
    
    constructor() {
        this.form = document.getElementById('shippingRequestForm');
        this.methodSelector = document.getElementById('shippingMethodSelector');
        this.formContainer = document.getElementById('dynamicFormContainer');
        this.submitBtn = document.getElementById('submitBtn');
        this.clearFormBtn = document.getElementById('clearFormBtn');
        
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
        let formHTML = '';
        
        switch (method) {
            case 'fedex':
                formHTML = this.generateFedexForm();
                break;
            case 'aereo_maritimo':
                formHTML = this.generateAereoMaritimoForm();
                break;
            case 'nacional':
                formHTML = this.generateNacionalForm();
                break;
            default:
                console.error('Método no reconocido:', method);
                return;
        }
        
        this.formContainer.innerHTML = `
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
        
        // Inicializar componentes específicos del método
        this.initializeMethodSpecificComponents(method);
    }
    
    /**
     * Genera formulario para Fedex
     */
    generateFedexForm() {
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
     * Genera formulario para Aéreo-Marítimo
     */
    generateAereoMaritimoForm() {
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
     * Genera formulario para Nacional
     */
    generateNacionalForm() {
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
            
            <!-- Destino (Fijo para GRAMMER) -->
            <div class="section-header mb-3">
                <h4 class="text-primary">
                    <i class="fas fa-map-marker-alt me-2"></i>
                    Destino - Planta GRAMMER
                </h4>
                <hr>
            </div>
            
            <div class="alert alert-info mb-3">
                <i class="fas fa-info-circle me-2"></i>
                <strong>Entrega Fija:</strong> Todos los envíos nacionales se entregan en la planta GRAMMER Querétaro.
            </div>
            
            <div class="row mb-4">
                <div class="col-md-8">
                    <label for="deliveryPlace" class="form-label">Lugar de Entrega</label>
                    <textarea class="form-control form-control-custom" 
                              id="deliveryPlace" name="delivery_place" rows="2" readonly
                              style="background-color: #f8f9fa;">Av. de la luz #24 int. 3 y 4 Acceso III. Parque Ind. Benito Juárez 76120, Querétaro. México</textarea>
                </div>
                <div class="col-md-4">
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
    
    /**
     * Inicializa componentes específicos del método
     */
    initializeMethodSpecificComponents(method) {
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
        
        // Para método nacional, pre-llenar dirección de entrega
        if (method === 'nacional') {
            const deliveryPlace = document.getElementById('deliveryPlace');
            if (deliveryPlace) {
                deliveryPlace.value = 'Av. de la luz #24 int. 3 y 4 Acceso III. Parque Ind. Benito Juárez 76120, Querétaro. México';
            }
        }
        
        // Validación especial para unidades (pallets vs cajas)
        if (method === 'aereo_maritimo' || method === 'nacional') {
            this.setupUnitsValidation();
        }
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
     * Maneja el envío del formulario
     */
    async handleSubmit(event) {
        event.preventDefault();
        
        if (!this.currentMethod) {
            Notifications.error('Error', 'Debe seleccionar un método de envío.');
            return;
        }
        
        if (!this.validateForm()) {
            Notifications.warning(
                'Formulario incompleto', 
                'Por favor complete todos los campos obligatorios.'
            );
            return;
        }
        
        const formData = this.collectFormData();
        
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
     * Recolecta todos los datos del formulario según el método
     */
    collectFormData() {
        const formElements = this.form.elements;
        const data = {
            shipping_method: this.currentMethod,
            user_name: formElements.user_name.value,
            company_area: formElements.company_area.value
        };
        
        // Datos específicos según el método
        switch (this.currentMethod) {
            case 'fedex':
                data.method_data = {
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
                break;
                
            case 'aereo_maritimo':
            case 'nacional':
                data.method_data = {
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
                    
                    delivery_place: formElements.delivery_place.value,
                    delivery_date_plant: formElements.delivery_date_plant?.value || null,
                    order_number: formElements.order_number?.value || ''
                };
                
                // Campos específicos de aéreo-marítimo
                if (this.currentMethod === 'aereo_maritimo') {
                    data.method_data.incoterm = formElements.incoterm.value;
                    data.method_data.delivery_type = formElements.delivery_type?.value || null;
                }
                break;
        }
        
        return data;
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
            // Se llenará cuando se renderice el formulario
            this.savedUserName = savedUserName;
        }
        
        this.loadDraft();
    }
    
    /**
     * Guarda borrador
     */
    saveDraft() {
        if (this.currentMethod && this.hasFormData()) {
            try {
                const formData = this.collectFormData();
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
    
    /**
     * Maneja evento antes de salir
     */
    handleBeforeUnload(event) {
        if (this.hasFormData()) {
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
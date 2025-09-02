<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Portal de Cotización Inteligente</title>
    
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/css/bootstrap.min.css" rel="stylesheet">
    
    <!-- FontAwesome Icons -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    
    <!-- SweetAlert2 -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/limonte-sweetalert2/11.10.1/sweetalert2.min.css" rel="stylesheet">
    
    <!-- Estilos personalizados -->
    <link href="css/style.css" rel="stylesheet">
    <link href="css/index.css" rel="stylesheet">
</head>
<body>
    <!-- Header -->
    <header class="bg-primary text-white py-3 shadow-sm">
        <div class="container">
            <div class="row align-items-center">
                <div class="col-md-8">
                    <h1 class="h3 mb-0">
                        <i class="fas fa-shipping-fast me-2"></i>
                        Portal de Cotización Inteligente
                    </h1>
                    <small class="opacity-75">Gestión automatizada de cotizaciones de envío</small>
                </div>
                <div class="col-md-4 text-md-end">
                    <a href="dashboard.html" class="btn btn-light btn-sm">
                        <i class="fas fa-chart-line me-1"></i>
                        Ver Dashboard
                    </a>
                </div>
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main class="container py-4">
        <div class="row justify-content-center">
            <div class="col-lg-8">
                <!-- Form Card -->
                <div class="card card-custom">
                    <div class="card-header bg-light">
                        <h2 class="card-title h5 mb-0">
                            <i class="fas fa-plus-circle text-primary me-2"></i>
                            Nueva Solicitud de Cotización
                        </h2>
                    </div>
                    
                    <div class="card-body">
                        <form id="shippingRequestForm" novalidate>
                            <!-- Usuario -->
                            <div class="mb-4">
                                <label for="userName" class="form-label">
                                    <i class="fas fa-user text-primary me-1"></i>
                                    Usuario Solicitante
                                </label>
                                <input type="text" class="form-control form-control-custom" 
                                       id="userName" name="user_name" required>
                                <div class="invalid-feedback">
                                    Por favor ingrese el nombre del usuario solicitante.
                                </div>
                            </div>

                            <!-- Información de Origen -->
                            <div class="section-header mb-3">
                                <h4 class="text-primary">
                                    <i class="fas fa-map-marker-alt me-2"></i>
                                    Información de Origen
                                </h4>
                                <hr>
                            </div>
                            
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <label for="originCountry" class="form-label">País</label>
                                    <select class="form-select form-control-custom" 
                                            id="originCountry" name="origin_country" required>
                                        <option value="">Seleccionar país...</option>
                                        <option value="MX">México</option>
                                        <option value="US">Estados Unidos</option>
                                        <option value="CA">Canadá</option>
                                        <option value="GT">Guatemala</option>
                                        <option value="ES">España</option>
                                        <option value="CN">China</option>
                                    </select>
                                    <div class="invalid-feedback">
                                        Seleccione el país de origen.
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <label for="originPostalCode" class="form-label">Código Postal</label>
                                    <input type="text" class="form-control form-control-custom" 
                                           id="originPostalCode" name="origin_postal_code" required>
                                    <div class="invalid-feedback">
                                        Ingrese el código postal de origen.
                                    </div>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label for="originAddress" class="form-label">Dirección Completa</label>
                                <textarea class="form-control form-control-custom" 
                                          id="originAddress" name="origin_address" 
                                          rows="2" required placeholder="Calle, número, colonia, ciudad, estado..."></textarea>
                                <div class="invalid-feedback">
                                    Ingrese la dirección completa de origen.
                                </div>
                            </div>
                            
                            <div class="mb-4">
                                <label for="originContact" class="form-label">Contacto</label>
                                <input type="text" class="form-control form-control-custom" 
                                       id="originContact" name="origin_contact" 
                                       placeholder="Nombre y teléfono del contacto">
                            </div>

                            <!-- Información de Destino -->
                            <div class="section-header mb-3">
                                <h4 class="text-primary">
                                    <i class="fas fa-flag-checkered me-2"></i>
                                    Información de Destino
                                </h4>
                                <hr>
                            </div>
                            
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <label for="destinationCountry" class="form-label">País</label>
                                    <select class="form-select form-control-custom" 
                                            id="destinationCountry" name="destination_country" required>
                                        <option value="">Seleccionar país...</option>
                                        <option value="MX">México</option>
                                        <option value="US">Estados Unidos</option>
                                        <option value="CA">Canadá</option>
                                        <option value="GT">Guatemala</option>
                                        <option value="ES">España</option>
                                        <option value="CN">China</option>
                                    </select>
                                    <div class="invalid-feedback">
                                        Seleccione el país de destino.
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <label for="destinationPostalCode" class="form-label">Código Postal</label>
                                    <input type="text" class="form-control form-control-custom" 
                                           id="destinationPostalCode" name="destination_postal_code" required>
                                    <div class="invalid-feedback">
                                        Ingrese el código postal de destino.
                                    </div>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label for="destinationAddress" class="form-label">Dirección Completa</label>
                                <textarea class="form-control form-control-custom" 
                                          id="destinationAddress" name="destination_address" 
                                          rows="2" required placeholder="Calle, número, colonia, ciudad, estado..."></textarea>
                                <div class="invalid-feedback">
                                    Ingrese la dirección completa de destino.
                                </div>
                            </div>
                            
                            <div class="mb-4">
                                <label for="destinationContact" class="form-label">Contacto</label>
                                <input type="text" class="form-control form-control-custom" 
                                       id="destinationContact" name="destination_contact" 
                                       placeholder="Nombre y teléfono del contacto">
                            </div>

                            <!-- Detalles del Paquete -->
                            <div class="section-header mb-3">
                                <h4 class="text-primary">
                                    <i class="fas fa-box me-2"></i>
                                    Detalles del Paquete
                                </h4>
                                <hr>
                            </div>
                            
                            <div id="packagesContainer">
                                <!-- Los paquetes se añadirán dinámicamente aquí -->
                            </div>
                            
                            <div class="mb-4">
                                <button type="button" class="btn btn-outline-primary btn-sm" id="addPackageBtn">
                                    <i class="fas fa-plus me-1"></i>
                                    Añadir Paquete
                                </button>
                            </div>

                            <!-- Tipo de Servicio -->
                            <div class="section-header mb-3">
                                <h4 class="text-primary">
                                    <i class="fas fa-truck me-2"></i>
                                    Tipo de Servicio
                                </h4>
                                <hr>
                            </div>
                            
                            <div class="row mb-4">
                                <div class="col-md-4">
                                    <div class="form-check service-option">
                                        <input class="form-check-input" type="radio" 
                                               name="service_type" id="serviceAir" value="air" required>
                                        <label class="form-check-label" for="serviceAir">
                                            <i class="fas fa-plane text-info"></i>
                                            <strong>Aéreo</strong>
                                            <small class="d-block text-muted">Rápido y seguro</small>
                                        </label>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-check service-option">
                                        <input class="form-check-input" type="radio" 
                                               name="service_type" id="serviceSea" value="sea" required>
                                        <label class="form-check-label" for="serviceSea">
                                            <i class="fas fa-ship text-info"></i>
                                            <strong>Marítimo</strong>
                                            <small class="d-block text-muted">Económico para grandes volúmenes</small>
                                        </label>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-check service-option">
                                        <input class="form-check-input" type="radio" 
                                               name="service_type" id="serviceLand" value="land" required>
                                        <label class="form-check-label" for="serviceLand">
                                            <i class="fas fa-truck text-info"></i>
                                            <strong>Terrestre</strong>
                                            <small class="d-block text-muted">Ideal para distancias cortas</small>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <!-- Botones de Acción -->
                            <div class="row">
                                <div class="col-md-6">
                                    <button type="button" class="btn btn-outline-secondary w-100" id="clearFormBtn">
                                        <i class="fas fa-eraser me-1"></i>
                                        Limpiar Formulario
                                    </button>
                                </div>
                                <div class="col-md-6">
                                    <button type="submit" class="btn btn-custom-primary w-100" id="submitBtn">
                                        <i class="fas fa-paper-plane me-1"></i>
                                        Enviar y Cotizar
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

                <!-- Info Card -->
                <div class="card card-custom mt-4">
                    <div class="card-body">
                        <h5 class="card-title">
                            <i class="fas fa-info-circle text-info me-2"></i>
                            ¿Cómo funciona?
                        </h5>
                        <div class="row">
                            <div class="col-md-3 text-center mb-3">
                                <i class="fas fa-edit fa-2x text-primary mb-2"></i>
                                <h6>1. Completa el formulario</h6>
                                <small class="text-muted">Ingresa los detalles de tu envío</small>
                            </div>
                            <div class="col-md-3 text-center mb-3">
                                <i class="fas fa-share fa-2x text-secondary mb-2"></i>
                                <h6>2. Envío automático</h6>
                                <small class="text-muted">Se notifica a todos los transportistas</small>
                            </div>
                            <div class="col-md-3 text-center mb-3">
                                <i class="fas fa-brain fa-2x text-success mb-2"></i>
                                <h6>3. Análisis IA</h6>
                                <small class="text-muted">La IA procesa las respuestas</small>
                            </div>
                            <div class="col-md-3 text-center mb-3">
                                <i class="fas fa-chart-bar fa-2x text-warning mb-2"></i>
                                <h6>4. Comparativa</h6>
                                <small class="text-muted">Elige la mejor opción</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <!-- Footer -->
    <footer class="bg-dark text-white py-3 mt-5">
        <div class="container text-center">
            <small>&copy; 2025 Tu Empresa - Portal de Cotización Inteligente v1.0</small>
        </div>
    </footer>

    <!-- Scripts -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/limonte-sweetalert2/11.10.1/sweetalert2.all.min.js"></script>
    <script src="config.js"></script>
    <script type="module" src="js/index.js"></script>
</body>
</html>
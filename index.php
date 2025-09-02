<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GRAMMER Logística y Tráfico - Portal de Cotización</title>
    
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/css/bootstrap.min.css" rel="stylesheet">
    
    <!-- FontAwesome Icons -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    
    <!-- SweetAlert2 -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/limonte-sweetalert2/11.10.1/sweetalert2.min.css" rel="stylesheet">
    
    <!-- Estilos personalizados -->
    <link href="css/style.css" rel="stylesheet">
    <link href="css/index.css" rel="stylesheet">
    <link href="css/grammer-theme.css" rel="stylesheet">
</head>
<body>
    <!-- Header GRAMMER -->
    <header class="bg-grammer-gradient text-white py-3 shadow-lg">
        <div class="container">
            <div class="row align-items-center">
                <div class="col-md-8">
                    <div class="d-flex align-items-center">
                        <div class="grammer-logo me-3">
                            <i class="fas fa-industry fa-2x"></i>
                        </div>
                        <div>
                            <h1 class="h3 mb-0 fw-bold">
                                <span class="grammer-brand">GRAMMER</span>
                                <span class="grammer-subtitle">Logística y Tráfico</span>
                            </h1>
                            <small class="opacity-90">
                                <i class="fas fa-shipping-fast me-1"></i>
                                Portal de Cotización Inteligente
                            </small>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 text-md-end">
                    <div class="header-actions">
                        <a href="dashboard.php" class="btn btn-light btn-sm me-2">
                            <i class="fas fa-chart-line me-1"></i>
                            Dashboard
                        </a>
                        <div class="btn-group">
                            <button type="button" class="btn btn-outline-light btn-sm dropdown-toggle" data-bs-toggle="dropdown">
                                <i class="fas fa-cog me-1"></i>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end">
                                <li><a class="dropdown-item" href="#" onclick="grammerForm.loadDraft()">
                                    <i class="fas fa-file-import me-2"></i>Cargar Borrador
                                </a></li>
                                <li><a class="dropdown-item" href="#" onclick="grammerForm.clearDraft()">
                                    <i class="fas fa-trash me-2"></i>Limpiar Borrador
                                </a></li>
                                <li><hr class="dropdown-divider"></li>
                                <li><a class="dropdown-item" href="mailto:logistica@grammer.com">
                                    <i class="fas fa-envelope me-2"></i>Soporte
                                </a></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main class="container py-4">
        <div class="row justify-content-center">
            <div class="col-lg-10">
                <!-- Form Card -->
                <div class="card grammer-card shadow-lg">
                    <div class="card-header grammer-card-header">
                        <div class="d-flex align-items-center justify-content-between">
                            <div>
                                <h2 class="card-title h5 mb-0">
                                    <i class="fas fa-plus-circle text-grammer-accent me-2"></i>
                                    Nueva Solicitud de Cotización
                                </h2>
                                <small class="text-muted">
                                    <i class="fas fa-calendar me-1"></i>
                                    <span id="currentDateTime"></span>
                                </small>
                            </div>
                            <div class="grammer-badge">
                                <i class="fas fa-shield-alt me-1"></i>
                                Sistema Seguro
                            </div>
                        </div>
                    </div>
                    
                    <div class="card-body">
                        <form id="shippingRequestForm" novalidate>
                            <!-- Selector de método y formulario dinámico -->
                            <div id="shippingMethodSelector" class="mb-4">
                                <!-- Será llenado por JavaScript -->
                            </div>
                            
                            <!-- Container para formulario dinámico -->
                            <div id="dynamicFormContainer">
                                <!-- Será llenado dinámicamente por JavaScript según el método seleccionado -->
                            </div>

                            <!-- Botones de Acción (solo visible cuando hay método seleccionado) -->
                            <div id="formActionButtons" class="row mt-4" style="display: none;">
                                <div class="col-md-6">
                                    <button type="button" class="btn btn-outline-secondary w-100" id="clearFormBtn">
                                        <i class="fas fa-eraser me-1"></i>
                                        Limpiar Formulario
                                    </button>
                                </div>
                                <div class="col-md-6">
                                    <button type="submit" class="btn btn-grammer-primary w-100" id="submitBtn">
                                        <i class="fas fa-paper-plane me-1"></i>
                                        <span class="submit-text">Enviar Solicitud</span>
                                        <span class="submit-loading d-none">
                                            <i class="fas fa-spinner fa-spin me-1"></i>
                                            Enviando...
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

                <!-- Info Card GRAMMER -->
                <div class="card grammer-info-card mt-4">
                    <div class="card-body">
                        <h5 class="card-title text-grammer-primary">
                            <i class="fas fa-info-circle me-2"></i>
                            Cómo funciona nuestro sistema de cotización
                        </h5>
                        <div class="row">
                            <div class="col-md-3 text-center mb-3">
                                <div class="info-step">
                                    <div class="step-icon bg-grammer-primary">
                                        <i class="fas fa-mouse-pointer fa-lg"></i>
                                    </div>
                                    <h6>1. Seleccionar Método</h6>
                                    <small class="text-muted">Elige entre Fedex, Aéreo-Marítimo o Nacional</small>
                                </div>
                            </div>
                            <div class="col-md-3 text-center mb-3">
                                <div class="info-step">
                                    <div class="step-icon bg-grammer-secondary">
                                        <i class="fas fa-edit fa-lg"></i>
                                    </div>
                                    <h6>2. Completar Datos</h6>
                                    <small class="text-muted">Llena el formulario específico del método</small>
                                </div>
                            </div>
                            <div class="col-md-3 text-center mb-3">
                                <div class="info-step">
                                    <div class="step-icon bg-grammer-accent">
                                        <i class="fas fa-share fa-lg"></i>
                                    </div>
                                    <h6>3. Envío Automático</h6>
                                    <small class="text-muted">Se notifica a transportistas especializados</small>
                                </div>
                            </div>
                            <div class="col-md-3 text-center mb-3">
                                <div class="info-step">
                                    <div class="step-icon bg-grammer-success">
                                        <i class="fas fa-chart-bar fa-lg"></i>
                                    </div>
                                    <h6>4. Análisis IA</h6>
                                    <small class="text-muted">Comparativa inteligente de opciones</small>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Información adicional GRAMMER -->
                        <div class="mt-4 pt-4 border-top">
                            <div class="row">
                                <div class="col-md-6">
                                    <h6 class="text-grammer-primary">
                                        <i class="fas fa-clock me-2"></i>
                                        Horarios de Operación
                                    </h6>
                                    <ul class="list-unstyled small">
                                        <li><strong>Lunes a Viernes:</strong> 7:00 AM - 5:00 PM</li>
                                        <li><strong>Sábados:</strong> 8:00 AM - 12:00 PM</li>
                                        <li><strong>Domingos:</strong> Cerrado</li>
                                    </ul>
                                </div>
                                <div class="col-md-6">
                                    <h6 class="text-grammer-primary">
                                        <i class="fas fa-phone me-2"></i>
                                        Contacto de Emergencia
                                    </h6>
                                    <ul class="list-unstyled small">
                                        <li><strong>Logística:</strong> +52 442 123-4567</li>
                                        <li><strong>Urgencias:</strong> +52 442 987-6543</li>
                                        <li><strong>Email:</strong> logistica@grammer.com</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Stats Card (Solo visible si hay datos) -->
                <div id="quickStats" class="card grammer-stats-card mt-4 d-none">
                    <div class="card-body">
                        <h6 class="card-title text-grammer-primary mb-3">
                            <i class="fas fa-tachometer-alt me-2"></i>
                            Estadísticas Rápidas - Hoy
                        </h6>
                        <div class="row">
                            <div class="col-md-3">
                                <div class="stat-item">
                                    <div class="stat-number" id="todayRequests">0</div>
                                    <div class="stat-label">Solicitudes</div>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="stat-item">
                                    <div class="stat-number" id="pendingQuotes">0</div>
                                    <div class="stat-label">Pendientes</div>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="stat-item">
                                    <div class="stat-number" id="completedToday">0</div>
                                    <div class="stat-label">Completadas</div>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="stat-item">
                                    <div class="stat-number" id="avgResponseTime">-</div>
                                    <div class="stat-label">Tiempo Resp. Prom.</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <!-- Footer GRAMMER -->
    <footer class="bg-grammer-dark text-white py-4 mt-5">
        <div class="container">
            <div class="row">
                <div class="col-md-6">
                    <div class="footer-brand mb-2">
                        <i class="fas fa-industry me-2"></i>
                        <strong>GRAMMER Automotive Puebla S.A. de C.V.</strong>
                    </div>
                    <p class="small mb-2">
                        Av. de la luz #24 int. 3 y 4 Acceso III<br>
                        Parque Ind. Benito Juárez 76120, Querétaro, México
                    </p>
                    <p class="small text-muted mb-0">
                        Portal de Cotización Inteligente v1.0 - Logística y Tráfico
                    </p>
                </div>
                <div class="col-md-6 text-md-end">
                    <div class="footer-links mb-3">
                        <a href="dashboard.php" class="text-light me-3">
                            <i class="fas fa-chart-line me-1"></i>Dashboard
                        </a>
                        <a href="mailto:logistica@grammer.com" class="text-light me-3">
                            <i class="fas fa-envelope me-1"></i>Soporte
                        </a>
                        <a href="#" class="text-light" data-bs-toggle="modal" data-bs-target="#helpModal">
                            <i class="fas fa-question-circle me-1"></i>Ayuda
                        </a>
                    </div>
                    <div class="footer-cert">
                        <small class="text-muted">
                            <i class="fas fa-certificate me-1"></i>
                            Sistema certificado ISO 27001
                        </small>
                    </div>
                </div>
            </div>
            <hr class="my-3 border-secondary">
            <div class="row">
                <div class="col-12 text-center">
                    <small class="text-muted">
                        © 2025 GRAMMER Automotive Puebla S.A. de C.V. - Todos los derechos reservados
                    </small>
                </div>
            </div>
        </div>
    </footer>

    <!-- Modal de Ayuda -->
    <div class="modal fade" id="helpModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header bg-grammer-primary text-white">
                    <h5 class="modal-title">
                        <i class="fas fa-question-circle me-2"></i>
                        Ayuda - Portal GRAMMER
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="row">
                        <div class="col-md-4">
                            <h6 class="text-grammer-primary">Métodos de Envío</h6>
                            <ul class="list-unstyled small">
                                <li><strong>Fedex Express:</strong> Para envíos urgentes y documentos</li>
                                <li><strong>Aéreo-Marítimo:</strong> Envíos internacionales con INCOTERMS</li>
                                <li><strong>Nacional:</strong> Envíos domésticos a planta GRAMMER</li>
                            </ul>
                        </div>
                        <div class="col-md-4">
                            <h6 class="text-grammer-primary">¿Problemas Técnicos?</h6>
                            <ul class="list-unstyled small">
                                <li>Limpiar caché del navegador</li>
                                <li>Verificar conexión a internet</li>
                                <li>Contactar soporte IT interno</li>
                                <li>Reportar error: logistica@grammer.com</li>
                            </ul>
                        </div>
                        <div class="col-md-4">
                            <h6 class="text-grammer-primary">Contacto Directo</h6>
                            <ul class="list-unstyled small">
                                <li><strong>Logística:</strong> +52 442 123-4567</li>
                                <li><strong>Tráfico:</strong> +52 442 234-5678</li>
                                <li><strong>Email:</strong> logistica@grammer.com</li>
                                <li><strong>Urgencias:</strong> 24/7 disponible</li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                    <a href="mailto:logistica@grammer.com" class="btn btn-grammer-primary">
                        <i class="fas fa-envelope me-1"></i>
                        Contactar Soporte
                    </a>
                </div>
            </div>
        </div>
    </div>

    <!-- Scripts -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/limonte-sweetalert2/11.10.1/sweetalert2.all.min.js"></script>
    <script src="config.js"></script>
    <script type="module" src="js/index.js"></script>
    
    <!-- Script para elementos adicionales -->
    <script>
        // Mostrar fecha y hora actual
        document.addEventListener('DOMContentLoaded', function() {
            const now = new Date();
            const options = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'America/Mexico_City'
            };
            document.getElementById('currentDateTime').textContent = 
                now.toLocaleDateString('es-MX', options);
                
            // Mostrar/ocultar botones de acción cuando se selecciona método
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.addedNodes.length > 0) {
                        const methodForm = document.querySelector('.method-form-container');
                        const actionButtons = document.getElementById('formActionButtons');
                        
                        if (methodForm && actionButtons) {
                            actionButtons.style.display = 'block';
                            actionButtons.style.animation = 'slideInUp 0.4s ease-out';
                        }
                    }
                });
            });
            
            observer.observe(document.getElementById('dynamicFormContainer'), {
                childList: true,
                subtree: true
            });
            
            // Cargar estadísticas rápidas si están disponibles
            loadQuickStats();
        });
        
        // Función para cargar estadísticas rápidas
        async function loadQuickStats() {
            try {
                // Aquí se puede implementar una llamada rápida a la API
                // Por ahora, simulamos algunos datos
                setTimeout(() => {
                    const statsCard = document.getElementById('quickStats');
                    if (statsCard && Math.random() > 0.7) { // 30% probabilidad de mostrar
                        statsCard.classList.remove('d-none');
                        
                        // Simular datos
                        document.getElementById('todayRequests').textContent = Math.floor(Math.random() * 15) + 1;
                        document.getElementById('pendingQuotes').textContent = Math.floor(Math.random() * 8);
                        document.getElementById('completedToday').textContent = Math.floor(Math.random() * 5);
                        document.getElementById('avgResponseTime').textContent = (Math.random() * 3 + 0.5).toFixed(1) + 'h';
                    }
                }, 1000);
            } catch (error) {
                console.log('No se pudieron cargar las estadísticas rápidas');
            }
        }
    </script>
</body>
</html>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Portal de Cotización Inteligente GRAMMER</title>
    
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/css/bootstrap.min.css" rel="stylesheet">
    
    <!-- FontAwesome Icons -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    
    <!-- SweetAlert2 -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/limonte-sweetalert2/11.10.1/sweetalert2.min.css" rel="stylesheet">
    
    <!-- Estilos personalizados GRAMMER -->
    <link href="css/style.css" rel="stylesheet">
</head>
<body>
    <div class="app-container">
        <!-- Header GRAMMER -->
        <header class="bg-grammer-gradient text-white py-4 shadow-sm">
            <div class="container-fluid">
                <div class="row align-items-center">
                    <div class="col-md-8">
                        <div class="d-flex align-items-center">
                            <div class="grammer-logo me-3">
                                <i class="fas fa-chart-line text-white"></i>
                            </div>
                            <div>
                                <h1 class="grammer-brand mb-0">
                                    Dashboard Inteligente
                                    <span class="grammer-subtitle">Portal de Cotización GRAMMER</span>
                                </h1>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4 text-md-end">
                        <div class="header-actions">
                            <button class="btn btn-light me-2" id="refreshBtn">
                                <i class="fas fa-sync-alt me-1"></i>
                                Actualizar
                            </button>
                            <a href="index.php" class="btn btn-light">
                                <i class="fas fa-plus me-1"></i>
                                Nueva Solicitud
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </header>

        <!-- Main Content -->
        <main class="app-main-content">
            <div class="container-fluid">
                <!-- Filtros y Controles -->
                <div class="row mb-4">
                    <div class="col-12">
                        <div class="grammer-card">
                            <div class="grammer-card-header">
                                <h5 class="text-grammer-primary mb-0">
                                    <i class="fas fa-filter me-2"></i>
                                    Centro de Control
                                </h5>
                            </div>
                            <div class="card-body">
                                <div class="row align-items-end">
                                    <div class="col-md-3">
                                        <label for="statusFilter" class="form-label fw-bold text-grammer-primary">Estado</label>
                                        <select class="form-select form-control-custom" id="statusFilter">
                                            <option value="">Todos los estados</option>
                                            <option value="pending">Pendiente</option>
                                            <option value="quoting">Cotizando</option>
                                            <option value="completed">Completado</option>
                                            <option value="canceled">Cancelado</option>
                                        </select>
                                    </div>
                                    <div class="col-md-3">
                                        <label for="serviceFilter" class="form-label fw-bold text-grammer-primary">Tipo de Servicio</label>
                                        <select class="form-select form-control-custom" id="serviceFilter">
                                            <option value="">Todos los servicios</option>
                                            <option value="air">Aéreo</option>
                                            <option value="sea">Marítimo</option>
                                            <option value="land">Terrestre</option>
                                        </select>
                                    </div>
                                    <div class="col-md-2">
                                        <label for="dateFrom" class="form-label fw-bold text-grammer-primary">Desde</label>
                                        <input type="date" class="form-control form-control-custom" id="dateFrom">
                                    </div>
                                    <div class="col-md-2">
                                        <label for="dateTo" class="form-label fw-bold text-grammer-primary">Hasta</label>
                                        <input type="date" class="form-control form-control-custom" id="dateTo">
                                    </div>
                                    <div class="col-md-2">
                                        <button class="btn btn-grammer-primary w-100" id="applyFiltersBtn">
                                            <i class="fas fa-filter me-1"></i>
                                            Filtrar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Estadísticas Rápidas GRAMMER -->
                <div class="row mb-4" id="statsCards">
                    <div class="col-md-3">
                        <div class="grammer-stats-card p-3 text-center">
                            <div class="stat-item">
                                <div class="stat-number text-grammer-primary" id="totalRequests">-</div>
                                <div class="stat-label">Total Solicitudes</div>
                            </div>
                            <div class="text-grammer-accent mt-2">
                                <i class="fas fa-clipboard-list fa-2x"></i>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="grammer-stats-card p-3 text-center">
                            <div class="stat-item">
                                <div class="stat-number text-warning" id="pendingRequests">-</div>
                                <div class="stat-label">En Proceso</div>
                            </div>
                            <div class="text-warning mt-2">
                                <i class="fas fa-clock fa-2x"></i>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="grammer-stats-card p-3 text-center">
                            <div class="stat-item">
                                <div class="stat-number text-grammer-success" id="completedRequests">-</div>
                                <div class="stat-label">Completadas</div>
                            </div>
                            <div class="text-grammer-success mt-2">
                                <i class="fas fa-check-circle fa-2x"></i>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="grammer-stats-card p-3 text-center">
                            <div class="stat-item">
                                <div class="stat-number text-grammer-accent" id="completionRate">-</div>
                                <div class="stat-label">Tasa de Éxito</div>
                            </div>
                            <div class="text-grammer-accent mt-2">
                                <i class="fas fa-percentage fa-2x"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Contenido Principal -->
                <div class="row">
                    <!-- Lista de Solicitudes -->
                    <div class="col-lg-8">
                        <div class="grammer-card">
                            <div class="grammer-card-header d-flex justify-content-between align-items-center">
                                <h5 class="text-grammer-primary mb-0">
                                    <i class="fas fa-list me-2"></i>
                                    Solicitudes de Cotización
                                </h5>
                                <div class="d-flex align-items-center">
                                    <span class="grammer-badge me-2" id="requestsCount">0 solicitudes</span>
                                    <div class="auto-refresh-indicator bg-grammer-success text-white px-2 py-1 rounded" id="autoRefreshIndicator">
                                        <i class="fas fa-wifi"></i>
                                        <small>Auto-actualización activa</small>
                                    </div>
                                </div>
                            </div>
                            <div class="card-body p-0">
                                <div class="table-responsive">
                                    <table class="table table-hover mb-0" id="requestsTable">
                                        <thead class="bg-grammer-primary text-white">
                                            <tr>
                                                <th>ID</th>
                                                <th>Usuario</th>
                                                <th>Ruta</th>
                                                <th>Servicio</th>
                                                <th>Estado</th>
                                                <th>Cotizaciones</th>
                                                <th>Fecha</th>
                                                <th>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody id="requestsTableBody">
                                            <!-- Las filas se llenarán dinámicamente -->
                                        </tbody>
                                    </table>
                                </div>
                                
                                <!-- Loading State -->
                                <div class="text-center py-5 d-none" id="loadingState">
                                    <div class="spinner-border text-grammer-primary" role="status">
                                        <span class="visually-hidden">Cargando...</span>
                                    </div>
                                    <p class="mt-3 text-grammer-primary">Cargando solicitudes...</p>
                                </div>
                                
                                <!-- Empty State -->
                                <div class="text-center py-5 d-none" id="emptyState">
                                    <i class="fas fa-inbox fa-3x text-grammer-accent mb-3"></i>
                                    <h5 class="text-grammer-primary">No hay solicitudes</h5>
                                    <p class="text-muted">No se encontraron solicitudes que coincidan con los filtros aplicados.</p>
                                    <a href="index.php" class="btn btn-grammer-primary">
                                        <i class="fas fa-plus me-1"></i>
                                        Crear Nueva Solicitud
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Panel Lateral -->
                    <div class="col-lg-4">
                        <!-- Actividad Reciente -->
                        <div class="grammer-card mb-4">
                            <div class="grammer-card-header">
                                <h6 class="text-grammer-primary mb-0">
                                    <i class="fas fa-chart-bar me-2"></i>
                                    Actividad Reciente
                                </h6>
                            </div>
                            <div class="card-body">
                                <div id="activityChart" style="height: 200px;"></div>
                            </div>
                        </div>

                        <!-- Top Usuarios -->
                        <div class="grammer-card mb-4">
                            <div class="grammer-card-header">
                                <h6 class="text-grammer-primary mb-0">
                                    <i class="fas fa-users me-2"></i>
                                    Usuarios Más Activos
                                </h6>
                            </div>
                            <div class="card-body p-0">
                                <div id="topUsersList">
                                    <!-- Se llenará dinámicamente -->
                                </div>
                            </div>
                        </div>

                        <!-- Distribución de Servicios -->
                        <div class="grammer-card">
                            <div class="grammer-card-header">
                                <h6 class="text-grammer-primary mb-0">
                                    <i class="fas fa-chart-pie me-2"></i>
                                    Tipos de Servicio
                                </h6>
                            </div>
                            <div class="card-body">
                                <div id="servicesChart" style="height: 300px;"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>

        <!-- Footer GRAMMER -->
        <footer class="app-footer">
            <div class="container-fluid">
                <p>&copy; 2025 GRAMMER - Portal de Cotización Inteligente v1.0</p>
            </div>
        </footer>
    </div>

    <!-- Modal de Detalles de Solicitud -->
    <div class="modal fade" id="requestDetailsModal" tabindex="-1">
        <div class="modal-dialog modal-xl">
            <div class="modal-content">
                <div class="modal-header bg-grammer-gradient text-white">
                    <h5 class="modal-title">
                        <i class="fas fa-eye me-2"></i>
                        Detalles de Solicitud GRAMMER
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body" id="requestDetailsContent">
                    <!-- El contenido se cargará dinámicamente -->
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal de Cotizaciones -->
    <div class="modal fade" id="quotesModal" tabindex="-1">
        <div class="modal-dialog modal-xl">
            <div class="modal-content">
                <div class="modal-header bg-grammer-gradient text-white">
                    <h5 class="modal-title">
                        <i class="fas fa-calculator me-2"></i>
                        Cotizaciones Recibidas - GRAMMER
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body" id="quotesModalContent">
                    <!-- El contenido se cargará dinámicamente -->
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Scripts -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/limonte-sweetalert2/11.10.1/sweetalert2.all.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/apexcharts/3.44.0/apexcharts.min.js"></script>
    <script src="config.js"></script>
    <script type="module" src="js/dashboard.js"></script>
</body>
</html>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Portal de Cotización Inteligente</title>
    
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/css/bootstrap.min.css" rel="stylesheet">
    
    <!-- FontAwesome Icons -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    
    <!-- SweetAlert2 -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/limonte-sweetalert2/11.10.1/sweetalert2.min.css" rel="stylesheet">
    
    <!-- Chart.js -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.min.css" rel="stylesheet">
    
    <!-- Estilos personalizados -->
    <link href="css/style.css" rel="stylesheet">
    <link href="css/dashboard.css" rel="stylesheet">
</head>
<body>
    <!-- Header -->
    <header class="bg-primary text-white py-3 shadow-sm">
        <div class="container-fluid">
            <div class="row align-items-center">
                <div class="col-md-6">
                    <h1 class="h3 mb-0">
                        <i class="fas fa-chart-line me-2"></i>
                        Dashboard de Cotizaciones
                    </h1>
                    <small class="opacity-75">Centro de inteligencia y análisis</small>
                </div>
                <div class="col-md-6 text-md-end">
                    <button class="btn btn-light btn-sm me-2" id="refreshBtn">
                        <i class="fas fa-sync-alt me-1"></i>
                        Actualizar
                    </button>
                    <a href="index.php" class="btn btn-outline-light btn-sm">
                        <i class="fas fa-plus me-1"></i>
                        Nueva Solicitud
                    </a>
                </div>
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main class="container-fluid py-4">
        <!-- Filtros y Controles -->
        <div class="row mb-4">
            <div class="col-12">
                <div class="card card-custom">
                    <div class="card-body">
                        <div class="row align-items-end">
                            <div class="col-md-3">
                                <label for="statusFilter" class="form-label">Estado</label>
                                <select class="form-select" id="statusFilter">
                                    <option value="">Todos los estados</option>
                                    <option value="pending">Pendiente</option>
                                    <option value="quoting">Cotizando</option>
                                    <option value="completed">Completado</option>
                                    <option value="canceled">Cancelado</option>
                                </select>
                            </div>
                            <div class="col-md-3">
                                <label for="serviceFilter" class="form-label">Tipo de Servicio</label>
                                <select class="form-select" id="serviceFilter">
                                    <option value="">Todos los servicios</option>
                                    <option value="air">Aéreo</option>
                                    <option value="sea">Marítimo</option>
                                    <option value="land">Terrestre</option>
                                </select>
                            </div>
                            <div class="col-md-2">
                                <label for="dateFrom" class="form-label">Desde</label>
                                <input type="date" class="form-control" id="dateFrom">
                            </div>
                            <div class="col-md-2">
                                <label for="dateTo" class="form-label">Hasta</label>
                                <input type="date" class="form-control" id="dateTo">
                            </div>
                            <div class="col-md-2">
                                <button class="btn btn-custom-primary w-100" id="applyFiltersBtn">
                                    <i class="fas fa-filter me-1"></i>
                                    Filtrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Estadísticas Rápidas -->
        <div class="row mb-4" id="statsCards">
            <div class="col-md-3">
                <div class="stat-card card-custom bg-primary text-white">
                    <div class="stat-icon">
                        <i class="fas fa-clipboard-list"></i>
                    </div>
                    <div class="stat-content">
                        <h3 id="totalRequests">-</h3>
                        <p>Total Solicitudes</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="stat-card card-custom bg-warning text-white">
                    <div class="stat-icon">
                        <i class="fas fa-clock"></i>
                    </div>
                    <div class="stat-content">
                        <h3 id="pendingRequests">-</h3>
                        <p>En Proceso</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="stat-card card-custom bg-success text-white">
                    <div class="stat-icon">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div class="stat-content">
                        <h3 id="completedRequests">-</h3>
                        <p>Completadas</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="stat-card card-custom bg-info text-white">
                    <div class="stat-icon">
                        <i class="fas fa-percentage"></i>
                    </div>
                    <div class="stat-content">
                        <h3 id="completionRate">-</h3>
                        <p>Tasa de Éxito</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Contenido Principal -->
        <div class="row">
            <!-- Lista de Solicitudes -->
            <div class="col-lg-8">
                <div class="card card-custom">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="card-title mb-0">
                            <i class="fas fa-list me-2"></i>
                            Solicitudes de Cotización
                        </h5>
                        <div class="d-flex align-items-center">
                            <span class="badge bg-secondary me-2" id="requestsCount">0 solicitudes</span>
                            <div class="auto-refresh-indicator" id="autoRefreshIndicator">
                                <i class="fas fa-wifi text-success"></i>
                                <small class="text-muted">Auto-actualización activa</small>
                            </div>
                        </div>
                    </div>
                    <div class="card-body p-0">
                        <div class="table-responsive">
                            <table class="table table-hover mb-0" id="requestsTable">
                                <thead class="table-dark">
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
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Cargando...</span>
                            </div>
                            <p class="mt-3 text-muted">Cargando solicitudes...</p>
                        </div>
                        
                        <!-- Empty State -->
                        <div class="text-center py-5 d-none" id="emptyState">
                            <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                            <h5 class="text-muted">No hay solicitudes</h5>
                            <p class="text-muted">No se encontraron solicitudes que coincidan con los filtros aplicados.</p>
                            <a href="index.php" class="btn btn-custom-primary">
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
                <div class="card card-custom mb-4">
                    <div class="card-header">
                        <h6 class="card-title mb-0">
                            <i class="fas fa-chart-bar me-2"></i>
                            Actividad Reciente
                        </h6>
                    </div>
                    <div class="card-body">
                        <canvas id="activityChart" width="400" height="200"></canvas>
                    </div>
                </div>

                <!-- Top Usuarios -->
                <div class="card card-custom mb-4">
                    <div class="card-header">
                        <h6 class="card-title mb-0">
                            <i class="fas fa-users me-2"></i>
                            Usuarios Más Activos
                        </h6>
                    </div>
                    <div class="card-body p-0">
                        <div class="list-group list-group-flush" id="topUsersList">
                            <!-- Se llenará dinámicamente -->
                        </div>
                    </div>
                </div>

                <!-- Distribución de Servicios -->
                <div class="card card-custom">
                    <div class="card-header">
                        <h6 class="card-title mb-0">
                            <i class="fas fa-chart-pie me-2"></i>
                            Tipos de Servicio
                        </h6>
                    </div>
                    <div class="card-body">
                        <canvas id="servicesChart" width="400" height="300"></canvas>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <!-- Modal de Detalles de Solicitud -->
    <div class="modal fade" id="requestDetailsModal" tabindex="-1">
        <div class="modal-dialog modal-xl">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">
                        <i class="fas fa-eye me-2"></i>
                        Detalles de Solicitud
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
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
                <div class="modal-header">
                    <h5 class="modal-title">
                        <i class="fas fa-calculator me-2"></i>
                        Cotizaciones Recibidas
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
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

    <!-- Footer -->
    <footer class="bg-dark text-white py-3 mt-5">
        <div class="container-fluid text-center">
            <small>&copy; 2025 Tu Empresa - Portal de Cotización Inteligente v1.0</small>
        </div>
    </footer>

    <!-- Scripts -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/limonte-sweetalert2/11.10.1/sweetalert2.all.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.min.js"></script>
    <script src="config.js"></script>
    <script type="module" src="js/dashboard.js"></script>
</body>
</html>
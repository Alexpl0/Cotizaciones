/**
 * JavaScript para dashboard.html - Portal de Cotización Inteligente GRAMMER
 * Manejo del dashboard principal con polling automático y ApexCharts
 * @author Alejandro Pérez
 */

import API from './modules/api.js';
import Utils from './modules/utils.js';
import Notifications from './modules/notifications.js';

class GrammerDashboard {
    
    constructor() {
        this.currentFilters = {};
        this.pollingInstance = null;
        this.charts = {};
        this.lastUpdate = null;
        
        // Configuración de colores GRAMMER
        this.grammerColors = {
            primary: '#003366',
            secondary: '#0066CC', 
            accent: '#00A3E0',
            success: '#00AA44',
            warning: '#FF8800',
            danger: '#CC0000'
        };
        
        this.initializeElements();
        this.setupEventListeners();
        this.initializeCharts();
        this.loadInitialData();
        this.startAutoRefresh();
        
        console.log('📊 GRAMMER Dashboard inicializado');
    }
    
    /**
     * Inicializa los elementos del DOM
     */
    initializeElements() {
        // Filtros
        this.statusFilter = document.getElementById('statusFilter');
        this.serviceFilter = document.getElementById('serviceFilter');
        this.dateFrom = document.getElementById('dateFrom');
        this.dateTo = document.getElementById('dateTo');
        this.applyFiltersBtn = document.getElementById('applyFiltersBtn');
        this.refreshBtn = document.getElementById('refreshBtn');
        
        // Stats cards
        this.totalRequestsEl = document.getElementById('totalRequests');
        this.pendingRequestsEl = document.getElementById('pendingRequests');
        this.completedRequestsEl = document.getElementById('completedRequests');
        this.completionRateEl = document.getElementById('completionRate');
        
        // Tabla y contenido
        this.requestsTableBody = document.getElementById('requestsTableBody');
        this.requestsCount = document.getElementById('requestsCount');
        this.loadingState = document.getElementById('loadingState');
        this.emptyState = document.getElementById('emptyState');
        
        // Modales
        this.requestDetailsModal = new bootstrap.Modal(document.getElementById('requestDetailsModal'));
        this.quotesModal = new bootstrap.Modal(document.getElementById('quotesModal'));
        
        // Auto-refresh indicator
        this.autoRefreshIndicator = document.getElementById('autoRefreshIndicator');
        
        // Top users
        this.topUsersList = document.getElementById('topUsersList');
    }
    
    /**
     * Configura todos los event listeners
     */
    setupEventListeners() {
        // Filtros
        this.applyFiltersBtn.addEventListener('click', this.applyFilters.bind(this));
        this.refreshBtn.addEventListener('click', this.refreshData.bind(this));
        
        // Enter en campos de fecha
        this.dateFrom.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.applyFilters();
        });
        
        this.dateTo.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.applyFilters();
        });
        
        // Auto-aplicar filtros cuando cambien los selects
        [this.statusFilter, this.serviceFilter].forEach(filter => {
            filter.addEventListener('change', Utils.debounce(this.applyFilters.bind(this), 500));
        });
        
        // Detectar parámetros URL
        const urlParams = Utils.getUrlParams();
        if (urlParams.request_id) {
            setTimeout(() => this.showRequestDetails(parseInt(urlParams.request_id)), 1000);
        }
        
        // Eventos de visibilidad para pausar/reanudar polling
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
        
        // Cleanup antes de salir
        window.addEventListener('beforeunload', this.cleanup.bind(this));
    }
    
    /**
     * Inicializa los gráficos con ApexCharts
     */
    initializeCharts() {
        // Gráfico de actividad (líneas)
        this.charts.activity = new ApexCharts(document.querySelector("#activityChart"), {
            series: [{
                name: 'Solicitudes',
                data: []
            }, {
                name: 'Completadas', 
                data: []
            }],
            chart: {
                type: 'area',
                height: 200,
                toolbar: {
                    show: false
                },
                zoom: {
                    enabled: false
                }
            },
            colors: [this.grammerColors.secondary, this.grammerColors.success],
            dataLabels: {
                enabled: false
            },
            stroke: {
                curve: 'smooth',
                width: 3
            },
            fill: {
                type: 'gradient',
                gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.3,
                    opacityTo: 0.1,
                    stops: [0, 90, 100]
                }
            },
            xaxis: {
                categories: [],
                labels: {
                    style: {
                        colors: this.grammerColors.primary
                    }
                }
            },
            yaxis: {
                labels: {
                    style: {
                        colors: this.grammerColors.primary
                    }
                }
            },
            grid: {
                borderColor: '#e0e6ed',
                strokeDashArray: 5
            },
            legend: {
                position: 'bottom',
                horizontalAlign: 'center'
            }
        });
        this.charts.activity.render();
        
        // Gráfico de servicios (dona)
        this.charts.services = new ApexCharts(document.querySelector("#servicesChart"), {
            series: [0, 0, 0],
            chart: {
                type: 'donut',
                height: 300
            },
            colors: [this.grammerColors.secondary, this.grammerColors.accent, this.grammerColors.warning],
            labels: ['Aéreo', 'Marítimo', 'Terrestre'],
            dataLabels: {
                enabled: true,
                formatter: function (val) {
                    return Math.round(val) + "%";
                },
                style: {
                    fontSize: '14px',
                    fontWeight: 'bold',
                    colors: ['#fff']
                }
            },
            plotOptions: {
                pie: {
                    donut: {
                        size: '70%',
                        labels: {
                            show: true,
                            total: {
                                show: true,
                                label: 'Total',
                                formatter: function (w) {
                                    return w.globals.seriesTotals.reduce((a, b) => a + b, 0);
                                }
                            }
                        }
                    }
                }
            },
            legend: {
                position: 'bottom',
                horizontalAlign: 'center'
            },
            responsive: [{
                breakpoint: 480,
                options: {
                    chart: {
                        height: 250
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }]
        });
        this.charts.services.render();
    }
    
    /**
     * Carga los datos iniciales
     */
    async loadInitialData() {
        this.showLoadingState(true);
        
        try {
            await this.refreshData();
        } catch (error) {
            Utils.handleError(error, 'Load initial data');
            Notifications.toastError('Error cargando datos iniciales');
        } finally {
            this.showLoadingState(false);
        }
    }
    
    /**
     * Refresca todos los datos
     */
    async refreshData() {
        try {
            Utils.setLoadingState(this.refreshBtn, true);
            
            const [requestsData] = await Promise.all([
                API.getShippingRequests(this.currentFilters)
            ]);
            
            this.updateRequestsTable(requestsData.requests);
            this.updateStats(requestsData.stats);
            this.updateCharts(requestsData.stats);
            this.updateTopUsers(requestsData.stats.top_users);
            
            this.lastUpdate = new Date();
            this.updateAutoRefreshIndicator();
            
            console.log('📊 Datos GRAMMER actualizados exitosamente');
            
        } catch (error) {
            Utils.handleError(error, 'Refresh data');
            Notifications.toastError('Error actualizando datos');
        } finally {
            Utils.setLoadingState(this.refreshBtn, false);
        }
    }
    
    /**
     * Aplica los filtros seleccionados
     */
    applyFilters() {
        this.currentFilters = {
            status: this.statusFilter.value || undefined,
            service_type: this.serviceFilter.value || undefined,
            date_from: this.dateFrom.value || undefined,
            date_to: this.dateTo.value || undefined
        };
        
        // Limpiar valores undefined
        Object.keys(this.currentFilters).forEach(key => {
            if (this.currentFilters[key] === undefined) {
                delete this.currentFilters[key];
            }
        });
        
        console.log('🔍 Aplicando filtros GRAMMER:', this.currentFilters);
        this.refreshData();
    }
    
    /**
     * Actualiza la tabla de solicitudes
     * @param {Array} requests 
     */
    updateRequestsTable(requests) {
        if (!requests || requests.length === 0) {
            this.showEmptyState(true);
            this.requestsCount.textContent = '0 solicitudes';
            return;
        }
        
        this.showEmptyState(false);
        this.requestsCount.textContent = `${requests.length} solicitud${requests.length !== 1 ? 'es' : ''}`;
        
        this.requestsTableBody.innerHTML = '';
        
        requests.forEach(request => {
            const row = this.createRequestRow(request);
            this.requestsTableBody.appendChild(row);
        });
    }
    
    /**
     * Crea una fila de la tabla para una solicitud
     * @param {Object} request 
     * @returns {HTMLElement}
     */
    createRequestRow(request) {
        const row = document.createElement('tr');
        row.className = 'request-row';
        row.dataset.requestId = request.id;
        
        const serviceTypeNames = {
            'air': 'Aéreo',
            'sea': 'Marítimo',
            'land': 'Terrestre'
        };
        
        const statusNames = {
            'pending': 'Pendiente',
            'quoting': 'Cotizando',
            'completed': 'Completado',
            'canceled': 'Cancelado'
        };
        
        const route = `${request.route_info.origin_country} → ${request.route_info.destination_country}`;
        const serviceName = serviceTypeNames[request.service_type] || request.service_type;
        const statusName = statusNames[request.status] || request.status;
        
        row.innerHTML = `
            <td data-label="ID">
                <span class="fw-bold text-grammer-primary">#${request.id}</span>
            </td>
            <td data-label="Usuario">
                <div class="user-info">
                    <strong class="text-grammer-primary">${Utils.sanitizeString(request.user_name)}</strong>
                    <small class="text-muted d-block">${request.created_at_formatted}</small>
                </div>
            </td>
            <td data-label="Ruta">
                <span class="route-info text-grammer-primary">
                    ${route}
                    ${request.route_info.is_international ? '<i class="fas fa-globe text-grammer-accent ms-1" title="Internacional"></i>' : '<i class="fas fa-map-marker-alt text-grammer-secondary ms-1" title="Nacional"></i>'}
                </span>
            </td>
            <td data-label="Servicio">
                <span class="grammer-badge bg-grammer-${request.service_type === 'air' ? 'secondary' : request.service_type === 'sea' ? 'accent' : 'success'}">
                    ${serviceName}
                </span>
            </td>
            <td data-label="Estado">
                <span class="grammer-badge ${this.getStatusBadgeClass(request.status)}">
                    ${statusName}
                </span>
            </td>
            <td data-label="Cotizaciones">
                <div class="d-flex align-items-center">
                    <i class="fas ${request.quote_status.has_quotes ? 'fa-check-circle text-grammer-success' : 'fa-clock text-warning'} me-1"></i>
                    <span class="fw-bold text-grammer-primary">${request.quote_status.total_quotes}</span>
                    ${request.quote_status.selected_quotes > 0 ? `<small class="text-grammer-success ms-1">(${request.quote_status.selected_quotes} sel.)</small>` : ''}
                </div>
            </td>
            <td data-label="Fecha">
                <span class="text-nowrap text-grammer-primary">${request.created_at_formatted}</span>
                <small class="text-muted d-block">${this.getTimeAgo(request.created_at)}</small>
            </td>
            <td data-label="Acciones">
                <div class="action-buttons">
                    <button class="btn btn-sm btn-outline-grammer-primary me-1" onclick="grammerDashboard.showRequestDetails(${request.id})" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm ${request.quote_status.has_quotes ? 'btn-grammer-success' : 'btn-outline-secondary'}" 
                            onclick="grammerDashboard.showQuotes(${request.id})" 
                            ${!request.quote_status.has_quotes ? 'disabled' : ''}
                            title="Ver cotizaciones">
                        <i class="fas fa-calculator"></i>
                    </button>
                </div>
            </td>
        `;
        
        return row;
    }
    
    /**
     * Obtiene la clase CSS para el badge de estado
     * @param {string} status 
     * @returns {string}
     */
    getStatusBadgeClass(status) {
        const classes = {
            'pending': 'bg-warning',
            'quoting': 'bg-grammer-accent',
            'completed': 'bg-grammer-success',
            'canceled': 'bg-danger'
        };
        return classes[status] || 'bg-secondary';
    }
    
    /**
     * Actualiza las tarjetas de estadísticas
     * @param {Object} stats 
     */
    updateStats(stats) {
        if (!stats.basic) return;
        
        const basic = stats.basic;
        
        this.totalRequestsEl.textContent = basic.total_requests || 0;
        this.pendingRequestsEl.textContent = (basic.pending || 0) + (basic.quoting || 0);
        this.completedRequestsEl.textContent = basic.completed || 0;
        
        // Calcular tasa de éxito
        const totalProcessed = (basic.completed || 0) + (basic.canceled || 0);
        const completionRate = totalProcessed > 0 ? 
            Math.round(((basic.completed || 0) / totalProcessed) * 100) : 0;
            
        this.completionRateEl.textContent = `${completionRate}%`;
    }
    
    /**
     * Actualiza los gráficos con ApexCharts
     * @param {Object} stats 
     */
    updateCharts(stats) {
        // Actualizar gráfico de actividad
        if (stats.recent_activity && this.charts.activity) {
            const labels = stats.recent_activity.map(item => 
                new Date(item.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })
            );
            const requestsData = stats.recent_activity.map(item => item.requests);
            const completedData = stats.recent_activity.map(item => item.completed);
            
            this.charts.activity.updateOptions({
                xaxis: {
                    categories: labels
                }
            });
            
            this.charts.activity.updateSeries([{
                name: 'Solicitudes',
                data: requestsData
            }, {
                name: 'Completadas',
                data: completedData
            }]);
        }
        
        // Actualizar gráfico de servicios
        if (stats.by_service_type && this.charts.services) {
            const serviceData = [0, 0, 0]; // air, sea, land
            const serviceMap = { 'air': 0, 'sea': 1, 'land': 2 };
            
            stats.by_service_type.forEach(item => {
                const index = serviceMap[item.service_type];
                if (index !== undefined) {
                    serviceData[index] = item.count;
                }
            });
            
            this.charts.services.updateSeries(serviceData);
        }
    }
    
    /**
     * Actualiza la lista de usuarios más activos
     * @param {Array} topUsers 
     */
    updateTopUsers(topUsers) {
        if (!topUsers || topUsers.length === 0) {
            this.topUsersList.innerHTML = '<div class="text-center py-3 text-muted">Sin datos disponibles</div>';
            return;
        }
        
        this.topUsersList.innerHTML = '';
        
        topUsers.forEach((user, index) => {
            const userItem = document.createElement('div');
            userItem.className = 'p-3 border-bottom border-grammer-accent';
            
            // Obtener iniciales del usuario
            const initials = user.user_name
                .split(' ')
                .map(name => name.charAt(0))
                .join('')
                .substring(0, 2)
                .toUpperCase();
            
            userItem.innerHTML = `
                <div class="d-flex align-items-center justify-content-between">
                    <div class="d-flex align-items-center">
                        <div class="bg-grammer-gradient text-white rounded-circle d-flex align-items-center justify-content-center" 
                             style="width: 40px; height: 40px; font-size: 14px; font-weight: bold;">
                            ${initials}
                        </div>
                        <div class="ms-3">
                            <div class="fw-bold text-grammer-primary">${Utils.sanitizeString(user.user_name)}</div>
                            <small class="text-muted">Usuario activo</small>
                        </div>
                    </div>
                    <span class="grammer-badge bg-grammer-primary">${user.request_count}</span>
                </div>
            `;
            
            this.topUsersList.appendChild(userItem);
        });
    }
    
    /**
     * Muestra los detalles de una solicitud
     * @param {number} requestId 
     */
    async showRequestDetails(requestId) {
        try {
            const modalContent = document.getElementById('requestDetailsContent');
            modalContent.innerHTML = `
                <div class="text-center py-4">
                    <div class="spinner-border text-grammer-primary"></div>
                    <p class="mt-2 text-grammer-primary">Cargando detalles GRAMMER...</p>
                </div>
            `;
            
            this.requestDetailsModal.show();
            
            // Obtener detalles de la solicitud
            const requests = await API.getShippingRequests({ id: requestId });
            const request = requests.requests.find(r => r.id === requestId);
            
            if (!request) {
                throw new Error('Solicitud no encontrada');
            }
            
            modalContent.innerHTML = this.generateRequestDetailsHTML(request);
            
        } catch (error) {
            document.getElementById('requestDetailsContent').innerHTML = 
                '<div class="alert alert-danger">Error cargando detalles: ' + error.message + '</div>';
            Utils.handleError(error, 'Show request details');
        }
    }
    
    /**
     * Genera el HTML para los detalles de una solicitud con estilo GRAMMER
     * @param {Object} request 
     * @returns {string}
     */
    generateRequestDetailsHTML(request) {
        const serviceTypeNames = {
            'air': 'Aéreo',
            'sea': 'Marítimo', 
            'land': 'Terrestre'
        };
        
        const statusNames = {
            'pending': 'Pendiente',
            'quoting': 'Cotizando',
            'completed': 'Completado',
            'canceled': 'Cancelado'
        };
        
        return `
            <div class="row">
                <div class="col-md-6 mb-4">
                    <div class="grammer-info-card p-3">
                        <h6 class="text-grammer-primary mb-3">
                            <i class="fas fa-info-circle me-2"></i>Información General
                        </h6>
                        <div class="row g-3">
                            <div class="col-12">
                                <strong class="text-grammer-primary">ID:</strong>
                                <span class="ms-2">#${request.id}</span>
                            </div>
                            <div class="col-12">
                                <strong class="text-grammer-primary">Usuario:</strong>
                                <span class="ms-2">${Utils.sanitizeString(request.user_name)}</span>
                            </div>
                            <div class="col-12">
                                <strong class="text-grammer-primary">Servicio:</strong>
                                <span class="grammer-badge bg-grammer-secondary ms-2">
                                    ${serviceTypeNames[request.service_type]}
                                </span>
                            </div>
                            <div class="col-12">
                                <strong class="text-grammer-primary">Estado:</strong>
                                <span class="grammer-badge ${this.getStatusBadgeClass(request.status)} ms-2">
                                    ${statusNames[request.status]}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-6 mb-4">
                    <div class="grammer-info-card p-3">
                        <h6 class="text-grammer-primary mb-3">
                            <i class="fas fa-chart-bar me-2"></i>Estado de Cotizaciones
                        </h6>
                        <div class="row g-3">
                            <div class="col-6">
                                <div class="text-center">
                                    <div class="h4 text-grammer-accent">${request.quote_status.total_quotes}</div>
                                    <small class="text-muted">Total Recibidas</small>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="text-center">
                                    <div class="h4 text-grammer-success">${request.quote_status.selected_quotes}</div>
                                    <small class="text-muted">Seleccionadas</small>
                                </div>
                            </div>
                        </div>
                        
                        ${request.quote_status.has_quotes ? `
                        <div class="mt-3 text-center">
                            <button class="btn btn-grammer-primary" onclick="grammerDashboard.showQuotes(${request.id})">
                                <i class="fas fa-calculator me-2"></i>Ver Cotizaciones
                            </button>
                        </div>
                        ` : `
                        <div class="alert alert-warning mt-3 mb-0">
                            <i class="fas fa-clock me-2"></i>
                            Aún no se han recibido cotizaciones.
                        </div>
                        `}
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="col-md-6 mb-4">
                    <div class="grammer-info-card p-3">
                        <h6 class="text-grammer-primary mb-3">
                            <i class="fas fa-map-marker-alt me-2"></i>Origen
                        </h6>
                        <div class="text-grammer-primary">
                            <div><strong>País:</strong> ${request.origin_details.country}</div>
                            <div><strong>Código Postal:</strong> ${request.origin_details.postal_code}</div>
                            <div><strong>Dirección:</strong> ${request.origin_details.address}</div>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-6 mb-4">
                    <div class="grammer-info-card p-3">
                        <h6 class="text-grammer-primary mb-3">
                            <i class="fas fa-flag-checkered me-2"></i>Destino
                        </h6>
                        <div class="text-grammer-primary">
                            <div><strong>País:</strong> ${request.destination_details.country}</div>
                            <div><strong>Código Postal:</strong> ${request.destination_details.postal_code}</div>
                            <div><strong>Dirección:</strong> ${request.destination_details.address}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="grammer-info-card p-3">
                <h6 class="text-grammer-primary mb-3">
                    <i class="fas fa-box me-2"></i>Paquetes (${request.package_details.length})
                </h6>
                <div class="row">
                    ${request.package_details.map((pkg, index) => `
                        <div class="col-md-6 mb-3">
                            <div class="border rounded p-3 bg-light">
                                <strong class="text-grammer-primary">Paquete ${index + 1}</strong>
                                <div class="mt-2">
                                    <div><strong>Descripción:</strong> ${Utils.sanitizeString(pkg.description)}</div>
                                    <div><strong>Cantidad:</strong> ${pkg.quantity}</div>
                                    <div><strong>Peso:</strong> ${pkg.weight} kg</div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="alert alert-grammer-primary mt-3 mb-0">
                    <strong>Resumen Total:</strong><br>
                    <i class="fas fa-boxes me-2"></i>Paquetes: ${request.package_summary.total_packages} |
                    <i class="fas fa-weight me-2"></i>Peso: ${request.package_summary.total_weight} kg |
                    <i class="fas fa-cubes me-2"></i>Cantidad: ${request.package_summary.total_quantity}
                </div>
            </div>
        `;
    }
    
    /**
     * Muestra las cotizaciones de una solicitud
     * @param {number} requestId 
     */
    async showQuotes(requestId) {
        try {
            const modalContent = document.getElementById('quotesModalContent');
            modalContent.innerHTML = `
                <div class="text-center py-4">
                    <div class="spinner-border text-grammer-primary"></div>
                    <p class="mt-2 text-grammer-primary">Cargando cotizaciones GRAMMER...</p>
                </div>
            `;
            
            this.quotesModal.show();
            
            const quotesData = await API.getQuotes(requestId);
            
            if (!quotesData.quotes || quotesData.quotes.length === 0) {
                modalContent.innerHTML = '<div class="alert alert-info">No hay cotizaciones disponibles.</div>';
                return;
            }
            
            modalContent.innerHTML = this.generateQuotesHTML(quotesData);
            
        } catch (error) {
            document.getElementById('quotesModalContent').innerHTML = 
                '<div class="alert alert-danger">Error cargando cotizaciones: ' + error.message + '</div>';
            Utils.handleError(error, 'Show quotes');
        }
    }
    
    /**
     * Genera el HTML para las cotizaciones con estilo GRAMMER
     * @param {Object} quotesData 
     * @returns {string}
     */
    generateQuotesHTML(quotesData) {
        const quotes = quotesData.quotes;
        
        let html = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead class="bg-grammer-primary text-white">
                        <tr>
                            <th>Transportista</th>
                            <th>Costo</th>
                            <th>Tiempo</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        quotes.forEach(quote => {
            html += `
                <tr class="${quote.is_selected ? 'table-success' : ''}">
                    <td>
                        <strong class="text-grammer-primary">${quote.carrier_name}</strong><br>
                        <small class="text-muted">${quote.carrier_email}</small>
                    </td>
                    <td>
                        <span class="fw-bold text-grammer-success">${quote.cost_formatted}</span>
                        ${quote.is_best_price ? '<i class="fas fa-crown text-warning ms-1" title="Mejor precio"></i>' : ''}
                    </td>
                    <td>
                        ${quote.delivery_formatted}
                        ${quote.is_fastest ? '<i class="fas fa-bolt text-grammer-accent ms-1" title="Más rápido"></i>' : ''}
                    </td>
                    <td>
                        ${quote.is_selected ? 
                            '<span class="grammer-badge bg-grammer-success">Seleccionada</span>' : 
                            '<span class="grammer-badge bg-secondary">Disponible</span>'
                        }
                    </td>
                    <td>
                        ${!quote.is_selected ? `
                            <button class="btn btn-grammer-success btn-sm" onclick="grammerDashboard.selectQuote(${quote.id})">
                                <i class="fas fa-check me-1"></i>Seleccionar
                            </button>
                        ` : `
                            <i class="fas fa-check-circle text-grammer-success"></i>
                            Seleccionada
                        `}
                    </td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        return html;
    }
    
    /**
     * Selecciona una cotización
     * @param {number} quoteId 
     */
    async selectQuote(quoteId) {
        const result = await Notifications.confirm(
            '¿Seleccionar esta cotización GRAMMER?',
            'Esta acción marcará la cotización como seleccionada.',
            'Sí, seleccionar'
        );
        
        if (result.isConfirmed) {
            try {
                await API.selectQuote(quoteId);
                
                // Recargar cotizaciones
                const requestId = this.getCurrentRequestId();
                if (requestId) {
                    await this.showQuotes(requestId);
                }
                
                this.refreshData();
                
            } catch (error) {
                Notifications.toastError('Error seleccionando cotización');
                Utils.handleError(error, 'Select quote');
            }
        }
    }
    
    /**
     * Obtiene el ID de solicitud actual del modal
     * @returns {number|null}
     */
    getCurrentRequestId() {
        const modal = document.getElementById('quotesModal');
        return modal.dataset.requestId ? parseInt(modal.dataset.requestId) : null;
    }
    
    /**
     * Inicia el auto-refresh
     */
    startAutoRefresh() {
        this.pollingInstance = API.startRequestsPolling((data) => {
            this.updateRequestsTable(data.requests);
            this.updateStats(data.stats);
            this.updateCharts(data.stats);
            this.updateTopUsers(data.stats.top_users);
            
            this.lastUpdate = new Date();
            this.updateAutoRefreshIndicator();
        });
        
        console.log('🔄 Auto-refresh GRAMMER iniciado');
    }
    
    /**
     * Actualiza el indicador de auto-refresh
     */
    updateAutoRefreshIndicator() {
        if (this.lastUpdate) {
            const timeAgo = this.getTimeAgo(this.lastUpdate.toISOString());
            const small = this.autoRefreshIndicator.querySelector('small');
            if (small) {
                small.textContent = `Actualizado ${timeAgo}`;
            }
        }
    }
    
    /**
     * Maneja cambios de visibilidad de la página
     */
    handleVisibilityChange() {
        if (document.hidden) {
            if (this.pollingInstance) {
                this.pollingInstance.stop();
                console.log('⏸️ Auto-refresh pausado');
            }
        } else {
            this.startAutoRefresh();
            this.refreshData();
            console.log('▶️ Auto-refresh reanudado');
        }
    }
    
    /**
     * Muestra/oculta el estado de carga
     * @param {boolean} show 
     */
    showLoadingState(show) {
        this.loadingState.classList.toggle('d-none', !show);
        this.requestsTableBody.classList.toggle('d-none', show);
    }
    
    /**
     * Muestra/oculta el estado vacío
     * @param {boolean} show 
     */
    showEmptyState(show) {
        this.emptyState.classList.toggle('d-none', !show);
        this.requestsTableBody.classList.toggle('d-none', show);
    }
    
    /**
     * Calcula tiempo transcurrido
     * @param {string} dateString 
     * @returns {string}
     */
    getTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffMins < 1) return 'ahora mismo';
        if (diffMins < 60) return `hace ${diffMins} min`;
        if (diffHours < 24) return `hace ${diffHours}h`;
        return `hace ${diffDays}d`;
    }
    
    /**
     * Limpia recursos antes de salir
     */
    cleanup() {
        if (this.pollingInstance) {
            this.pollingInstance.stop();
        }
        
        // Limpiar charts
        Object.values(this.charts).forEach(chart => {
            if (chart && chart.destroy) {
                chart.destroy();
            }
        });
    }
}

// Instancia global para acceso desde HTML
let grammerDashboard;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    grammerDashboard = new GrammerDashboard();
    
    // Hacer disponible globalmente para onclick handlers
    window.grammerDashboard = grammerDashboard;
});
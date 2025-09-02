/**
 * JavaScript para dashboard.html - Portal de Cotización Inteligente
 * Manejo del dashboard principal con polling automático
 * @author Alejandro Pérez
 */

import API from './modules/api.js';
import Utils from './modules/utils.js';
import Notifications from './modules/notifications.js';

class Dashboard {
    
    constructor() {
        this.currentFilters = {};
        this.pollingInstance = null;
        this.charts = {};
        this.lastUpdate = null;
        
        this.initializeElements();
        this.setupEventListeners();
        this.initializeCharts();
        this.loadInitialData();
        this.startAutoRefresh();
        
        console.log('📊 Dashboard inicializado');
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
        
        // Charts
        this.activityChart = document.getElementById('activityChart');
        this.servicesChart = document.getElementById('servicesChart');
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
            // Si hay un request_id en la URL, mostrarlo automáticamente
            setTimeout(() => this.showRequestDetails(parseInt(urlParams.request_id)), 1000);
        }
        
        // Eventos de visibilidad para pausar/reanudar polling
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
        
        // Cleanup antes de salir
        window.addEventListener('beforeunload', this.cleanup.bind(this));
    }
    
    /**
     * Inicializa los gráficos con Chart.js
     */
    initializeCharts() {
        // Gráfico de actividad
        const activityCtx = this.activityChart.getContext('2d');
        this.charts.activity = new Chart(activityCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Solicitudes',
                    data: [],
                    borderColor: 'rgb(52, 152, 219)',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'Completadas',
                    data: [],
                    borderColor: 'rgb(39, 174, 96)',
                    backgroundColor: 'rgba(39, 174, 96, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
        
        // Gráfico de servicios (pie)
        const servicesCtx = this.servicesChart.getContext('2d');
        this.charts.services = new Chart(servicesCtx, {
            type: 'doughnut',
            data: {
                labels: ['Aéreo', 'Marítimo', 'Terrestre'],
                datasets: [{
                    data: [0, 0, 0],
                    backgroundColor: [
                        'rgb(52, 152, 219)',
                        'rgb(26, 188, 156)',
                        'rgb(230, 126, 34)'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom'
                    }
                }
            }
        });
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
            
            console.log('📊 Datos actualizados exitosamente');
            
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
        
        console.log('🔍 Aplicando filtros:', this.currentFilters);
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
        
        // Status class para hover effects
        row.classList.add(`status-${request.status}`);
        
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
            <td data-label="ID">#${request.id}</td>
            <td data-label="Usuario">
                <div class="user-info">
                    <strong>${Utils.sanitizeString(request.user_name)}</strong>
                    <small class="text-muted d-block">${request.created_at_formatted}</small>
                </div>
            </td>
            <td data-label="Ruta">
                <span class="route-info">
                    ${route}
                    ${request.route_info.is_international ? '<i class="fas fa-globe text-info ms-1" title="Internacional"></i>' : '<i class="fas fa-map-marker-alt text-secondary ms-1" title="Nacional"></i>'}
                </span>
            </td>
            <td data-label="Servicio">
                <span class="service-badge service-${request.service_type}">
                    ${serviceName}
                </span>
            </td>
            <td data-label="Estado">
                <span class="status-badge status-${request.status}">
                    ${statusName}
                </span>
            </td>
            <td data-label="Cotizaciones">
                <span class="quotes-indicator ${request.quote_status.has_quotes ? 'has-quotes' : 'no-quotes'}">
                    <i class="fas ${request.quote_status.has_quotes ? 'fa-check-circle' : 'fa-clock'}"></i>
                    ${request.quote_status.total_quotes}
                    ${request.quote_status.selected_quotes > 0 ? `(${request.quote_status.selected_quotes} seleccionada)` : ''}
                </span>
            </td>
            <td data-label="Fecha">
                <span class="text-nowrap">${request.created_at_formatted}</span>
                <small class="text-muted d-block">${this.getTimeAgo(request.created_at)}</small>
            </td>
            <td data-label="Acciones">
                <div class="action-buttons">
                    <button class="btn btn-view action-btn" onclick="dashboard.showRequestDetails(${request.id})" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-quotes action-btn ${request.quote_status.has_quotes ? '' : 'disabled'}" 
                            onclick="dashboard.showQuotes(${request.id})" 
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
     * Actualiza los gráficos
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
            
            this.charts.activity.data.labels = labels;
            this.charts.activity.data.datasets[0].data = requestsData;
            this.charts.activity.data.datasets[1].data = completedData;
            this.charts.activity.update();
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
            
            this.charts.services.data.datasets[0].data = serviceData;
            this.charts.services.update();
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
            userItem.className = 'top-user-item';
            
            // Obtener iniciales del usuario
            const initials = user.user_name
                .split(' ')
                .map(name => name.charAt(0))
                .join('')
                .substring(0, 2)
                .toUpperCase();
            
            userItem.innerHTML = `
                <div class="top-user-info">
                    <div class="top-user-avatar">
                        ${initials}
                    </div>
                    <div class="top-user-name">${Utils.sanitizeString(user.user_name)}</div>
                </div>
                <span class="top-user-count">${user.request_count}</span>
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
            modalContent.innerHTML = '<div class="text-center py-4"><div class="spinner-border"></div><p class="mt-2">Cargando detalles...</p></div>';
            
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
     * Genera el HTML para los detalles de una solicitud
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
            <div class="request-detail-section">
                <h6><i class="fas fa-info-circle me-2"></i>Información General</h6>
                <div class="detail-grid">
                    <div class="detail-item">
                        <div class="label">ID de Solicitud</div>
                        <div class="value">#${request.id}</div>
                    </div>
                    <div class="detail-item">
                        <div class="label">Usuario Solicitante</div>
                        <div class="value">${Utils.sanitizeString(request.user_name)}</div>
                    </div>
                    <div class="detail-item">
                        <div class="label">Tipo de Servicio</div>
                        <div class="value">
                            <span class="service-badge service-${request.service_type}">
                                ${serviceTypeNames[request.service_type]}
                            </span>
                        </div>
                    </div>
                    <div class="detail-item">
                        <div class="label">Estado</div>
                        <div class="value">
                            <span class="status-badge status-${request.status}">
                                ${statusNames[request.status]}
                            </span>
                        </div>
                    </div>
                    <div class="detail-item">
                        <div class="label">Fecha de Creación</div>
                        <div class="value">${request.created_at_formatted}</div>
                    </div>
                    <div class="detail-item">
                        <div class="label">Última Actualización</div>
                        <div class="value">${request.updated_at_formatted}</div>
                    </div>
                </div>
            </div>

            <div class="request-detail-section">
                <h6><i class="fas fa-map-marker-alt me-2"></i>Información de Origen</h6>
                <div class="detail-grid">
                    <div class="detail-item">
                        <div class="label">País</div>
                        <div class="value">${request.origin_details.country}</div>
                    </div>
                    <div class="detail-item">
                        <div class="label">Código Postal</div>
                        <div class="value">${request.origin_details.postal_code}</div>
                    </div>
                    <div class="detail-item">
                        <div class="label">Dirección</div>
                        <div class="value">${request.origin_details.address}</div>
                    </div>
                    ${request.origin_details.contact ? `
                    <div class="detail-item">
                        <div class="label">Contacto</div>
                        <div class="value">${request.origin_details.contact}</div>
                    </div>
                    ` : ''}
                </div>
            </div>

            <div class="request-detail-section">
                <h6><i class="fas fa-flag-checkered me-2"></i>Información de Destino</h6>
                <div class="detail-grid">
                    <div class="detail-item">
                        <div class="label">País</div>
                        <div class="value">${request.destination_details.country}</div>
                    </div>
                    <div class="detail-item">
                        <div class="label">Código Postal</div>
                        <div class="value">${request.destination_details.postal_code}</div>
                    </div>
                    <div class="detail-item">
                        <div class="label">Dirección</div>
                        <div class="value">${request.destination_details.address}</div>
                    </div>
                    ${request.destination_details.contact ? `
                    <div class="detail-item">
                        <div class="label">Contacto</div>
                        <div class="value">${request.destination_details.contact}</div>
                    </div>
                    ` : ''}
                </div>
            </div>

            <div class="request-detail-section">
                <h6><i class="fas fa-box me-2"></i>Detalles de Paquetes</h6>
                ${request.package_details.map((pkg, index) => `
                    <div class="card mb-3">
                        <div class="card-header bg-light">
                            <strong>Paquete ${index + 1}</strong>
                        </div>
                        <div class="card-body">
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <div class="label">Descripción</div>
                                    <div class="value">${Utils.sanitizeString(pkg.description)}</div>
                                </div>
                                <div class="detail-item">
                                    <div class="label">Cantidad</div>
                                    <div class="value">${pkg.quantity}</div>
                                </div>
                                <div class="detail-item">
                                    <div class="label">Peso</div>
                                    <div class="value">${pkg.weight} kg</div>
                                </div>
                                ${pkg.dimensions && (pkg.dimensions.length || pkg.dimensions.width || pkg.dimensions.height) ? `
                                <div class="detail-item">
                                    <div class="label">Dimensiones</div>
                                    <div class="value">${pkg.dimensions.length || 0} × ${pkg.dimensions.width || 0} × ${pkg.dimensions.height || 0} cm</div>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `).join('')}
                
                <div class="alert alert-info">
                    <strong>Resumen Total:</strong><br>
                    <i class="fas fa-boxes me-2"></i>Total de paquetes: ${request.package_summary.total_packages}<br>
                    <i class="fas fa-weight me-2"></i>Peso total: ${request.package_summary.total_weight} kg<br>
                    <i class="fas fa-cubes me-2"></i>Cantidad total: ${request.package_summary.total_quantity} unidades
                </div>
            </div>

            <div class="request-detail-section">
                <h6><i class="fas fa-chart-bar me-2"></i>Estado de Cotizaciones</h6>
                <div class="detail-grid">
                    <div class="detail-item">
                        <div class="label">Total Recibidas</div>
                        <div class="value">${request.quote_status.total_quotes}</div>
                    </div>
                    <div class="detail-item">
                        <div class="label">Seleccionadas</div>
                        <div class="value">${request.quote_status.selected_quotes}</div>
                    </div>
                </div>
                
                ${request.quote_status.has_quotes ? `
                <div class="mt-3">
                    <button class="btn btn-custom-primary" onclick="dashboard.showQuotes(${request.id})">
                        <i class="fas fa-calculator me-2"></i>Ver Todas las Cotizaciones
                    </button>
                </div>
                ` : `
                <div class="alert alert-warning mt-3">
                    <i class="fas fa-clock me-2"></i>
                    Aún no se han recibido cotizaciones para esta solicitud.
                </div>
                `}
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
            modalContent.innerHTML = '<div class="text-center py-4"><div class="spinner-border"></div><p class="mt-2">Cargando cotizaciones...</p></div>';
            
            this.quotesModal.show();
            
            const quotesData = await API.getQuotes(requestId);
            
            if (!quotesData.quotes || quotesData.quotes.length === 0) {
                modalContent.innerHTML = '<div class="alert alert-info">No hay cotizaciones disponibles para esta solicitud.</div>';
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
     * Genera el HTML para las cotizaciones
     * @param {Object} quotesData 
     * @returns {string}
     */
    generateQuotesHTML(quotesData) {
        const quotes = quotesData.quotes;
        const analysis = quotesData.analysis;
        const recommendations = quotesData.recommendations;
        
        let html = '';
        
        // Análisis general
        if (analysis) {
            html += `
                <div class="alert alert-info mb-4">
                    <h6><i class="fas fa-brain me-2"></i>Análisis Inteligente</h6>
                    <p class="mb-2">${analysis.summary}</p>
                    ${analysis.recommendations && analysis.recommendations.length > 0 ? `
                        <ul class="mb-0">
                            ${analysis.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                        </ul>
                    ` : ''}
                </div>
            `;
        }
        
        // Tabla de cotizaciones
        html += `
            <div class="table-responsive">
                <table class="table table-hover quotes-table">
                    <thead class="table-dark">
                        <tr>
                            <th>Transportista</th>
                            <th>Costo</th>
                            <th>Tiempo de Entrega</th>
                            <th>Análisis IA</th>
                            <th>Recibida</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        quotes.forEach(quote => {
            const rowClasses = [];
            if (quote.is_selected) rowClasses.push('selected');
            if (quote.is_best_price) rowClasses.push('best-price');
            if (quote.is_fastest) rowClasses.push('fastest');
            
            const confidenceClass = quote.ai_confidence > 0.7 ? 'high' : 
                                   (quote.ai_confidence > 0.4 ? 'medium' : 'low');
            
            html += `
                <tr class="quote-row ${rowClasses.join(' ')}">
                    <td>
                        <strong>${quote.carrier_name}</strong><br>
                        <small class="text-muted">${quote.carrier_email}</small>
                    </td>
                    <td>
                        <span class="cost-display">${quote.cost_formatted}</span>
                    </td>
                    <td>
                        ${quote.delivery_formatted}<br>
                        ${quote.delivery_days > 0 ? `<small class="text-muted">(${quote.delivery_days} días)</small>` : ''}
                    </td>
                    <td>
                        ${quote.has_ai_analysis ? `
                            <span class="ai-confidence ${confidenceClass}">
                                ${Math.round(quote.ai_confidence * 100)}% confianza
                            </span><br>
                            <small class="text-muted">${quote.ai_summary}</small>
                        ` : '<span class="text-muted">Sin análisis</span>'}
                    </td>
                    <td>
                        ${quote.created_at_formatted}<br>
                        <small class="text-muted">${quote.time_ago}</small>
                    </td>
                    <td>
                        ${quote.is_selected ? 
                            '<span class="badge bg-success">Seleccionada</span>' : 
                            '<span class="badge bg-secondary">Disponible</span>'
                        }
                    </td>
                    <td>
                        ${!quote.is_selected ? `
                            <button class="btn btn-success btn-sm" onclick="dashboard.selectQuote(${quote.id})">
                                <i class="fas fa-check me-1"></i>Seleccionar
                            </button>
                        ` : `
                            <span class="text-success">
                                <i class="fas fa-check-circle me-1"></i>Seleccionada
                            </span>
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
            '¿Seleccionar esta cotización?',
            'Esta acción marcará la cotización como seleccionada y se agregará a la cola de procesamiento SAP.',
            'Sí, seleccionar'
        );
        
        if (result.isConfirmed) {
            try {
                await API.selectQuote(quoteId);
                
                // Recargar las cotizaciones para mostrar el estado actualizado
                const requestId = this.getCurrentRequestId();
                if (requestId) {
                    await this.showQuotes(requestId);
                }
                
                // Actualizar la tabla principal
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
        
        console.log('🔄 Auto-refresh iniciado');
    }
    
    /**
     * Actualiza el indicador de auto-refresh
     */
    updateAutoRefreshIndicator() {
        if (this.lastUpdate) {
            const timeAgo = this.getTimeAgo(this.lastUpdate.toISOString());
            this.autoRefreshIndicator.querySelector('small').textContent = 
                `Actualizado ${timeAgo}`;
        }
    }
    
    /**
     * Maneja cambios de visibilidad de la página
     */
    handleVisibilityChange() {
        if (document.hidden) {
            // Pausar polling cuando la página no está visible
            if (this.pollingInstance) {
                this.pollingInstance.stop();
                console.log('⏸️ Auto-refresh pausado');
            }
        } else {
            // Reanudar polling cuando la página vuelve a estar visible
            this.startAutoRefresh();
            this.refreshData(); // Actualizar inmediatamente
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
            if (chart) chart.destroy();
        });
    }
}

// Instancia global para acceso desde HTML
let dashboard;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new Dashboard();
    
    // Hacer disponible globalmente para onclick handlers
    window.dashboard = dashboard;
});
<?php
/**
 * Endpoint to get quote requests - GRAMMER Version
 * Intelligent Quoting Portal with support for multiple shipping methods
 * @author Alejandro Pérez (Updated for GRAMMER)
 */

require_once __DIR__ . '/config.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(false, 'Method not allowed. Use POST.', null, 405);
}

$conex = null;

try {
    $conex = getDbConnection();
    if (!$conex) {
        throw new Exception('Database connection failed');
    }

    $input = file_get_contents('php://input');
    $filters = json_decode($input, true) ?? [];

    // Construir consulta base usando la vista consolidada
    $sql = "SELECT 
                sr.id, 
                sr.internal_reference,
                sr.user_name, 
                sr.company_area,
                sr.status, 
                sr.shipping_method,
                sr.service_type,
                sr.origin_details, 
                sr.destination_details, 
                sr.package_details,
                sr.method_specific_data,
                sr.created_at, 
                sr.updated_at,
                COUNT(q.id) as quotes_count,
                COUNT(CASE WHEN q.is_selected = 1 THEN 1 END) as selected_quotes
            FROM shipping_requests sr
            LEFT JOIN quotes q ON sr.id = q.request_id";

    $whereConditions = [];
    $params = [];
    $types = '';

    // Aplicar filtros
    if (!empty($filters['status'])) {
        $whereConditions[] = "sr.status = ?";
        $params[] = $filters['status'];
        $types .= 's';
    }

    if (!empty($filters['shipping_method'])) {
        $whereConditions[] = "sr.shipping_method = ?";
        $params[] = $filters['shipping_method'];
        $types .= 's';
    }

    if (!empty($filters['service_type'])) {
        $whereConditions[] = "sr.service_type = ?";
        $params[] = $filters['service_type'];
        $types .= 's';
    }

    if (!empty($filters['user_name'])) {
        $whereConditions[] = "sr.user_name LIKE ?";
        $params[] = '%' . $filters['user_name'] . '%';
        $types .= 's';
    }

    if (!empty($filters['date_from'])) {
        $whereConditions[] = "DATE(sr.created_at) >= ?";
        $params[] = $filters['date_from'];
        $types .= 's';
    }

    if (!empty($filters['date_to'])) {
        $whereConditions[] = "DATE(sr.created_at) <= ?";
        $params[] = $filters['date_to'];
        $types .= 's';
    }

    if (!empty($filters['id'])) {
        $whereConditions[] = "sr.id = ?";
        $params[] = $filters['id'];
        $types .= 'i';
    }

    // Agregar WHERE si hay condiciones
    if (!empty($whereConditions)) {
        $sql .= " WHERE " . implode(" AND ", $whereConditions);
    }

    $sql .= " GROUP BY sr.id ORDER BY sr.created_at DESC";

    // Agregar LIMIT si se especifica
    if (isset($filters['limit']) && is_numeric($filters['limit'])) {
        $sql .= " LIMIT ?";
        $params[] = intval($filters['limit']);
        $types .= 'i';
    }

    $stmt = $conex->prepare($sql);
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    $stmt->execute();
    $result = $stmt->get_result();

    $requests = [];
    while ($row = $result->fetch_assoc()) {
        $processedRequest = processRequestRow($row, $conex);
        $requests[] = $processedRequest;
    }
    $stmt->close();

    // Generar estadísticas si se solicita
    $stats = [];
    if (empty($filters['id'])) { // No generar stats para consultas específicas
        $stats = generateRequestStats($conex, $filters);
    }

    sendJsonResponse(true, 'Requests retrieved successfully', [
        'requests' => $requests,
        'total' => count($requests),
        'stats' => $stats
    ]);

} catch (Exception $e) {
    writeLog('error', 'Error getting requests: ' . $e->getMessage(), $filters ?? []);
    sendJsonResponse(false, 'Error getting requests: ' . $e->getMessage(), ['filters' => $filters ?? null], 500);
} finally {
    if ($conex) {
        $conex->close();
    }
}

/**
 * Procesa una fila de solicitud para formato de respuesta
 */
function processRequestRow($row, $conex) {
    $request = [
        'id' => (int)$row['id'],
        'internal_reference' => $row['internal_reference'],
        'user_name' => $row['user_name'],
        'company_area' => $row['company_area'],
        'status' => $row['status'],
        'shipping_method' => $row['shipping_method'],
        'service_type' => $row['service_type'],
        'created_at' => $row['created_at'],
        'updated_at' => $row['updated_at'],
        'created_at_formatted' => formatDateTime($row['created_at']),
        'updated_at_formatted' => formatDateTime($row['updated_at']),
        'quote_status' => [
            'total_quotes' => (int)$row['quotes_count'],
            'selected_quotes' => (int)$row['selected_quotes'],
            'has_quotes' => $row['quotes_count'] > 0
        ]
    ];

    // Procesar datos específicos del método
    if (!empty($row['shipping_method'])) {
        $methodDetails = getMethodSpecificDetails($conex, $row['id'], $row['shipping_method']);
        $request['method_details'] = $methodDetails;
        
        // Generar información de ruta basada en el método
        $request['route_info'] = generateRouteInfo($methodDetails, $row['shipping_method']);
    } else {
        // Solicitud tradicional - usar campos legacy
        $request['origin_details'] = json_decode($row['origin_details'], true);
        $request['destination_details'] = json_decode($row['destination_details'], true);
        $request['package_details'] = json_decode($row['package_details'], true);
        
        $request['route_info'] = generateLegacyRouteInfo($request['origin_details'], $request['destination_details']);
        $request['package_summary'] = generatePackageSummary($request['package_details']);
    }

    return $request;
}

/**
 * Obtiene detalles específicos del método desde las tablas correspondientes
 */
function getMethodSpecificDetails($conex, $requestId, $method) {
    switch ($method) {
        case 'fedex':
            return getFedexDetails($conex, $requestId);
        case 'aereo_maritimo':
            return getAereoMaritimoDetails($conex, $requestId);
        case 'nacional':
            return getNacionalDetails($conex, $requestId);
        default:
            return null;
    }
}

/**
 * Obtiene detalles de solicitud Fedex
 */
function getFedexDetails($conex, $requestId) {
    $stmt = $conex->prepare("SELECT * FROM fedex_requests WHERE request_id = ?");
    $stmt->bind_param("i", $requestId);
    $stmt->execute();
    $result = $stmt->get_result();
    $data = $result->fetch_assoc();
    $stmt->close();
    
    return $data;
}

/**
 * Obtiene detalles de solicitud Aéreo-Marítimo
 */
function getAereoMaritimoDetails($conex, $requestId) {
    $stmt = $conex->prepare("SELECT * FROM aereo_maritimo_requests WHERE request_id = ?");
    $stmt->bind_param("i", $requestId);
    $stmt->execute();
    $result = $stmt->get_result();
    $data = $result->fetch_assoc();
    $stmt->close();
    
    return $data;
}

/**
 * Obtiene detalles de solicitud Nacional
 */
function getNacionalDetails($conex, $requestId) {
    $stmt = $conex->prepare("SELECT * FROM nacional_requests WHERE request_id = ?");
    $stmt->bind_param("i", $requestId);
    $stmt->execute();
    $result = $stmt->get_result();
    $data = $result->fetch_assoc();
    $stmt->close();
    
    return $data;
}

/**
 * Genera información de ruta para métodos GRAMMER
 */
function generateRouteInfo($methodDetails, $shippingMethod) {
    if (!$methodDetails) {
        return [
            'origin_country' => 'N/A',
            'destination_country' => 'N/A',
            'is_international' => false
        ];
    }

    switch ($shippingMethod) {
        case 'fedex':
            return [
                'origin_country' => extractCountryFromAddress($methodDetails['origin_address']),
                'destination_country' => extractCountryFromAddress($methodDetails['destination_address']),
                'is_international' => true // Fedex típicamente internacional
            ];
            
        case 'aereo_maritimo':
            return [
                'origin_country' => extractCountryFromAddress($methodDetails['pickup_address']),
                'destination_country' => extractCountryFromAddress($methodDetails['delivery_place']),
                'is_international' => true
            ];
            
        case 'nacional':
            return [
                'origin_country' => 'MX',
                'destination_country' => 'MX',
                'is_international' => false
            ];
            
        default:
            return [
                'origin_country' => 'N/A',
                'destination_country' => 'N/A',  
                'is_international' => false
            ];
    }
}

/**
 * Genera información de ruta para solicitudes legacy
 */
function generateLegacyRouteInfo($origin, $destination) {
    return [
        'origin_country' => $origin['country'] ?? 'N/A',
        'destination_country' => $destination['country'] ?? 'N/A',
        'is_international' => ($origin['country'] ?? '') !== ($destination['country'] ?? '')
    ];
}

/**
 * Extrae país de una dirección (función auxiliar)
 */
function extractCountryFromAddress($address) {
    // Lógica simple - en un sistema real se podría usar API de geolocalización
    if (stripos($address, 'méxico') !== false || stripos($address, 'mexico') !== false) {
        return 'MX';
    } elseif (stripos($address, 'estados unidos') !== false || stripos($address, 'usa') !== false) {
        return 'US';
    } elseif (stripos($address, 'querétaro') !== false || stripos($address, 'queretaro') !== false) {
        return 'MX';
    } else {
        return 'INTL';
    }
}

/**
 * Genera resumen de paquetes para solicitudes legacy
 */
function generatePackageSummary($packages) {
    if (!is_array($packages)) return null;
    
    $totalPackages = count($packages);
    $totalWeight = 0;
    $totalQuantity = 0;
    
    foreach ($packages as $package) {
        $totalWeight += (float)($package['weight'] ?? 0);
        $totalQuantity += (int)($package['quantity'] ?? 0);
    }
    
    return [
        'total_packages' => $totalPackages,
        'total_weight' => $totalWeight,
        'total_quantity' => $totalQuantity
    ];
}

/**
 * Genera estadísticas generales
 */
function generateRequestStats($conex, $filters = []) {
    $stats = [];
    
    try {
        // Estadísticas básicas
        $basicStats = getBasicStats($conex, $filters);
        $stats['basic'] = $basicStats;
        
        // Estadísticas por método de envío
        $methodStats = getMethodStats($conex, $filters);
        $stats['by_shipping_method'] = $methodStats;
        
        // Estadísticas por tipo de servicio (legacy)
        $serviceStats = getServiceTypeStats($conex, $filters);
        $stats['by_service_type'] = $serviceStats;
        
        // Actividad reciente (últimos 7 días)
        $recentActivity = getRecentActivity($conex);
        $stats['recent_activity'] = $recentActivity;
        
        // Top usuarios
        $topUsers = getTopUsers($conex, $filters);
        $stats['top_users'] = $topUsers;
        
    } catch (Exception $e) {
        writeLog('warning', 'Error generating stats: ' . $e->getMessage());
        $stats['error'] = 'Stats not available';
    }
    
    return $stats;
}

/**
 * Obtiene estadísticas básicas
 */
function getBasicStats($conex, $filters) {
    $whereClause = buildWhereClause($filters);
    
    $sql = "SELECT 
                COUNT(*) as total_requests,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
                COUNT(CASE WHEN status = 'quoting' THEN 1 END) as quoting,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
                COUNT(CASE WHEN status = 'canceled' THEN 1 END) as canceled
            FROM shipping_requests" . $whereClause['sql'];
    
    $stmt = $conex->prepare($sql);
    if (!empty($whereClause['params'])) {
        $stmt->bind_param($whereClause['types'], ...$whereClause['params']);
    }
    $stmt->execute();
    $result = $stmt->get_result();
    $stats = $result->fetch_assoc();
    $stmt->close();
    
    return $stats;
}

/**
 * Obtiene estadísticas por método de envío
 */
function getMethodStats($conex, $filters) {
    $whereClause = buildWhereClause($filters);
    
    $sql = "SELECT 
                COALESCE(shipping_method, 'legacy') as shipping_method,
                COUNT(*) as count
            FROM shipping_requests" . $whereClause['sql'] . "
            GROUP BY COALESCE(shipping_method, 'legacy')";
    
    $stmt = $conex->prepare($sql);
    if (!empty($whereClause['params'])) {
        $stmt->bind_param($whereClause['types'], ...$whereClause['params']);
    }
    $stmt->execute();
    $result = $stmt->get_result();
    
    $stats = [];
    while ($row = $result->fetch_assoc()) {
        $stats[] = $row;
    }
    $stmt->close();
    
    return $stats;
}

/**
 * Obtiene estadísticas por tipo de servicio
 */
function getServiceTypeStats($conex, $filters) {
    $whereClause = buildWhereClause($filters);
    
    $sql = "SELECT 
                service_type,
                COUNT(*) as count
            FROM shipping_requests" . $whereClause['sql'] . "
            GROUP BY service_type";
    
    $stmt = $conex->prepare($sql);
    if (!empty($whereClause['params'])) {
        $stmt->bind_param($whereClause['types'], ...$whereClause['params']);
    }
    $stmt->execute();
    $result = $stmt->get_result();
    
    $stats = [];
    while ($row = $result->fetch_assoc()) {
        $stats[] = $row;
    }
    $stmt->close();
    
    return $stats;
}

/**
 * Obtiene actividad reciente
 */
function getRecentActivity($conex) {
    $sql = "SELECT 
                DATE(created_at) as date,
                COUNT(*) as requests,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
            FROM shipping_requests 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date DESC";
    
    $stmt = $conex->prepare($sql);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $activity = [];
    while ($row = $result->fetch_assoc()) {
        $activity[] = $row;
    }
    $stmt->close();
    
    return $activity;
}

/**
 * Obtiene usuarios más activos
 */
function getTopUsers($conex, $filters) {
    $whereClause = buildWhereClause($filters);
    
    $sql = "SELECT 
                user_name,
                COUNT(*) as request_count
            FROM shipping_requests" . $whereClause['sql'] . "
            GROUP BY user_name
            ORDER BY request_count DESC
            LIMIT 10";
    
    $stmt = $conex->prepare($sql);
    if (!empty($whereClause['params'])) {
        $stmt->bind_param($whereClause['types'], ...$whereClause['params']);
    }
    $stmt->execute();
    $result = $stmt->get_result();
    
    $users = [];
    while ($row = $result->fetch_assoc()) {
        $users[] = $row;
    }
    $stmt->close();
    
    return $users;
}

/**
 * Construye cláusula WHERE para filtros
 */
function buildWhereClause($filters) {
    $conditions = [];
    $params = [];
    $types = '';
    
    if (!empty($filters['status'])) {
        $conditions[] = "status = ?";
        $params[] = $filters['status'];
        $types .= 's';
    }
    
    if (!empty($filters['shipping_method'])) {
        $conditions[] = "shipping_method = ?";
        $params[] = $filters['shipping_method'];
        $types .= 's';
    }
    
    if (!empty($filters['date_from'])) {
        $conditions[] = "DATE(created_at) >= ?";
        $params[] = $filters['date_from'];
        $types .= 's';
    }
    
    if (!empty($filters['date_to'])) {
        $conditions[] = "DATE(created_at) <= ?";
        $params[] = $filters['date_to'];
        $types .= 's';
    }
    
    $sql = '';
    if (!empty($conditions)) {
        $sql = " WHERE " . implode(" AND ", $conditions);
    }
    
    return [
        'sql' => $sql,
        'params' => $params,
        'types' => $types
    ];
}

/**
 * Formatea fecha y hora para visualización
 */
function formatDateTime($datetime) {
    if (!$datetime) return '';
    
    $date = new DateTime($datetime);
    $date->setTimezone(new DateTimeZone(TIMEZONE));
    
    return $date->format('d/m/Y H:i');
}
?>
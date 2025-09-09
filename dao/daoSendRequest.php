<?php
/**
 * Endpoint para gestionar solicitudes de envío GRAMMER
 * @author Alejandro Pérez
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config/database.php';
require_once '../includes/validation.php';
require_once '../includes/email_sender.php';

try {
    $method = $_SERVER['REQUEST_METHOD'];
    
    switch ($method) {
        case 'POST':
            handleCreateRequest();
            break;
        case 'GET':
            handleGetRequests();
            break;
        default:
            throw new Exception('Método no permitido');
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => true,
        'message' => $e->getMessage()
    ]);
}

function handleCreateRequest() {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception('Datos inválidos');
    }
    
    // Validar campos requeridos
    $required = ['shipping_method', 'user_name', 'company_area', 'method_data'];
    foreach ($required as $field) {
        if (empty($input[$field])) {
            throw new Exception("Campo requerido: $field");
        }
    }
    
    $shipping_method = $input['shipping_method'];
    $method_data = $input['method_data'];
    
    // Determinar tipo de servicio basado en el método
    $service_type_map = [
        'fedex' => 'air',
        'aereo_maritimo' => 'sea',
        'nacional' => 'land'
    ];
    
    $service_type = $service_type_map[$shipping_method] ?? 'air';
    
    try {
        $pdo->beginTransaction();
        
        // Insertar solicitud principal
        $stmt = $pdo->prepare("
            INSERT INTO shipping_requests 
            (user_name, company_area, service_type, shipping_method, origin_details, destination_details, package_details)
            VALUES (?, ?, ?, ?, '{}', '{}', '{}')
        ");
        
        $stmt->execute([
            $input['user_name'],
            $input['company_area'],
            $service_type,
            $shipping_method
        ]);
        
        $request_id = $pdo->lastInsertId();
        
        // Insertar datos específicos del método
        switch ($shipping_method) {
            case 'fedex':
                insertFedexRequest($pdo, $request_id, $method_data);
                break;
                
            case 'aereo_maritimo':
                insertAereoMaritimoRequest($pdo, $request_id, $method_data);
                break;
                
            case 'nacional':
                insertNacionalRequest($pdo, $request_id, $method_data);
                break;
                
            default:
                throw new Exception('Método de envío no soportado');
        }
        
        // Obtener la referencia interna generada
        $stmt = $pdo->prepare("SELECT internal_reference FROM shipping_requests WHERE id = ?");
        $stmt->execute([$request_id]);
        $internal_reference = $stmt->fetchColumn();
        
        $pdo->commit();
        
        // Enviar emails a transportistas (asíncrono)
        sendQuoteRequestEmails($request_id, $shipping_method, $method_data);
        
        echo json_encode([
            'success' => true,
            'id' => $request_id,
            'internal_reference' => $internal_reference,
            'message' => 'Solicitud GRAMMER creada exitosamente'
        ]);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

function insertFedexRequest($pdo, $request_id, $data) {
    $stmt = $pdo->prepare("
        INSERT INTO fedex_requests (
            request_id, origin_company_name, origin_address, origin_contact_name,
            origin_contact_phone, origin_contact_email, destination_company_name,
            destination_address, destination_contact_name, destination_contact_phone,
            destination_contact_email, total_packages, total_weight, weight_unit,
            package_dimensions, measurement_units, order_number, merchandise_description,
            merchandise_type, merchandise_material
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->execute([
        $request_id,
        $data['origin_company_name'] ?? '',
        $data['origin_address'] ?? '',
        $data['origin_contact_name'] ?? '',
        $data['origin_contact_phone'] ?? '',
        $data['origin_contact_email'] ?? '',
        $data['destination_company_name'] ?? '',
        $data['destination_address'] ?? '',
        $data['destination_contact_name'] ?? '',
        $data['destination_contact_phone'] ?? '',
        $data['destination_contact_email'] ?? '',
        $data['total_packages'] ?? 1,
        $data['total_weight'] ?? 0,
        'kg', // weight_unit por defecto
        $data['package_dimensions'] ?? '',
        $data['measurement_units'] ?? '',
        $data['order_number'] ?? '',
        $data['merchandise_description'] ?? '',
        $data['merchandise_type'] ?? '',
        $data['merchandise_material'] ?? ''
    ]);
}

function insertAereoMaritimoRequest($pdo, $request_id, $data) {
    $stmt = $pdo->prepare("
        INSERT INTO aereo_maritimo_requests (
            request_id, total_pallets, total_boxes, weight_per_unit, weight_unit,
            unit_length, unit_width, unit_height, dimension_unit, pickup_date,
            pickup_address, ship_hours_start, ship_hours_end, contact_name,
            contact_phone, contact_email, incoterm, delivery_type, 
            delivery_point_type, delivery_company_name, delivery_place,
            delivery_date_plant, order_number
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->execute([
        $request_id,
        $data['total_pallets'] ?? 0,
        $data['total_boxes'] ?? 0,
        $data['weight_per_unit'] ?? 0,
        'kg', // weight_unit por defecto
        $data['unit_length'] ?? null,
        $data['unit_width'] ?? null,
        $data['unit_height'] ?? null,
        'cm', // dimension_unit por defecto
        $data['pickup_date'] ?? null,
        $data['pickup_address'] ?? '',
        $data['ship_hours_start'] ?? null,
        $data['ship_hours_end'] ?? null,
        $data['contact_name'] ?? '',
        $data['contact_phone'] ?? '',
        $data['contact_email'] ?? '',
        $data['incoterm'] ?? '',
        $data['delivery_type'] ?? null,
        $data['delivery_point_type'] ?? null, // Nuevo campo
        $data['delivery_company_name'] ?? '', // Nuevo campo
        $data['delivery_place'] ?? '',
        $data['delivery_date_plant'] ?? null,
        $data['order_number'] ?? ''
    ]);
}

function insertNacionalRequest($pdo, $request_id, $data) {
    $stmt = $pdo->prepare("
        INSERT INTO nacional_requests (
            request_id, total_pallets, total_boxes, weight_per_unit, weight_unit,
            unit_length, unit_width, unit_height, dimension_unit, pickup_date,
            pickup_address, ship_hours_start, ship_hours_end, contact_name,
            contact_phone, contact_email, delivery_place, delivery_date_plant,
            order_number
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->execute([
        $request_id,
        $data['total_pallets'] ?? 0,
        $data['total_boxes'] ?? 0,
        $data['weight_per_unit'] ?? 0,
        'kg', // weight_unit por defecto
        $data['unit_length'] ?? null,
        $data['unit_width'] ?? null,
        $data['unit_height'] ?? null,
        'cm', // dimension_unit por defecto
        $data['pickup_date'] ?? null,
        $data['pickup_address'] ?? '',
        $data['ship_hours_start'] ?? null,
        $data['ship_hours_end'] ?? null,
        $data['contact_name'] ?? '',
        $data['contact_phone'] ?? '',
        $data['contact_email'] ?? '', // Nuevo campo
        $data['delivery_place'] ?? 'Av. de la luz #24 int. 3 y 4 Acceso III. Parque Ind. Benito Juárez 76120, Querétaro. México',
        $data['delivery_date_plant'] ?? null,
        $data['order_number'] ?? ''
    ]);
}

function handleGetRequests() {
    global $pdo;
    
    // Obtener parámetros de filtro
    $status = $_GET['status'] ?? null;
    $service_type = $_GET['service_type'] ?? null;
    $date_from = $_GET['date_from'] ?? null;
    $date_to = $_GET['date_to'] ?? null;
    $limit = min((int)($_GET['limit'] ?? 50), 100);
    $offset = max((int)($_GET['offset'] ?? 0), 0);
    
    // Construir query base con información de cotizaciones
    $sql = "
        SELECT 
            srd.*,
            DATE_FORMAT(srd.created_at, '%d/%m/%Y %H:%i') as created_at_formatted,
            JSON_OBJECT(
                'origin_country', 
                CASE 
                    WHEN srd.shipping_method = 'nacional' THEN 'México'
                    WHEN srd.shipping_method = 'fedex' AND JSON_EXTRACT(srd.method_details, '$.origin_address') IS NOT NULL 
                        THEN COALESCE(SUBSTRING_INDEX(JSON_UNQUOTE(JSON_EXTRACT(srd.method_details, '$.origin_address')), ',', -1), 'México')
                    ELSE 'Internacional'
                END,
                'destination_country',
                CASE 
                    WHEN srd.shipping_method = 'nacional' THEN 'México'
                    WHEN srd.shipping_method = 'fedex' AND JSON_EXTRACT(srd.method_details, '$.destination_address') IS NOT NULL 
                        THEN COALESCE(SUBSTRING_INDEX(JSON_UNQUOTE(JSON_EXTRACT(srd.method_details, '$.destination_address')), ',', -1), 'México')
                    ELSE 'Internacional'
                END,
                'is_international', srd.shipping_method != 'nacional'
            ) as route_info,
            JSON_OBJECT(
                'total_quotes', COALESCE(q.total_quotes, 0),
                'selected_quotes', COALESCE(q.selected_quotes, 0),
                'has_quotes', COALESCE(q.total_quotes, 0) > 0
            ) as quote_status
        FROM shipping_requests_detailed srd
        LEFT JOIN (
            SELECT 
                request_id,
                COUNT(*) as total_quotes,
                SUM(CASE WHEN is_selected = 1 THEN 1 ELSE 0 END) as selected_quotes
            FROM quotes
            GROUP BY request_id
        ) q ON srd.id = q.request_id
    ";
    
    $conditions = [];
    $params = [];
    
    if ($status) {
        $conditions[] = "srd.status = ?";
        $params[] = $status;
    }
    
    if ($service_type) {
        $conditions[] = "srd.service_type = ?";
        $params[] = $service_type;
    }
    
    if ($date_from) {
        $conditions[] = "DATE(srd.created_at) >= ?";
        $params[] = $date_from;
    }
    
    if ($date_to) {
        $conditions[] = "DATE(srd.created_at) <= ?";
        $params[] = $date_to;
    }
    
    if (!empty($conditions)) {
        $sql .= " WHERE " . implode(" AND ", $conditions);
    }
    
    $sql .= " ORDER BY srd.created_at DESC LIMIT ? OFFSET ?";
    $params[] = $limit;
    $params[] = $offset;
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $requests = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Decodificar JSON fields
    foreach ($requests as &$request) {
        $request['method_details'] = json_decode($request['method_details'], true);
        $request['route_info'] = json_decode($request['route_info'], true);
        $request['quote_status'] = json_decode($request['quote_status'], true);
    }
    
    // Obtener estadísticas
    $stats = getRequestsStatistics($pdo, $status, $service_type, $date_from, $date_to);
    
    echo json_encode([
        'success' => true,
        'requests' => $requests,
        'stats' => $stats,
        'pagination' => [
            'limit' => $limit,
            'offset' => $offset,
            'has_more' => count($requests) === $limit
        ]
    ]);
}

function getRequestsStatistics($pdo, $status = null, $service_type = null, $date_from = null, $date_to = null) {
    // Estadísticas básicas
    $sql = "
        SELECT 
            status,
            service_type,
            COUNT(*) as count
        FROM shipping_requests sr
    ";
    
    $conditions = [];
    $params = [];
    
    if ($service_type) {
        $conditions[] = "service_type = ?";
        $params[] = $service_type;
    }
    
    if ($date_from) {
        $conditions[] = "DATE(created_at) >= ?";
        $params[] = $date_from;
    }
    
    if ($date_to) {
        $conditions[] = "DATE(created_at) <= ?";
        $params[] = $date_to;
    }
    
    if (!empty($conditions)) {
        $sql .= " WHERE " . implode(" AND ", $conditions);
    }
    
    $sql .= " GROUP BY status, service_type";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $raw_stats = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Procesar estadísticas
    $basic_stats = [
        'total_requests' => 0,
        'pending' => 0,
        'quoting' => 0,
        'completed' => 0,
        'canceled' => 0
    ];
    
    $by_service_type = [];
    
    foreach ($raw_stats as $stat) {
        $basic_stats['total_requests'] += $stat['count'];
        $basic_stats[$stat['status']] += $stat['count'];
        
        if (!isset($by_service_type[$stat['service_type']])) {
            $by_service_type[$stat['service_type']] = 0;
        }
        $by_service_type[$stat['service_type']] += $stat['count'];
    }
    
    // Actividad reciente (últimos 7 días)
    $sql = "
        SELECT 
            DATE(created_at) as date,
            COUNT(*) as requests,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
        FROM shipping_requests
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY DATE(created_at)
        ORDER BY date ASC
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $recent_activity = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Top usuarios
    $sql = "
        SELECT 
            user_name,
            COUNT(*) as request_count
        FROM shipping_requests
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY user_name
        ORDER BY request_count DESC
        LIMIT 5
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $top_users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    return [
        'basic' => $basic_stats,
        'by_service_type' => $by_service_type,
        'recent_activity' => $recent_activity,
        'top_users' => $top_users
    ];
}

function sendQuoteRequestEmails($request_id, $shipping_method, $method_data) {
    // Esta función se ejecutaría de forma asíncrona
    // Por ahora solo registramos en log
    error_log("GRAMMER: Envío de emails para solicitud #$request_id - Método: $shipping_method");
}
?>
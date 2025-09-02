<?php
/**
 * Endpoint to get quote requests
 * Intelligent Quoting Portal
 * @author Alejandro Pérez (Updated)
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/dao/db/db.php';

function sendJsonResponse($success, $message, $data = null, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode(['success' => $success, 'message' => $message, 'data' => $data]);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(false, 'Method not allowed. Use POST.', null, 405);
}

$conex = null;

try {
    $con = new LocalConector();
    $conex = $con->conectar();

    $input = file_get_contents('php://input');
    $filters = json_decode($input, true) ?? [];

    $sql = "SELECT 
                sr.id, sr.user_name, sr.status, sr.origin_details, 
                sr.destination_details, sr.package_details, sr.service_type, 
                sr.created_at, sr.updated_at,
                COUNT(q.id) as quotes_count
            FROM shipping_requests sr
            LEFT JOIN quotes q ON sr.id = q.request_id
            WHERE 1=1";

    $params = [];
    $types = '';

    if (!empty($filters['status'])) {
        $sql .= " AND sr.status = ?";
        $params[] = $filters['status'];
        $types .= 's';
    }
    if (!empty($filters['user_name'])) {
        $sql .= " AND sr.user_name LIKE ?";
        $params[] = '%' . $filters['user_name'] . '%';
        $types .= 's';
    }

    $sql .= " GROUP BY sr.id ORDER BY sr.created_at DESC";

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
        $requests[] = $row;
    }
    $stmt->close();

    sendJsonResponse(true, 'Requests retrieved successfully', [
        'requests' => $requests,
        'total' => count($requests)
    ]);

} catch (Exception $e) {
    sendJsonResponse(false, 'Error getting requests: ' . $e->getMessage(), ['filters' => $filters ?? null], 500);
} finally {
    if ($conex) {
        $conex->close();
    }
}

<?php
/**
 * Endpoint to get quotes for a specific request
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

require_once __DIR__ . '/db/db.php';

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
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    $requestId = intval($data['request_id'] ?? 0);
    if ($requestId <= 0) {
        throw new Exception('A valid request ID is required');
    }

    $con = new LocalConector();
    $conex = $con->conectar();
    
    // Check if the request exists
    $stmtReq = $conex->prepare("SELECT id, status, user_name FROM shipping_requests WHERE id = ?");
    $stmtReq->bind_param("i", $requestId);
    $stmtReq->execute();
    $requestResult = $stmtReq->get_result();
    $request = $requestResult->fetch_assoc();
    $stmtReq->close();

    if (!$request) {
        throw new Exception('Request not found');
    }

    // Get quotes with carrier information
    $sql = "SELECT 
                q.id, q.request_id, q.carrier_id, q.cost, q.currency,
                q.estimated_delivery_time, q.is_selected, q.created_at,
                c.name as carrier_name
            FROM quotes q
            INNER JOIN carriers c ON q.carrier_id = c.id
            WHERE q.request_id = ?
            ORDER BY q.created_at ASC";
    
    $stmt = $conex->prepare($sql);
    $stmt->bind_param("i", $requestId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $quotes = [];
    while ($row = $result->fetch_assoc()) {
        $quotes[] = $row;
    }
    $stmt->close();

    sendJsonResponse(true, 'Quotes retrieved successfully', [
        'request_info' => $request,
        'quotes' => $quotes
    ]);

} catch (Exception $e) {
    sendJsonResponse(false, 'Error getting quotes: ' . $e->getMessage(), ['request_id' => $requestId ?? null], 500);
} finally {
    if ($conex) {
        $conex->close();
    }
}

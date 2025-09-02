<?php
/**
 * Endpoint to get the list of carriers
 * Intelligent Quoting Portal
 * @author Alejandro Pérez (Updated)
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/dao/db/db.php';

// Helper function for JSON responses
function sendJsonResponse($success, $message, $data = null, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data
    ]);
    exit();
}

$conex = null; // Ensure $conex is defined

try {
    $con = new LocalConector();
    $conex = $con->conectar();

    $input = file_get_contents('php://input');
    $filters = json_decode($input, true) ?? [];

    $sql = "SELECT 
                c.id, c.name, c.contact_email, c.is_active, c.created_at,
                COUNT(q.id) as total_quotes,
                COUNT(CASE WHEN q.is_selected = 1 THEN 1 END) as selected_quotes,
                AVG(q.cost) as avg_cost,
                COUNT(DISTINCT q.request_id) as unique_requests
            FROM carriers c
            LEFT JOIN quotes q ON c.id = q.carrier_id
            WHERE 1=1";

    $params = [];
    $types = '';

    if (!empty($filters['active_only']) && $filters['active_only']) {
        $sql .= " AND c.is_active = 1";
    }
    if (!empty($filters['name'])) {
        $sql .= " AND c.name LIKE ?";
        $params[] = '%' . $filters['name'] . '%';
        $types .= 's';
    }

    $sql .= " GROUP BY c.id ORDER BY c.name ASC";

    $stmt = $conex->prepare($sql);
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    
    $carriers = [];
    while ($row = $result->fetch_assoc()) {
        $carriers[] = $row;
    }

    $stmt->close();
    
    $processedCarriers = array_map('processCarrierData', $carriers);

    sendJsonResponse(true, 'Carriers retrieved successfully', [
        'carriers' => $processedCarriers,
        'total' => count($processedCarriers)
    ]);

} catch (Exception $e) {
    sendJsonResponse(false, 'Error getting carriers: ' . $e->getMessage(), null, 500);
} finally {
    if ($conex) {
        $conex->close();
    }
}

function processCarrierData($carrier) {
    $totalQuotes = intval($carrier['total_quotes']);
    $selectedQuotes = intval($carrier['selected_quotes']);
    
    return [
        'id' => intval($carrier['id']),
        'name' => $carrier['name'],
        'contact_email' => $carrier['contact_email'],
        'is_active' => boolval($carrier['is_active']),
        'created_at' => $carrier['created_at'],
        'performance' => [
            'total_quotes' => $totalQuotes,
            'selected_quotes' => $selectedQuotes,
            'success_rate' => $totalQuotes > 0 ? round(($selectedQuotes / $totalQuotes) * 100, 1) : 0,
        ]
    ];
}

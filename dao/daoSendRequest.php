<?php
/**
 * Endpoint to send quote requests
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
require_once __DIR__ . '/dao/mailer/mailer.php';

use App\Mailer\AppMailer;

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

    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON: ' . json_last_error_msg());
    }

    $con = new LocalConector();
    $conex = $con->conectar();
    $conex->begin_transaction();

    // Insert request into the database
    $stmt = $conex->prepare("INSERT INTO shipping_requests (user_name, status, origin_details, destination_details, package_details, service_type) VALUES (?, ?, ?, ?, ?, ?)");
    $status = 'pending';
    $origin = json_encode($data['origin_details']);
    $destination = json_encode($data['destination_details']);
    $packages = json_encode($data['package_details']);
    $stmt->bind_param("ssssss", $data['user_name'], $status, $origin, $destination, $packages, $data['service_type']);
    $stmt->execute();
    $requestId = $conex->insert_id;
    $stmt->close();

    if (!$requestId) {
        throw new Exception('Failed to insert the request into the database');
    }

    // Send emails to carriers
    $emailResults = sendEmailsToCarriers($conex, $requestId, $data);

    // Update request status
    $stmtUpdate = $conex->prepare("UPDATE shipping_requests SET status = 'quoting' WHERE id = ?");
    $stmtUpdate->bind_param("i", $requestId);
    $stmtUpdate->execute();
    $stmtUpdate->close();

    $conex->commit();

    sendJsonResponse(true, 'Request sent successfully', [
        'id' => $requestId,
        'status' => 'quoting',
        'carriers_notified' => count($emailResults['success']),
        'email_errors' => $emailResults['errors']
    ]);

} catch (Exception $e) {
    if ($conex) $conex->rollback();
    sendJsonResponse(false, 'Error processing request: ' . $e->getMessage(), ['input_data' => $data ?? null], 500);
} finally {
    if ($conex) $conex->close();
}

function sendEmailsToCarriers($conex, $requestId, $data) {
    $stmt = $conex->prepare("SELECT name, contact_email FROM carriers WHERE is_active = 1");
    $stmt->execute();
    $result = $stmt->get_result();
    $carriers = [];
    while ($row = $result->fetch_assoc()) {
        $carriers[] = $row;
    }
    $stmt->close();
    
    $mailer = new AppMailer();
    $results = ['success' => [], 'errors' => []];

    foreach ($carriers as $carrier) {
        $emailContent = generateQuoteRequestEmail($requestId, $data, $carrier);
        $sent = $mailer->sendEmail($carrier['contact_email'], $carrier['name'], $emailContent['subject'], $emailContent['body']);
        if ($sent) {
            $results['success'][] = $carrier['name'];
        } else {
            $results['errors'][] = "Error sending to {$carrier['name']}";
        }
    }
    return $results;
}

function generateQuoteRequestEmail($requestId, $data, $carrier) {
    $subject = "Quote Request #{$requestId}";
    $body = "
    <html><body>
    <h1>Quote Request #{$requestId}</h1>
    <p>Dear {$carrier['name']},</p>
    <p>Please provide a quote for the following shipment:</p>
    <p><strong>Origin:</strong> " . htmlspecialchars($data['origin_details']['address']) . "</p>
    <p><strong>Destination:</strong> " . htmlspecialchars($data['destination_details']['address']) . "</p>
    <p>Please reply to this email with your quote.</p>
    <p>Thank you!</p>
    </body></html>";
    return ['subject' => $subject, 'body' => $body];
}

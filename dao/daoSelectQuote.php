<?php
/**
 * Endpoint to select a quote
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
$quoteId = 0;

try {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    $quoteId = intval($data['quote_id'] ?? 0);
    if ($quoteId <= 0) {
        throw new Exception('Invalid quote ID');
    }

    $con = new LocalConector();
    $conex = $con->conectar();
    $conex->begin_transaction();

    // Get quote information
    $stmtQuote = $conex->prepare("
        SELECT q.request_id, c.name as carrier_name, c.contact_email as carrier_email
        FROM quotes q
        INNER JOIN carriers c ON q.carrier_id = c.id
        WHERE q.id = ?");
    $stmtQuote->bind_param("i", $quoteId);
    $stmtQuote->execute();
    $quoteResult = $stmtQuote->get_result();
    $quote = $quoteResult->fetch_assoc();
    $stmtQuote->close();

    if (!$quote) {
        throw new Exception('Quote not found');
    }
    $requestId = $quote['request_id'];

    // Unselect other quotes for the same request
    $stmtUpdateOthers = $conex->prepare("UPDATE quotes SET is_selected = 0 WHERE request_id = ?");
    $stmtUpdateOthers->bind_param("i", $requestId);
    $stmtUpdateOthers->execute();
    $stmtUpdateOthers->close();

    // Select the current quote
    $stmtUpdateCurrent = $conex->prepare("UPDATE quotes SET is_selected = 1 WHERE id = ?");
    $stmtUpdateCurrent->bind_param("i", $quoteId);
    $stmtUpdateCurrent->execute();
    $stmtUpdateCurrent->close();

    // Update request status to 'completed'
    $stmtUpdateRequest = $conex->prepare("UPDATE shipping_requests SET status = 'completed', updated_at = NOW() WHERE id = ?");
    $stmtUpdateRequest->bind_param("i", $requestId);
    $stmtUpdateRequest->execute();
    $stmtUpdateRequest->close();

    $conex->commit();
    
    // Send notification email
    $emailSent = sendSelectionNotification($quote);

    sendJsonResponse(true, 'Quote selected successfully', ['quote_id' => $quoteId, 'request_id' => $requestId, 'email_sent' => $emailSent]);

} catch (Exception $e) {
    if ($conex) $conex->rollback();
    sendJsonResponse(false, 'Error selecting quote: ' . $e->getMessage(), ['quote_id' => $quoteId], 500);
} finally {
    if ($conex) $conex->close();
}

function sendSelectionNotification($quote) {
    try {
        $mailer = new AppMailer();
        $subject = "Your quote for request #{$quote['request_id']} has been selected!";
        $body = "<p>Dear {$quote['carrier_name']},</p><p>Congratulations! Your quote for shipping request #{$quote['request_id']} has been selected. We will contact you shortly with further details.</p><p>Thank you!</p>";
        
        return $mailer->sendEmail($quote['carrier_email'], $quote['carrier_name'], $subject, $body);
    } catch (Exception $e) {
        error_log("Failed to send selection email: " . $e->getMessage());
        return false;
    }
}

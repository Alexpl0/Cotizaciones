<?php
/**
 * Endpoint to send quote requests - GRAMMER Version
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
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON: ' . json_last_error_msg());
    }

    // Determinar si es una solicitud GRAMMER nueva o tradicional
    $isGrammerRequest = isset($data['is_grammer_request']) && $data['is_grammer_request'] === true;
    
    $conex = getDbConnection();
    if (!$conex) {
        throw new Exception('Database connection failed');
    }
    
    $conex->begin_transaction();

    if ($isGrammerRequest) {
        $response = processGrammerRequest($conex, $data);
    } else {
        $response = processTraditionalRequest($conex, $data);
    }

    $conex->commit();
    sendJsonResponse(true, 'Request sent successfully', $response);

} catch (Exception $e) {
    if ($conex) $conex->rollback();
    writeLog('error', 'Error processing shipping request: ' . $e->getMessage(), $data ?? []);
    sendJsonResponse(false, 'Error processing request: ' . $e->getMessage(), ['input_data' => $data ?? null], 500);
} finally {
    if ($conex) $conex->close();
}

/**
 * Procesa una solicitud GRAMMER con métodos específicos
 */
function processGrammerRequest($conex, $data) {
    // Validar datos básicos
    validateGrammerRequestData($data);
    
    // Insertar en shipping_requests principal
    $stmt = $conex->prepare("
        INSERT INTO shipping_requests 
        (user_name, company_area, status, shipping_method, method_specific_data, service_type, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, NOW())
    ");
    
    $status = 'pending';
    $companyArea = $data['company_area'] ?? 'Logística y Tráfico';
    $serviceType = mapMethodToServiceType($data['shipping_method']);
    $methodDataJson = json_encode($data['method_data']);
    
    $stmt->bind_param("ssssss", 
        $data['user_name'], 
        $companyArea, 
        $status, 
        $data['shipping_method'], 
        $methodDataJson,
        $serviceType
    );
    
    $stmt->execute();
    $requestId = $conex->insert_id;
    $stmt->close();

    if (!$requestId) {
        throw new Exception('Failed to insert the request into the database');
    }

    // Insertar en tabla específica del método
    switch ($data['shipping_method']) {
        case 'fedex':
            insertFedexRequest($conex, $requestId, $data['method_data']);
            break;
        case 'aereo_maritimo':
            insertAereoMaritimoRequest($conex, $requestId, $data['method_data']);
            break;
        case 'nacional':
            insertNacionalRequest($conex, $requestId, $data['method_data']);
            break;
        default:
            throw new Exception('Invalid shipping method: ' . $data['shipping_method']);
    }

    // Obtener la referencia interna generada automáticamente
    $referenceStmt = $conex->prepare("SELECT internal_reference FROM shipping_requests WHERE id = ?");
    $referenceStmt->bind_param("i", $requestId);
    $referenceStmt->execute();
    $referenceResult = $referenceStmt->get_result();
    $internalReference = $referenceResult->fetch_assoc()['internal_reference'] ?? null;
    $referenceStmt->close();

    // Enviar emails a transportistas
    $emailResults = sendEmailsToCarriers($conex, $requestId, $data, true);

    // Actualizar estado a 'quoting'
    $updateStmt = $conex->prepare("UPDATE shipping_requests SET status = 'quoting' WHERE id = ?");
    $updateStmt->bind_param("i", $requestId);
    $updateStmt->execute();
    $updateStmt->close();

    return [
        'id' => $requestId,
        'internal_reference' => $internalReference,
        'status' => 'quoting',
        'shipping_method' => $data['shipping_method'],
        'carriers_notified' => count($emailResults['success']),
        'email_errors' => $emailResults['errors']
    ];
}

/**
 * Procesa una solicitud tradicional (compatibilidad hacia atrás)
 */
function processTraditionalRequest($conex, $data) {
    // Insertar solicitud tradicional
    $stmt = $conex->prepare("
        INSERT INTO shipping_requests 
        (user_name, status, origin_details, destination_details, package_details, service_type) 
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    
    $status = 'pending';
    $origin = json_encode($data['origin_details']);
    $destination = json_encode($data['destination_details']);
    $packages = json_encode($data['package_details']);
    
    $stmt->bind_param("ssssss", 
        $data['user_name'], 
        $status, 
        $origin, 
        $destination, 
        $packages, 
        $data['service_type']
    );
    
    $stmt->execute();
    $requestId = $conex->insert_id;
    $stmt->close();

    if (!$requestId) {
        throw new Exception('Failed to insert the request into the database');
    }

    // Enviar emails a transportistas (versión tradicional)
    $emailResults = sendEmailsToCarriers($conex, $requestId, $data, false);

    // Actualizar estado
    $updateStmt = $conex->prepare("UPDATE shipping_requests SET status = 'quoting' WHERE id = ?");
    $updateStmt->bind_param("i", $requestId);
    $updateStmt->execute();
    $updateStmt->close();

    return [
        'id' => $requestId,
        'status' => 'quoting',
        'carriers_notified' => count($emailResults['success']),
        'email_errors' => $emailResults['errors']
    ];
}

/**
 * Valida datos de solicitud GRAMMER
 */
function validateGrammerRequestData($data) {
    if (empty($data['user_name'])) {
        throw new Exception('User name is required');
    }
    
    if (empty($data['shipping_method'])) {
        throw new Exception('Shipping method is required');
    }
    
    $validMethods = ['fedex', 'aereo_maritimo', 'nacional'];
    if (!in_array($data['shipping_method'], $validMethods)) {
        throw new Exception('Invalid shipping method');
    }
    
    if (empty($data['method_data'])) {
        throw new Exception('Method data is required');
    }
}

/**
 * Mapea método GRAMMER a tipo de servicio
 */
function mapMethodToServiceType($method) {
    $mapping = [
        'fedex' => 'air',
        'aereo_maritimo' => 'sea',
        'nacional' => 'land'
    ];
    return $mapping[$method] ?? 'air';
}

/**
 * Inserta solicitud Fedex
 */
function insertFedexRequest($conex, $requestId, $data) {
    $stmt = $conex->prepare("
        INSERT INTO fedex_requests 
        (request_id, origin_company_name, origin_address, origin_contact_name, origin_contact_phone, 
         origin_contact_email, destination_company_name, destination_address, destination_contact_name, 
         destination_contact_phone, destination_contact_email, total_packages, total_weight, 
         measurement_units, package_dimensions, order_number, merchandise_description, 
         merchandise_type, merchandise_material)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->bind_param("issssssssssisssssss", 
        $requestId,
        $data['origin_company_name'],
        $data['origin_address'],
        $data['origin_contact_name'],
        $data['origin_contact_phone'] ?? '',
        $data['origin_contact_email'] ?? '',
        $data['destination_company_name'],
        $data['destination_address'],
        $data['destination_contact_name'],
        $data['destination_contact_phone'] ?? '',
        $data['destination_contact_email'] ?? '',
        $data['total_packages'],
        $data['total_weight'],
        $data['measurement_units'] ?? 'cm/kg',
        $data['package_dimensions'] ?? '',
        $data['order_number'] ?? '',
        $data['merchandise_description'],
        $data['merchandise_type'] ?? '',
        $data['merchandise_material'] ?? ''
    );
    
    $stmt->execute();
    $stmt->close();
}

/**
 * Inserta solicitud Aéreo-Marítimo
 */
function insertAereoMaritimoRequest($conex, $requestId, $data) {
    $stmt = $conex->prepare("
        INSERT INTO aereo_maritimo_requests 
        (request_id, total_pallets, total_boxes, weight_per_unit, unit_length, unit_width, 
         unit_height, pickup_date, pickup_address, ship_hours_start, ship_hours_end, 
         contact_name, contact_phone, incoterm, delivery_type, delivery_place, 
         delivery_date_plant, order_number)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    $deliveryDatePlant = !empty($data['delivery_date_plant']) ? $data['delivery_date_plant'] : null;
    
    $stmt->bind_param("iiiddddssssssssss", 
        $requestId,
        $data['total_pallets'] ?? 0,
        $data['total_boxes'] ?? 0,
        $data['weight_per_unit'],
        $data['unit_length'] ?? 0,
        $data['unit_width'] ?? 0,
        $data['unit_height'] ?? 0,
        $data['pickup_date'],
        $data['pickup_address'],
        $data['ship_hours_start'] ?? null,
        $data['ship_hours_end'] ?? null,
        $data['contact_name'],
        $data['contact_phone'] ?? '',
        $data['incoterm'],
        $data['delivery_type'] ?? null,
        $data['delivery_place'],
        $deliveryDatePlant,
        $data['order_number'] ?? ''
    );
    
    $stmt->execute();
    $stmt->close();
}

/**
 * Inserta solicitud Nacional
 */
function insertNacionalRequest($conex, $requestId, $data) {
    $stmt = $conex->prepare("
        INSERT INTO nacional_requests 
        (request_id, total_pallets, total_boxes, weight_per_unit, unit_length, unit_width, 
         unit_height, pickup_date, pickup_address, ship_hours_start, ship_hours_end, 
         contact_name, contact_phone, delivery_place, delivery_date_plant, order_number)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    $deliveryPlace = $data['delivery_place'] ?? 'Av. de la luz #24 int. 3 y 4 Acceso III. Parque Ind. Benito Juárez 76120, Querétaro. México';
    $deliveryDatePlant = !empty($data['delivery_date_plant']) ? $data['delivery_date_plant'] : null;
    
    $stmt->bind_param("iiiddddsssssss", 
        $requestId,
        $data['total_pallets'] ?? 0,
        $data['total_boxes'] ?? 0,
        $data['weight_per_unit'],
        $data['unit_length'] ?? 0,
        $data['unit_width'] ?? 0,
        $data['unit_height'] ?? 0,
        $data['pickup_date'],
        $data['pickup_address'],
        $data['ship_hours_start'] ?? null,
        $data['ship_hours_end'] ?? null,
        $data['contact_name'],
        $data['contact_phone'] ?? '',
        $deliveryPlace,
        $deliveryDatePlant,
        $data['order_number'] ?? ''
    );
    
    $stmt->execute();
    $stmt->close();
}

/**
 * Envía emails a transportistas (actualizado para GRAMMER)
 */
function sendEmailsToCarriers($conex, $requestId, $data, $isGrammerRequest = false) {
    $stmt = $conex->prepare("SELECT name, contact_email FROM carriers WHERE is_active = 1");
    $stmt->execute();
    $result = $stmt->get_result();
    $carriers = [];
    while ($row = $result->fetch_assoc()) {
        $carriers[] = $row;
    }
    $stmt->close();
    
    $results = ['success' => [], 'errors' => []];
    
    // Si tenemos el mailer disponible, usarlo
    if (class_exists('App\Mailer\AppMailer')) {
        $mailer = new App\Mailer\AppMailer();
        
        foreach ($carriers as $carrier) {
            $emailContent = $isGrammerRequest 
                ? generateGrammerQuoteRequestEmail($requestId, $data, $carrier)
                : generateQuoteRequestEmail($requestId, $data, $carrier);
                
            $sent = $mailer->sendEmail(
                $carrier['contact_email'], 
                $carrier['name'], 
                $emailContent['subject'], 
                $emailContent['body']
            );
            
            if ($sent) {
                $results['success'][] = $carrier['name'];
            } else {
                $results['errors'][] = "Error sending to {$carrier['name']}";
            }
        }
    } else {
        // Fallback: marcar como enviado sin enviar realmente
        foreach ($carriers as $carrier) {
            $results['success'][] = $carrier['name'] . ' (simulated)';
        }
        writeLog('warning', 'Mailer class not available, simulating email sends', ['request_id' => $requestId]);
    }
    
    return $results;
}

/**
 * Genera email para solicitud GRAMMER
 */
function generateGrammerQuoteRequestEmail($requestId, $data, $carrier) {
    $internalRef = "Pendiente"; // Se actualiza después
    $method = $data['shipping_method'];
    $methodName = [
        'fedex' => 'Fedex Express',
        'aereo_maritimo' => 'Aéreo-Marítimo',
        'nacional' => 'Nacional'
    ][$method] ?? $method;
    
    $subject = "GRAMMER - Solicitud de Cotización #{$requestId} - {$methodName}";
    
    $body = "
    <html><body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
    <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
        <div style='background: linear-gradient(135deg, #003366, #0066CC); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;'>
            <h1 style='margin: 0; font-size: 24px;'>
                🏭 GRAMMER Automotive Puebla
            </h1>
            <p style='margin: 5px 0 0 0; opacity: 0.9;'>Logística y Tráfico</p>
        </div>
        
        <h2 style='color: #003366; margin-bottom: 20px;'>
            Solicitud de Cotización #{$requestId}
        </h2>
        
        <div style='background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;'>
            <p><strong>Estimado {$carrier['name']},</strong></p>
            <p>Solicitamos su cotización para el siguiente envío <strong>{$methodName}</strong>:</p>
        </div>";
        
    // Agregar detalles específicos del método
    if ($method === 'fedex') {
        $body .= generateFedexEmailContent($data['method_data']);
    } elseif ($method === 'aereo_maritimo') {
        $body .= generateAereoMaritimoEmailContent($data['method_data']);
    } elseif ($method === 'nacional') {
        $body .= generateNacionalEmailContent($data['method_data']);
    }
    
    $body .= "
        <div style='background: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0;'>
            <p style='margin: 0;'><strong>📞 Para responder:</strong></p>
            <p style='margin: 5px 0 0 0;'>Responda a este email con su cotización detallada incluyendo tiempos y costos.</p>
        </div>
        
        <div style='text-align: center; padding: 20px; border-top: 1px solid #ddd; margin-top: 30px;'>
            <p style='color: #666; margin: 0;'>
                <strong>GRAMMER Automotive Puebla S.A. de C.V.</strong><br>
                Av. de la luz #24 int. 3 y 4 Acceso III<br>
                Parque Ind. Benito Juárez 76120, Querétaro, México
            </p>
        </div>
    </div>
    </body></html>";
    
    return ['subject' => $subject, 'body' => $body];
}

/**
 * Genera contenido de email para Fedex
 */
function generateFedexEmailContent($data) {
    return "
    <div style='margin: 20px 0;'>
        <h3 style='color: #003366; border-bottom: 2px solid #0066CC; padding-bottom: 5px;'>
            📦 Detalles Fedex Express
        </h3>
        <table style='width: 100%; border-collapse: collapse; margin: 10px 0;'>
            <tr style='background: #f8f9fa;'>
                <td style='padding: 8px; border: 1px solid #ddd; font-weight: bold;'>Origen:</td>
                <td style='padding: 8px; border: 1px solid #ddd;'>{$data['origin_company_name']}<br>{$data['origin_address']}</td>
            </tr>
            <tr>
                <td style='padding: 8px; border: 1px solid #ddd; font-weight: bold;'>Destino:</td>
                <td style='padding: 8px; border: 1px solid #ddd;'>{$data['destination_company_name']}<br>{$data['destination_address']}</td>
            </tr>
            <tr style='background: #f8f9fa;'>
                <td style='padding: 8px; border: 1px solid #ddd; font-weight: bold;'>Paquetes:</td>
                <td style='padding: 8px; border: 1px solid #ddd;'>{$data['total_packages']} paquetes - {$data['total_weight']} kg</td>
            </tr>
            <tr>
                <td style='padding: 8px; border: 1px solid #ddd; font-weight: bold;'>Mercancía:</td>
                <td style='padding: 8px; border: 1px solid #ddd;'>{$data['merchandise_description']}</td>
            </tr>
        </table>
    </div>";
}

/**
 * Genera contenido de email para Aéreo-Marítimo
 */
function generateAereoMaritimoEmailContent($data) {
    return "
    <div style='margin: 20px 0;'>
        <h3 style='color: #003366; border-bottom: 2px solid #0066CC; padding-bottom: 5px;'>
            ✈️🚢 Detalles Aéreo-Marítimo
        </h3>
        <table style='width: 100%; border-collapse: collapse; margin: 10px 0;'>
            <tr style='background: #f8f9fa;'>
                <td style='padding: 8px; border: 1px solid #ddd; font-weight: bold;'>Unidades:</td>
                <td style='padding: 8px; border: 1px solid #ddd;'>
                    {$data['total_pallets']} pallets, {$data['total_boxes']} cajas<br>
                    Peso por unidad: {$data['weight_per_unit']} kg
                </td>
            </tr>
            <tr>
                <td style='padding: 8px; border: 1px solid #ddd; font-weight: bold;'>Recolección:</td>
                <td style='padding: 8px; border: 1px solid #ddd;'>
                    {$data['pickup_date']}<br>
                    {$data['pickup_address']}
                </td>
            </tr>
            <tr style='background: #f8f9fa;'>
                <td style='padding: 8px; border: 1px solid #ddd; font-weight: bold;'>INCOTERM:</td>
                <td style='padding: 8px; border: 1px solid #ddd;'>{$data['incoterm']}</td>
            </tr>
            <tr>
                <td style='padding: 8px; border: 1px solid #ddd; font-weight: bold;'>Entrega:</td>
                <td style='padding: 8px; border: 1px solid #ddd;'>{$data['delivery_place']}</td>
            </tr>
        </table>
    </div>";
}

/**
 * Genera contenido de email para Nacional
 */
function generateNacionalEmailContent($data) {
    return "
    <div style='margin: 20px 0;'>
        <h3 style='color: #003366; border-bottom: 2px solid #0066CC; padding-bottom: 5px;'>
            🚛 Detalles Envío Nacional
        </h3>
        <table style='width: 100%; border-collapse: collapse; margin: 10px 0;'>
            <tr style='background: #f8f9fa;'>
                <td style='padding: 8px; border: 1px solid #ddd; font-weight: bold;'>Unidades:</td>
                <td style='padding: 8px; border: 1px solid #ddd;'>
                    {$data['total_pallets']} pallets, {$data['total_boxes']} cajas<br>
                    Peso por unidad: {$data['weight_per_unit']} kg
                </td>
            </tr>
            <tr>
                <td style='padding: 8px; border: 1px solid #ddd; font-weight: bold;'>Recolección:</td>
                <td style='padding: 8px; border: 1px solid #ddd;'>
                    {$data['pickup_date']}<br>
                    {$data['pickup_address']}
                </td>
            </tr>
            <tr style='background: #f8f9fa;'>
                <td style='padding: 8px; border: 1px solid #ddd; font-weight: bold;'>Entrega:</td>
                <td style='padding: 8px; border: 1px solid #ddd;'>
                    <strong>Planta GRAMMER Querétaro</strong><br>
                    {$data['delivery_place']}
                </td>
            </tr>
        </table>
    </div>";
}

/**
 * Genera email para solicitud tradicional (compatibilidad)
 */
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
?>
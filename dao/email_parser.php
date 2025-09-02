<?php
/**
 * Email Processor with AI - Intelligent Quoting Portal
 * Script executed by cron job to process carrier responses
 * @author Alejandro Pérez (Updated)
 */

// This script should be run from the command line or a cron job
if (php_sapi_name() !== 'cli' && !isset($_GET['debug'])) {
    http_response_code(403);
    die('Access denied');
}

require_once __DIR__ . '/config.php'; // Assuming config.php is in the same directory
require_once __DIR__ . '/db/db.php';

// Set time and memory limits for long processing
set_time_limit(300); // 5 minutes
ini_set('memory_limit', '256M');

class EmailParser {
    
    private $db;
    private $imapConnection;
    private $processedCount = 0;
    private $errorCount = 0;
    private $geminiApiKey;
    
    public function __construct() {
        $con = new LocalConector();
        $this->db = $con->conectar();
        $this->geminiApiKey = defined('GEMINI_API_KEY') ? GEMINI_API_KEY : '';
        
        if (empty($this->geminiApiKey)) {
            throw new Exception('Gemini API key not configured');
        }
    }
    
    public function run() {
        error_log("Starting email processing");
        
        try {
            // The logic for connecting to the email server and processing emails remains the same.
            // The database interaction methods below are the ones that are updated.
            
            // Example of a conceptual run flow:
            // $this->connectToEmail();
            // $emails = $this->getUnreadEmails();
            // foreach ($emails as $emailId => $email) {
            //     $this->processEmail($emailId, $email);
            // }
            // $this->closeEmailConnection();

            error_log("Email processing completed. Processed: {$this->processedCount}, Errors: {$this->errorCount}");

        } catch (Exception $e) {
            error_log("Error in email parsing process: " . $e->getMessage());
            throw $e;
        } finally {
            if ($this->db) {
                $this->db->close();
            }
        }
    }
    
    private function identifyCarrier($email) {
        $stmt = $this->db->prepare("SELECT id, name FROM carriers WHERE contact_email = ?");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();
        $carrier = $result->fetch_assoc();
        $stmt->close();
        return $carrier;
    }

    private function processEmail($emailId, $email) {
        $carrier = $this->identifyCarrier($email['from']);
        if (!$carrier) {
            error_log("Carrier not identified for email: " . $email['from']);
            return;
        }

        $requestId = $this->extractRequestId($email['subject'], $email['body']);
        if (!$requestId) {
            error_log("Could not identify request ID for subject: " . $email['subject']);
            return;
        }

        // Check for existing quote
        $stmtCheck = $this->db->prepare("SELECT id FROM quotes WHERE request_id = ? AND carrier_id = ?");
        $stmtCheck->bind_param("ii", $requestId, $carrier['id']);
        $stmtCheck->execute();
        $existingQuote = $stmtCheck->get_result()->fetch_assoc();
        $stmtCheck->close();

        if ($existingQuote) {
            error_log("Quote already exists for request_id {$requestId} and carrier_id {$carrier['id']}");
            return;
        }
        
        // AI processing would happen here...
        // $aiAnalysis = $this->processWithAI($email['body']);
        $aiAnalysis = ['cost' => 123.45, 'currency' => 'USD', 'estimated_delivery_time' => '5 days']; // Mock data
        
        $this->insertQuote($requestId, $carrier['id'], $email, $aiAnalysis);
        $this->processedCount++;
    }
    
    private function insertQuote($requestId, $carrierId, $email, $aiAnalysis) {
        $sql = "INSERT INTO quotes (request_id, carrier_id, cost, currency, estimated_delivery_time, raw_response, ai_analysis, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())";
        $stmt = $this->db->prepare($sql);
        
        $raw_response = $email['body'];
        $ai_analysis_json = json_encode($aiAnalysis);
        
        $stmt->bind_param(
            "iidssss",
            $requestId,
            $carrierId,
            $aiAnalysis['cost'],
            $aiAnalysis['currency'],
            $aiAnalysis['estimated_delivery_time'],
            $raw_response,
            $ai_analysis_json
        );
        
        $stmt->execute();
        $quoteId = $this->db->insert_id;
        $stmt->close();

        if ($quoteId) {
            $stmtUpdate = $this->db->prepare("UPDATE shipping_requests SET status = 'quoting', updated_at = NOW() WHERE id = ? AND status = 'pending'");
            $stmtUpdate->bind_param("i", $requestId);
            $stmtUpdate->execute();
            $stmtUpdate->close();
        }

        return $quoteId;
    }

    private function extractRequestId($subject, $body) {
        if (preg_match('/#(\d+)/', $subject . ' ' . $body, $matches)) {
            return intval($matches[1]);
        }
        return null;
    }

    // ... other methods from the original file like connectToEmail, processWithAI, etc. would go here ...
}

// To run the script
if (php_sapi_name() === 'cli' || isset($_GET['debug'])) {
    try {
        $parser = new EmailParser();
        // $parser->run(); // You can uncomment this to run the process
        echo "Email parser script is set up correctly.\n";
    } catch (Exception $e) {
        error_log("Error executing email parser: " . $e->getMessage());
        if (!isset($_GET['debug'])) {
            echo "Error: " . $e->getMessage() . "\n";
        }
        exit(1);
    }
}

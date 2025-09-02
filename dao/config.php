<?php
/**
 * Configuración global del Portal de Cotización Inteligente
 * @author Alejandro Pérez
 */

// Prevenir acceso directo
if (!defined('SCRIPT_NAME') && basename($_SERVER['SCRIPT_NAME']) == basename(__FILE__)) {
    define('SCRIPT_NAME', basename($_SERVER['SCRIPT_NAME']));
}

// Incluir la clase de base de datos
require_once __DIR__ . '/db/db.php';

// Configuración de APIs externas
define('GEMINI_API_KEY', '');  // Agregar tu clave de Google Gemini
define('GEMINI_API_URL', 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent');

// Configuración de seguridad
define('SAP_API_KEY', 'tu_clave_sap_secreta');  // Cambiar por una clave segura
define('ALLOWED_ORIGINS', [
    'https://tudominio.com',
    'https://www.tudominio.com',
    'http://localhost',      // Solo para desarrollo
    'http://127.0.0.1'       // Solo para desarrollo
]);

// Configuración de la aplicación
define('APP_NAME', 'Portal de Cotización Inteligente');
define('APP_VERSION', '1.0');
define('COMPANY_NAME', 'Tu Empresa');
define('TIMEZONE', 'America/Mexico_City');

// Configuración de archivos y uploads
define('MAX_FILE_SIZE', 10 * 1024 * 1024); // 10MB
define('UPLOAD_PATH', '../uploads/');
define('LOG_PATH', '../logs/');


// Configuración de tiempo
define('EMAIL_CHECK_INTERVAL_MINUTES', 10);
define('SESSION_TIMEOUT_HOURS', 8);
define('CACHE_TIMEOUT_MINUTES', 30);

// Estados del sistema
define('REQUEST_STATUSES', [
    'PENDING' => 'pending',
    'QUOTING' => 'quoting', 
    'COMPLETED' => 'completed',
    'CANCELED' => 'canceled'
]);

define('SERVICE_TYPES', [
    'AIR' => 'air',
    'SEA' => 'sea',
    'LAND' => 'land'
]);

define('SAP_QUEUE_STATUSES', [
    'PENDING' => 'pending',
    'PROCESSING' => 'processing',
    'SUCCESS' => 'success', 
    'FAILED' => 'failed'
]);

// Configuración de logging
define('LOG_LEVELS', [
    'DEBUG' => 'debug',
    'INFO' => 'info',
    'WARNING' => 'warning', 
    'ERROR' => 'error'
]);

// Configurar zona horaria
date_default_timezone_set(TIMEZONE);

// Configurar manejo de errores
error_reporting(E_ALL);
ini_set('display_errors', 0);  // No mostrar errores en producción
ini_set('log_errors', 1);
ini_set('error_log', LOG_PATH . 'php_errors.log');

// Configurar sesiones
ini_set('session.gc_maxlifetime', SESSION_TIMEOUT_HOURS * 3600);
ini_set('session.cookie_lifetime', SESSION_TIMEOUT_HOURS * 3600);

/**
 * Configuración específica según el entorno
 */
function getEnvironment() {
    // Detectar entorno basado en el dominio
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    
    if (strpos($host, 'localhost') !== false || strpos($host, '127.0.0.1') !== false) {
        return 'development';
    } elseif (strpos($host, 'staging') !== false || strpos($host, 'test') !== false) {
        return 'staging';
    } else {
        return 'production';
    }
}

// Configuraciones específicas por entorno
$environment = getEnvironment();

switch ($environment) {
    case 'development':
        define('DEBUG_MODE', true);
        define('LOG_LEVEL', 'debug');
        ini_set('display_errors', 1);
        break;
        
    case 'staging':
        define('DEBUG_MODE', true);
        define('LOG_LEVEL', 'info');
        break;
        
    case 'production':
    default:
        define('DEBUG_MODE', false);
        define('LOG_LEVEL', 'warning');
        break;
}

/**
 * Función para obtener conexión a la base de datos
 * @return mysqli|null
 */
function getDbConnection() {
    try {
        $con = new LocalConector();
        return $con->conectar();
    } catch (Exception $e) {
        error_log("Error de conexión a BD: " . $e->getMessage());
        return null;
    }
}

/**
 * Función para obtener configuración de la base de datos
 * @param string $key
 * @param mixed $default
 * @return mixed
 */
function getAppConfig($key, $default = null) {
    static $config = null;
    
    if ($config === null) {
        $config = [];
        $conex = getDbConnection();
        
        if ($conex) {
            try {
                $stmt = $conex->prepare("SELECT config_key, config_value FROM app_config");
                $stmt->execute();
                $result = $stmt->get_result();
                
                while ($row = $result->fetch_assoc()) {
                    $config[$row['config_key']] = $row['config_value'];
                }
                
                $stmt->close();
                $conex->close();
            } catch (Exception $e) {
                error_log("Error obteniendo configuración: " . $e->getMessage());
            }
        }
    }
    
    return $config[$key] ?? $default;
}

/**
 * Función para validar origen de CORS
 * @param string $origin
 * @return bool
 */
function isValidOrigin($origin) {
    return in_array($origin, ALLOWED_ORIGINS) || DEBUG_MODE;
}

/**
 * Función para sanitizar input
 * @param mixed $data
 * @return mixed
 */
function sanitizeInput($data) {
    if (is_array($data)) {
        return array_map('sanitizeInput', $data);
    } else {
        return htmlspecialchars(trim($data), ENT_QUOTES, 'UTF-8');
    }
}

/**
 * Función para validar API key de SAP
 * @param string $apiKey
 * @return bool
 */
function validateSapApiKey($apiKey) {
    return $apiKey === SAP_API_KEY && !empty($apiKey);
}

/**
 * Función para obtener IP del cliente
 * @return string
 */
function getClientIP() {
    $ipKeys = ['HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'HTTP_CLIENT_IP', 'REMOTE_ADDR'];
    
    foreach ($ipKeys as $key) {
        if (!empty($_SERVER[$key])) {
            $ips = explode(',', $_SERVER[$key]);
            return trim($ips[0]);
        }
    }
    
    return 'unknown';
}

/**
 * Función para generar token único
 * @param int $length
 * @return string
 */
function generateToken($length = 32) {
    return bin2hex(random_bytes($length / 2));
}

/**
 * Función estándar para respuestas JSON (consistente con endpoints)
 * @param bool $success
 * @param string $message
 * @param mixed $data
 * @param int $statusCode
 * @return void
 */
function sendJsonResponse($success, $message, $data = null, $statusCode = 200) {
    http_response_code($statusCode);
    
    $response = [
        'success' => $success,
        'message' => $message
    ];
    
    if ($data !== null) {
        $response['data'] = $data;
    }
    
    if (DEBUG_MODE) {
        $response['debug'] = [
            'environment' => getEnvironment(),
            'memory_usage' => memory_get_usage(true),
            'execution_time' => microtime(true) - ($_SERVER['REQUEST_TIME_FLOAT'] ?? microtime(true)),
            'timestamp' => date('c')
        ];
    }
    
    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}

/**
 * Configurar headers CORS estándar
 * @return void
 */
function setCorsHeaders() {
    header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}

/**
 * Función para logging consistente
 * @param string $level
 * @param string $message
 * @param array $context
 * @return void
 */
function writeLog($level, $message, $context = []) {
    if (!in_array($level, LOG_LEVELS)) {
        $level = 'info';
    }
    
    $logFile = LOG_PATH . 'app.log';
    $timestamp = date('Y-m-d H:i:s');
    $contextStr = !empty($context) ? ' Context: ' . json_encode($context) : '';
    $logEntry = "[{$timestamp}] [{$level}] {$message}{$contextStr}" . PHP_EOL;
    
    file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
}

/**
 * Función para procesar input JSON
 * @return array|null
 */
function getJsonInput() {
    $input = file_get_contents('php://input');
    return json_decode($input, true);
}

// Verificar si las carpetas necesarias existen
$requiredDirs = [LOG_PATH, UPLOAD_PATH];

foreach ($requiredDirs as $dir) {
    if (!file_exists($dir)) {
        mkdir($dir, 0755, true);
    }
}

// Auto-cargar clases comunes
spl_autoload_register(function ($className) {
    $file = __DIR__ . '/' . strtolower($className) . '.php';
    if (file_exists($file)) {
        require_once $file;
    }
});
?>
-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1:3306
-- Tiempo de generación: 09-09-2025 a las 17:58:25
-- Versión del servidor: 10.11.10-MariaDB-log
-- Versión de PHP: 7.2.34

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `u909553968_cotizaciones`
--

DELIMITER $$
--
-- Funciones
--
CREATE DEFINER=`u909553968_traffic`@`127.0.0.1` FUNCTION `generate_internal_reference` (`method_type` VARCHAR(20), `request_date` DATE) RETURNS VARCHAR(20) CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci DETERMINISTIC READS SQL DATA BEGIN
    DECLARE prefix VARCHAR(5);
    DECLARE year_code VARCHAR(2);
    DECLARE month_code VARCHAR(2);
    DECLARE sequence_num INT DEFAULT 1;
    DECLARE final_ref VARCHAR(20);
    
    -- Determinar prefijo según método
    CASE method_type
        WHEN 'fedex' THEN SET prefix = 'FDX';
        WHEN 'aereo_maritimo' THEN SET prefix = 'AMS';  
        WHEN 'nacional' THEN SET prefix = 'NAC';
        ELSE SET prefix = 'GEN';
    END CASE;
    
    -- Código de año y mes
    SET year_code = SUBSTRING(YEAR(request_date), 3, 2);
    SET month_code = LPAD(MONTH(request_date), 2, '0');
    
    -- Obtener siguiente número de secuencia
    SELECT COALESCE(MAX(CAST(SUBSTRING(internal_reference, -4) AS UNSIGNED)), 0) + 1
    INTO sequence_num
    FROM shipping_requests 
    WHERE internal_reference LIKE CONCAT(prefix, year_code, month_code, '%')
    AND YEAR(created_at) = YEAR(request_date)
    AND MONTH(created_at) = MONTH(request_date);
    
    -- Construir referencia final: FDX2509001, AMS2509001, etc.
    SET final_ref = CONCAT(prefix, year_code, month_code, LPAD(sequence_num, 3, '0'));
    
    RETURN final_ref;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `aereo_maritimo_requests`
--

CREATE TABLE `aereo_maritimo_requests` (
  `id` int(11) NOT NULL,
  `request_id` int(11) NOT NULL,
  `total_pallets` int(11) DEFAULT 0,
  `total_boxes` int(11) DEFAULT 0,
  `weight_per_unit` decimal(10,2) NOT NULL,
  `weight_unit` varchar(10) DEFAULT 'kg',
  `unit_length` decimal(10,2) DEFAULT NULL,
  `unit_width` decimal(10,2) DEFAULT NULL,
  `unit_height` decimal(10,2) DEFAULT NULL,
  `dimension_unit` varchar(10) DEFAULT 'cm',
  `pickup_date` date NOT NULL,
  `pickup_address` text NOT NULL,
  `ship_hours_start` time DEFAULT NULL,
  `ship_hours_end` time DEFAULT NULL,
  `contact_name` varchar(255) NOT NULL,
  `contact_phone` varchar(100) DEFAULT NULL,
  `incoterm` varchar(10) DEFAULT NULL COMMENT 'EXW, FOB, CIF, etc.',
  `delivery_type` enum('airport','port') DEFAULT NULL,
  `delivery_place` text NOT NULL,
  `delivery_date_plant` date DEFAULT NULL,
  `order_number` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `aereo_maritimo_requests`
--

INSERT INTO `aereo_maritimo_requests` (`id`, `request_id`, `total_pallets`, `total_boxes`, `weight_per_unit`, `weight_unit`, `unit_length`, `unit_width`, `unit_height`, `dimension_unit`, `pickup_date`, `pickup_address`, `ship_hours_start`, `ship_hours_end`, `contact_name`, `contact_phone`, `incoterm`, `delivery_type`, `delivery_place`, `delivery_date_plant`, `order_number`, `created_at`, `updated_at`) VALUES
(1, 3, 8, 24, 150.25, 'kg', 140.00, 100.00, 120.00, 'cm', '2025-09-15', 'Supplier International Ltd, 789 Export Avenue, Shanghai, China 200000', '09:00:00', '18:00:00', 'Miguel Santos', '+52 442 555 0123', 'FOB', 'port', 'Puerto de Veracruz, México', '2025-10-01', 'ORD-INTL-2025-003', '2025-09-02 21:14:36', '2025-09-02 21:14:36'),
(2, 10, 6, 18, 110.80, 'kg', NULL, NULL, NULL, 'cm', '2025-09-10', 'Global Parts Ltd, 456 Trade St, Hong Kong', NULL, NULL, 'Isabel Corona', '+52 442 777 5544', 'CIF', 'airport', 'Aeropuerto Internacional de México', NULL, 'ORD-HK-2025-007', '2025-09-02 21:14:36', '2025-09-02 21:14:36');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `app_config`
--

CREATE TABLE `app_config` (
  `id` int(11) NOT NULL,
  `config_key` varchar(100) NOT NULL,
  `config_value` text NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `app_config`
--

INSERT INTO `app_config` (`id`, `config_key`, `config_value`, `description`, `created_at`, `updated_at`) VALUES
(1, 'central_email', 'cotizaciones@tuempresa.com', 'Email centralizado para recibir cotizaciones', '2025-09-02 16:16:22', '2025-09-02 16:16:22'),
(2, 'gemini_api_key', '', 'Clave API de Google Gemini', '2025-09-02 16:16:22', '2025-09-02 16:16:22'),
(3, 'email_check_interval', '10', 'Intervalo en minutos para revisar emails', '2025-09-02 16:16:22', '2025-09-02 16:16:22'),
(4, 'sap_api_key', '', 'Clave para proteger endpoints de SAP', '2025-09-02 16:16:22', '2025-09-02 16:16:22'),
(5, 'company_name', 'Tu Empresa', 'Nombre de la empresa', '2025-09-02 16:16:22', '2025-09-02 16:16:22'),
(6, 'company_full_name', 'GRAMMER Automotive Puebla S.A. de C.V.', 'Nombre completo de la empresa', '2025-09-02 17:27:42', '2025-09-02 17:27:42'),
(7, 'company_area', 'Logística y Tráfico', 'Área específica que maneja el portal', '2025-09-02 17:27:42', '2025-09-02 17:27:42'),
(8, 'default_delivery_address', 'Av. de la luz #24 int. 3 y 4 Acceso III. Parque Ind. Benito Juárez 76120, Querétaro. México', 'Dirección por defecto para entregas nacionales', '2025-09-02 17:27:42', '2025-09-02 17:27:42'),
(9, 'supported_shipping_methods', '[\"fedex\", \"aereo_maritimo\", \"nacional\"]', 'Métodos de envío soportados', '2025-09-02 17:27:42', '2025-09-02 17:27:42'),
(10, 'default_weight_unit', 'kg', 'Unidad de peso por defecto', '2025-09-02 17:27:42', '2025-09-02 17:27:42'),
(11, 'default_dimension_unit', 'cm', 'Unidad de dimensiones por defecto', '2025-09-02 17:27:42', '2025-09-02 17:27:42');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `carriers`
--

CREATE TABLE `carriers` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `contact_email` varchar(100) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `carriers`
--

INSERT INTO `carriers` (`id`, `name`, `contact_email`, `is_active`, `created_at`) VALUES
(1, 'DHL Express', 'cotizaciones.dhl@example.com', 1, '2025-09-02 16:16:22'),
(2, 'FedEx', 'quotes.fedex@example.com', 1, '2025-09-02 16:16:22'),
(3, 'UPS', 'shipping.ups@example.com', 1, '2025-09-02 16:16:22'),
(4, 'Estafeta', 'cotiza.estafeta@example.com', 1, '2025-09-02 16:16:22'),
(5, 'Paquetexpress', 'ventas.paquetexpress@example.com', 1, '2025-09-02 16:16:22');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `fedex_requests`
--

CREATE TABLE `fedex_requests` (
  `id` int(11) NOT NULL,
  `request_id` int(11) NOT NULL,
  `origin_company_name` varchar(255) NOT NULL,
  `origin_address` text NOT NULL,
  `origin_contact_name` varchar(255) NOT NULL,
  `origin_contact_phone` varchar(100) DEFAULT NULL,
  `origin_contact_email` varchar(255) DEFAULT NULL,
  `destination_company_name` varchar(255) NOT NULL,
  `destination_address` text NOT NULL,
  `destination_contact_name` varchar(255) NOT NULL,
  `destination_contact_phone` varchar(100) DEFAULT NULL,
  `destination_contact_email` varchar(255) DEFAULT NULL,
  `total_packages` int(11) NOT NULL DEFAULT 1,
  `total_weight` decimal(10,2) NOT NULL,
  `weight_unit` varchar(10) DEFAULT 'kg',
  `package_dimensions` text DEFAULT NULL COMMENT 'Dimensiones de caja o pallet',
  `measurement_units` varchar(50) DEFAULT NULL,
  `order_number` varchar(100) DEFAULT NULL COMMENT 'Orden o centro de costos',
  `merchandise_description` text NOT NULL,
  `merchandise_type` varchar(255) DEFAULT NULL COMMENT 'Qué es?',
  `merchandise_material` varchar(255) DEFAULT NULL COMMENT 'De qué está hecho?',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `fedex_requests`
--

INSERT INTO `fedex_requests` (`id`, `request_id`, `origin_company_name`, `origin_address`, `origin_contact_name`, `origin_contact_phone`, `origin_contact_email`, `destination_company_name`, `destination_address`, `destination_contact_name`, `destination_contact_phone`, `destination_contact_email`, `total_packages`, `total_weight`, `weight_unit`, `package_dimensions`, `measurement_units`, `order_number`, `merchandise_description`, `merchandise_type`, `merchandise_material`, `created_at`, `updated_at`) VALUES
(1, 1, 'GRAMMER Automotive Puebla', 'Av. de la luz #24 int. 3 y 4 Acceso III. Parque Ind. Benito Juárez 76120, Querétaro, México', 'Carlos Mendoza', '+52 442 123 4567', 'carlos.mendoza@grammer.com', 'GRAMMER Germany GmbH', '1234 Industrial Str, Stuttgart, Germany 70565', 'Hans Mueller', '+49 711 123 456', 'hans.mueller@grammer.de', 3, 125.50, 'kg', '120x80x60 cm', 'kg/cm', 'ORD-2025-001', 'Componentes automotrices para asientos', 'Partes metálicas y plásticas', 'Acero y polipropileno', '2025-09-02 21:14:36', '2025-09-02 21:14:36'),
(2, 4, 'GRAMMER Automotive Puebla', 'Av. de la luz #24 int. 3 y 4 Acceso III. Parque Ind. Benito Juárez 76120, Querétaro, México', 'Laura García', '+52 442 333 7890', NULL, 'GRAMMER USA Corp', '4567 Automotive Blvd, Detroit, MI 48201, USA', 'John Smith', NULL, NULL, 2, 45.30, 'kg', '80x60x40 cm', NULL, 'ORD-USA-2025-004', 'Prototipos de componentes de asientos', 'Piezas de prueba', 'Aluminio y fibra de carbono', '2025-09-02 21:14:36', '2025-09-02 21:14:36'),
(3, 11, 'GRAMMER Automotive Puebla', 'Av. de la luz #24 int. 3 y 4 Acceso III. Parque Ind. Benito Juárez 76120, Querétaro, México', 'Alejandro Pérez', NULL, NULL, 'Tech Solutions Inc', '789 Innovation Dr, Austin, TX 73301, USA', 'Sarah Wilson', NULL, NULL, 1, 25.50, 'kg', NULL, NULL, 'ORD-IT-2025-008', 'Equipos de cómputo especializados', NULL, NULL, '2025-09-02 21:14:36', '2025-09-02 21:14:36');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `incoterms_reference`
--

CREATE TABLE `incoterms_reference` (
  `id` int(11) NOT NULL,
  `code` varchar(10) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `transportation_mode` enum('any','sea_inland') NOT NULL,
  `export_packaging` enum('seller','buyer','negotiable') DEFAULT 'seller',
  `loading_charges` enum('seller','buyer','negotiable') DEFAULT 'seller',
  `delivery_to_port` enum('seller','buyer','negotiable') DEFAULT 'seller',
  `export_customs` enum('seller','buyer','negotiable') DEFAULT 'seller',
  `origin_terminal_charges` enum('seller','buyer','negotiable') DEFAULT 'seller',
  `loading_on_carriage` enum('seller','buyer','negotiable') DEFAULT 'seller',
  `carriage_charges` enum('seller','buyer','negotiable') DEFAULT 'seller',
  `insurance` enum('seller','buyer','negotiable') DEFAULT 'negotiable',
  `destination_terminal_charges` enum('seller','buyer','negotiable') DEFAULT 'buyer',
  `delivery_to_destination` enum('seller','buyer','negotiable') DEFAULT 'buyer',
  `unloading_at_destination` enum('seller','buyer','negotiable') DEFAULT 'buyer',
  `import_customs` enum('seller','buyer','negotiable') DEFAULT 'buyer',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `incoterms_reference`
--

INSERT INTO `incoterms_reference` (`id`, `code`, `name`, `description`, `transportation_mode`, `export_packaging`, `loading_charges`, `delivery_to_port`, `export_customs`, `origin_terminal_charges`, `loading_on_carriage`, `carriage_charges`, `insurance`, `destination_terminal_charges`, `delivery_to_destination`, `unloading_at_destination`, `import_customs`, `created_at`, `updated_at`) VALUES
(1, 'EXW', 'Ex Works (Place)', 'El vendedor pone las mercancías a disposición del comprador en sus instalaciones', 'any', 'seller', 'buyer', 'buyer', 'buyer', 'buyer', 'buyer', 'buyer', 'negotiable', 'buyer', 'buyer', 'buyer', 'buyer', '2025-09-02 17:27:42', '2025-09-02 17:27:42'),
(2, 'FCA', 'Free Carrier (Place)', 'El vendedor entrega las mercancías al transportista designado por el comprador', 'any', 'seller', 'seller', 'seller', 'seller', 'buyer', 'buyer', 'buyer', 'negotiable', 'buyer', 'buyer', 'buyer', 'buyer', '2025-09-02 17:27:42', '2025-09-02 17:27:42'),
(3, 'FAS', 'Free Alongside Ship (Port)', 'El vendedor entrega cuando las mercancías se colocan al costado del buque', 'sea_inland', 'seller', 'seller', 'seller', 'seller', 'seller', 'buyer', 'buyer', 'negotiable', 'buyer', 'buyer', 'buyer', 'buyer', '2025-09-02 17:27:42', '2025-09-02 17:27:42'),
(4, 'FOB', 'Free On Board (Port)', 'El vendedor entrega las mercancías a bordo del buque', 'sea_inland', 'seller', 'seller', 'seller', 'seller', 'seller', 'seller', 'buyer', 'negotiable', 'buyer', 'buyer', 'buyer', 'buyer', '2025-09-02 17:27:42', '2025-09-02 17:27:42'),
(5, 'CFR', 'Cost and Freight (Port)', 'El vendedor paga los costos y fletes hasta el puerto de destino', 'sea_inland', 'seller', 'seller', 'seller', 'seller', 'seller', 'seller', 'seller', 'negotiable', 'buyer', 'buyer', 'buyer', 'buyer', '2025-09-02 17:27:42', '2025-09-02 17:27:42'),
(6, 'CIF', 'Cost Insurance & Freight (Port)', 'El vendedor paga costos, seguro y flete hasta el puerto de destino', 'sea_inland', 'seller', 'seller', 'seller', 'seller', 'seller', 'seller', 'seller', 'seller', 'buyer', 'buyer', 'buyer', 'buyer', '2025-09-02 17:27:42', '2025-09-02 17:27:42'),
(7, 'CPT', 'Carriage Paid To (Place)', 'El vendedor paga el transporte hasta el destino acordado', 'any', 'seller', 'seller', 'seller', 'seller', 'seller', 'seller', 'seller', 'negotiable', 'seller', 'buyer', 'buyer', 'buyer', '2025-09-02 17:27:42', '2025-09-02 17:27:42'),
(8, 'CIP', 'Carriage and Insurance Paid to (Place)', 'El vendedor paga transporte y seguro hasta el destino', 'any', 'seller', 'seller', 'seller', 'seller', 'seller', 'seller', 'seller', 'seller', 'seller', 'buyer', 'buyer', 'buyer', '2025-09-02 17:27:42', '2025-09-02 17:27:42'),
(9, 'DAP', 'Delivered at Place (Place)', 'El vendedor entrega cuando las mercancías están listas para descarga', 'any', 'seller', 'seller', 'seller', 'seller', 'seller', 'seller', 'seller', 'negotiable', 'seller', 'seller', 'buyer', 'buyer', '2025-09-02 17:27:42', '2025-09-02 17:27:42'),
(10, 'DPU', 'Delivered at Place Unloaded (Place)', 'El vendedor entrega después de descargar en el lugar de destino', 'any', 'seller', 'seller', 'seller', 'seller', 'seller', 'seller', 'seller', 'negotiable', 'seller', 'seller', 'seller', 'buyer', '2025-09-02 17:27:42', '2025-09-02 17:27:42');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `nacional_requests`
--

CREATE TABLE `nacional_requests` (
  `id` int(11) NOT NULL,
  `request_id` int(11) NOT NULL,
  `total_pallets` int(11) DEFAULT 0,
  `total_boxes` int(11) DEFAULT 0,
  `weight_per_unit` decimal(10,2) NOT NULL,
  `weight_unit` varchar(10) DEFAULT 'kg',
  `unit_length` decimal(10,2) DEFAULT NULL,
  `unit_width` decimal(10,2) DEFAULT NULL,
  `unit_height` decimal(10,2) DEFAULT NULL,
  `dimension_unit` varchar(10) DEFAULT 'cm',
  `pickup_date` date NOT NULL,
  `pickup_address` text NOT NULL,
  `ship_hours_start` time DEFAULT NULL,
  `ship_hours_end` time DEFAULT NULL,
  `contact_name` varchar(255) NOT NULL,
  `contact_phone` varchar(100) DEFAULT NULL,
  `delivery_place` text DEFAULT 'Av. de la luz #24 int. 3 y 4 Acceso III. Parque Ind. Benito Juárez 76120, Querétaro. México',
  `delivery_date_plant` date DEFAULT NULL,
  `order_number` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `nacional_requests`
--

INSERT INTO `nacional_requests` (`id`, `request_id`, `total_pallets`, `total_boxes`, `weight_per_unit`, `weight_unit`, `unit_length`, `unit_width`, `unit_height`, `dimension_unit`, `pickup_date`, `pickup_address`, `ship_hours_start`, `ship_hours_end`, `contact_name`, `contact_phone`, `delivery_place`, `delivery_date_plant`, `order_number`, `created_at`, `updated_at`) VALUES
(1, 2, 4, 12, 85.75, 'kg', 120.00, 80.00, 100.00, 'cm', '2025-09-05', 'Proveedor Nacional SA de CV, Av. Industria #456, Tijuana, BC 22010, México', '08:00:00', '17:00:00', 'Ana Rodríguez', '+52 442 987 6543', 'Av. de la luz #24 int. 3 y 4 Acceso III. Parque Ind. Benito Juárez 76120, Querétaro. México', NULL, 'ORD-NAL-2025-002', '2025-09-02 21:14:36', '2025-09-02 21:14:36'),
(2, 5, 2, 8, 65.40, 'kg', 100.00, 70.00, 80.00, 'cm', '2025-08-26', 'Metalúrgica del Norte SA, Blvd. Industrial #123, Monterrey, NL 64000, México', NULL, NULL, 'Roberto Jiménez', '+52 442 111 2233', 'Av. de la luz #24 int. 3 y 4 Acceso III. Parque Ind. Benito Juárez 76120, Querétaro. México', NULL, 'ORD-MTY-2025-005', '2025-09-02 21:14:36', '2025-09-02 21:14:36'),
(3, 9, 3, 9, 75.20, 'kg', NULL, NULL, NULL, 'cm', '2025-09-07', 'Proveedor Regional SA, Av. México #321, León, GTO', NULL, NULL, 'Sergio Vega', '+52 442 999 8877', 'Av. de la luz #24 int. 3 y 4 Acceso III. Parque Ind. Benito Juárez 76120, Querétaro. México', NULL, 'ORD-GTO-2025-006', '2025-09-02 21:14:36', '2025-09-02 21:14:36'),
(4, 12, 5, 15, 95.60, 'kg', NULL, NULL, NULL, 'cm', '2025-09-08', 'Materias Primas del Bajío SA, Km 15 Carr. Irapuato-León, GTO', NULL, NULL, 'Mónica Herrera', '+52 442 666 3322', 'Av. de la luz #24 int. 3 y 4 Acceso III. Parque Ind. Benito Juárez 76120, Querétaro. México', NULL, 'ORD-MP-2025-009', '2025-09-02 21:14:36', '2025-09-02 21:14:36');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `quotes`
--

CREATE TABLE `quotes` (
  `id` int(11) NOT NULL,
  `request_id` int(11) DEFAULT NULL,
  `carrier_id` int(11) DEFAULT NULL,
  `cost` decimal(10,2) DEFAULT NULL,
  `currency` varchar(10) DEFAULT NULL,
  `estimated_delivery_time` varchar(100) DEFAULT NULL,
  `raw_response` text DEFAULT NULL,
  `ai_analysis` text DEFAULT NULL,
  `is_selected` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `quotes`
--

INSERT INTO `quotes` (`id`, `request_id`, `carrier_id`, `cost`, `currency`, `estimated_delivery_time`, `raw_response`, `ai_analysis`, `is_selected`, `created_at`) VALUES
(1, 1, 2, 1250.00, 'USD', '3-5 días hábiles', NULL, NULL, 1, '2025-08-29 09:30:00'),
(2, 1, 1, 1380.50, 'USD', '2-4 días hábiles', NULL, NULL, 0, '2025-08-29 11:15:00'),
(3, 1, 3, 1195.75, 'USD', '4-6 días hábiles', NULL, NULL, 0, '2025-08-29 14:20:00'),
(4, 2, 4, 15500.00, 'MXN', '2-3 días hábiles', NULL, NULL, 0, '2025-09-01 16:45:00'),
(5, 2, 5, 14750.00, 'MXN', '3-4 días hábiles', NULL, NULL, 0, '2025-09-02 08:30:00'),
(6, 5, 5, 12800.00, 'MXN', '1-2 días hábiles', NULL, NULL, 1, '2025-08-25 15:30:00'),
(7, 5, 4, 13200.00, 'MXN', '2-3 días hábiles', NULL, NULL, 0, '2025-08-25 17:15:00'),
(8, 6, 2, 950.00, 'USD', '3-5 días hábiles', NULL, NULL, 0, '2025-08-31 10:20:00'),
(9, 6, 1, 1050.25, 'USD', '2-4 días hábiles', NULL, NULL, 0, '2025-08-31 12:45:00'),
(10, 7, 1, 2850.00, 'USD', '12-15 días hábiles', NULL, NULL, 1, '2025-08-21 08:15:00'),
(11, 7, 3, 2650.50, 'USD', '15-18 días hábiles', NULL, NULL, 0, '2025-08-21 11:30:00'),
(12, 11, 2, 485.00, 'USD', '2-3 días hábiles', NULL, NULL, 1, '2025-08-19 09:20:00'),
(13, 12, 4, 18500.00, 'MXN', '3-4 días hábiles', NULL, NULL, 0, '2025-09-01 14:30:00'),
(14, 12, 5, 17250.00, 'MXN', '2-3 días hábiles', NULL, NULL, 0, '2025-09-01 16:45:00');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sap_queue`
--

CREATE TABLE `sap_queue` (
  `id` int(11) NOT NULL,
  `quote_id` int(11) NOT NULL,
  `status` enum('pending','processing','success','failed') DEFAULT 'pending',
  `sap_response` text DEFAULT NULL,
  `error_message` text DEFAULT NULL,
  `retry_count` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `processed_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `shipping_requests`
--

CREATE TABLE `shipping_requests` (
  `id` int(11) NOT NULL,
  `internal_reference` varchar(100) DEFAULT NULL COMMENT 'Referencia interna GRAMMER',
  `user_name` varchar(100) NOT NULL,
  `company_area` varchar(100) DEFAULT 'Logística y Tráfico',
  `status` enum('pending','quoting','completed','canceled') DEFAULT 'pending',
  `origin_details` text NOT NULL,
  `destination_details` text NOT NULL,
  `package_details` text NOT NULL,
  `method_specific_data` text DEFAULT NULL COMMENT 'JSON con datos específicos del método',
  `service_type` enum('air','sea','land') NOT NULL,
  `shipping_method` enum('fedex','aereo_maritimo','nacional') NOT NULL DEFAULT 'fedex',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `shipping_requests`
--

INSERT INTO `shipping_requests` (`id`, `internal_reference`, `user_name`, `company_area`, `status`, `origin_details`, `destination_details`, `package_details`, `method_specific_data`, `service_type`, `shipping_method`, `created_at`, `updated_at`) VALUES
(1, 'FDX2508001', 'Carlos Mendoza', 'Logística y Tráfico', 'completed', '{}', '{}', '{}', NULL, 'air', 'fedex', '2025-08-28 10:30:00', '2025-08-30 14:20:00'),
(2, 'NAC2509001', 'Ana Rodríguez', 'Logística y Tráfico', 'quoting', '{}', '{}', '{}', NULL, 'land', 'nacional', '2025-09-01 08:45:00', '2025-09-01 08:45:00'),
(3, 'AMS2509001', 'Miguel Santos', 'Compras Internacionales', 'pending', '{}', '{}', '{}', NULL, 'sea', 'aereo_maritimo', '2025-09-02 14:20:00', '2025-09-02 14:20:00'),
(4, 'FDX2509001', 'Laura García', 'Ingeniería', 'quoting', '{}', '{}', '{}', NULL, 'air', 'fedex', '2025-09-02 16:15:00', '2025-09-02 16:15:00'),
(5, 'NAC2508001', 'Roberto Jiménez', 'Producción', 'completed', '{}', '{}', '{}', NULL, 'land', 'nacional', '2025-08-25 11:20:00', '2025-08-27 09:30:00'),
(6, 'FDX2508800', 'Patricia López', 'Logística y Tráfico', 'quoting', '{\"country\": \"México\", \"address\": \"Calle Proveedores #789, Guadalajara, JAL 44100\", \"postal_code\": \"44100\", \"contact\": \"Patricia López\"}', '{\"country\": \"Estados Unidos\", \"address\": \"5678 Manufacturing St, El Paso, TX 79901\", \"postal_code\": \"79901\", \"contact\": \"Mike Johnson\"}', '[{\"description\": \"Herramientas de manufactura\", \"quantity\": 1, \"weight\": 95.5, \"dimensions\": {\"length\": 150, \"width\": 100, \"height\": 80}}]', NULL, 'air', 'fedex', '2025-08-30 13:45:00', '2025-08-30 13:45:00'),
(7, 'FDX2508880', 'Fernando Morales', 'Logística y Tráfico', 'completed', '{\"country\": \"Brasil\", \"address\": \"Rua Industrial 456, São Paulo, SP 01234\", \"postal_code\": \"01234\", \"contact\": \"João Silva\"}', '{\"country\": \"México\", \"address\": \"Av. de la luz #24 int. 3 y 4, Querétaro, QRO 76120\", \"postal_code\": \"76120\", \"contact\": \"Fernando Morales\"}', '[{\"description\": \"Materia prima especializada\", \"quantity\": 20, \"weight\": 125.0, \"dimensions\": {\"length\": 120, \"width\": 80, \"height\": 60}}, {\"description\": \"Componentes de refacción\", \"quantity\": 5, \"weight\": 35.5, \"dimensions\": {\"length\": 80, \"width\": 60, \"height\": 40}}]', NULL, 'sea', 'fedex', '2025-08-20 09:15:00', '2025-08-22 16:45:00'),
(8, 'FDX2508888', 'Diana Ruiz', 'Calidad', 'canceled', '{}', '{}', '{}', NULL, 'air', 'fedex', '2025-08-15 14:00:00', '2025-09-02 21:14:36'),
(9, 'NAC2509900', 'Sergio Vega', 'Logística y Tráfico', 'pending', '{}', '{}', '{}', NULL, 'land', 'nacional', '2025-09-02 17:30:00', '2025-09-02 21:14:36'),
(10, 'AMS2508001', 'Isabel Corona', 'Ingeniería', 'quoting', '{}', '{}', '{}', NULL, 'sea', 'aereo_maritimo', '2025-08-31 10:15:00', '2025-09-02 21:14:36'),
(11, 'FDX2508888', 'Alejandro Pérez', 'IT', 'completed', '{}', '{}', '{}', NULL, 'air', 'fedex', '2025-08-18 16:45:00', '2025-09-02 21:14:36'),
(12, 'NAC2509990', 'Mónica Herrera', 'Compras', 'quoting', '{}', '{}', '{}', NULL, 'land', 'nacional', '2025-09-01 12:20:00', '2025-09-02 21:14:36');

--
-- Disparadores `shipping_requests`
--
DELIMITER $$
CREATE TRIGGER `generate_reference_before_insert` BEFORE INSERT ON `shipping_requests` FOR EACH ROW BEGIN
    IF NEW.internal_reference IS NULL THEN
        SET NEW.internal_reference = generate_internal_reference(NEW.shipping_method, NEW.created_at);
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `shipping_requests_detailed`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `shipping_requests_detailed` (
`id` int(11)
,`internal_reference` varchar(100)
,`user_name` varchar(100)
,`company_area` varchar(100)
,`status` enum('pending','quoting','completed','canceled')
,`service_type` enum('air','sea','land')
,`shipping_method` enum('fedex','aereo_maritimo','nacional')
,`created_at` timestamp
,`updated_at` timestamp
,`method_details` mediumtext
);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `system_logs`
--

CREATE TABLE `system_logs` (
  `id` int(11) NOT NULL,
  `level` enum('info','warning','error','debug') NOT NULL,
  `message` text NOT NULL,
  `context` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `aereo_maritimo_requests`
--
ALTER TABLE `aereo_maritimo_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_aereo_maritimo_request_id` (`request_id`),
  ADD KEY `idx_aereo_maritimo_pickup_date` (`pickup_date`);

--
-- Indices de la tabla `app_config`
--
ALTER TABLE `app_config`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `config_key` (`config_key`);

--
-- Indices de la tabla `carriers`
--
ALTER TABLE `carriers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indices de la tabla `fedex_requests`
--
ALTER TABLE `fedex_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_fedex_request_id` (`request_id`),
  ADD KEY `idx_fedex_order_number` (`order_number`);

--
-- Indices de la tabla `incoterms_reference`
--
ALTER TABLE `incoterms_reference`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `idx_incoterms_code` (`code`);

--
-- Indices de la tabla `nacional_requests`
--
ALTER TABLE `nacional_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_nacional_request_id` (`request_id`),
  ADD KEY `idx_nacional_pickup_date` (`pickup_date`);

--
-- Indices de la tabla `quotes`
--
ALTER TABLE `quotes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `carrier_id` (`carrier_id`),
  ADD KEY `idx_quotes_request_id` (`request_id`),
  ADD KEY `idx_quotes_is_selected` (`is_selected`);

--
-- Indices de la tabla `sap_queue`
--
ALTER TABLE `sap_queue`
  ADD PRIMARY KEY (`id`),
  ADD KEY `quote_id` (`quote_id`),
  ADD KEY `idx_sap_queue_status` (`status`);

--
-- Indices de la tabla `shipping_requests`
--
ALTER TABLE `shipping_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_shipping_requests_status` (`status`),
  ADD KEY `idx_shipping_requests_created` (`created_at`);

--
-- Indices de la tabla `system_logs`
--
ALTER TABLE `system_logs`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `aereo_maritimo_requests`
--
ALTER TABLE `aereo_maritimo_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `app_config`
--
ALTER TABLE `app_config`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT de la tabla `carriers`
--
ALTER TABLE `carriers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `fedex_requests`
--
ALTER TABLE `fedex_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `incoterms_reference`
--
ALTER TABLE `incoterms_reference`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `nacional_requests`
--
ALTER TABLE `nacional_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `quotes`
--
ALTER TABLE `quotes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT de la tabla `sap_queue`
--
ALTER TABLE `sap_queue`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `shipping_requests`
--
ALTER TABLE `shipping_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `system_logs`
--
ALTER TABLE `system_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

-- --------------------------------------------------------

--
-- Estructura para la vista `shipping_requests_detailed`
--
DROP TABLE IF EXISTS `shipping_requests_detailed`;

CREATE ALGORITHM=UNDEFINED DEFINER=`u909553968_traffic`@`127.0.0.1` SQL SECURITY DEFINER VIEW `shipping_requests_detailed`  AS SELECT `sr`.`id` AS `id`, `sr`.`internal_reference` AS `internal_reference`, `sr`.`user_name` AS `user_name`, `sr`.`company_area` AS `company_area`, `sr`.`status` AS `status`, `sr`.`service_type` AS `service_type`, `sr`.`shipping_method` AS `shipping_method`, `sr`.`created_at` AS `created_at`, `sr`.`updated_at` AS `updated_at`, CASE WHEN `sr`.`shipping_method` = 'fedex' THEN json_object('origin_company',`fr`.`origin_company_name`,'destination_company',`fr`.`destination_company_name`,'total_packages',`fr`.`total_packages`,'total_weight',`fr`.`total_weight`,'order_number',`fr`.`order_number`) WHEN `sr`.`shipping_method` = 'aereo_maritimo' THEN json_object('total_pallets',`amr`.`total_pallets`,'total_boxes',`amr`.`total_boxes`,'weight_per_unit',`amr`.`weight_per_unit`,'pickup_date',`amr`.`pickup_date`,'incoterm',`amr`.`incoterm`,'delivery_type',`amr`.`delivery_type`) WHEN `sr`.`shipping_method` = 'nacional' THEN json_object('total_pallets',`nr`.`total_pallets`,'total_boxes',`nr`.`total_boxes`,'weight_per_unit',`nr`.`weight_per_unit`,'pickup_date',`nr`.`pickup_date`,'delivery_place',`nr`.`delivery_place`) ELSE NULL END AS `method_details` FROM (((`shipping_requests` `sr` left join `fedex_requests` `fr` on(`sr`.`id` = `fr`.`request_id`)) left join `aereo_maritimo_requests` `amr` on(`sr`.`id` = `amr`.`request_id`)) left join `nacional_requests` `nr` on(`sr`.`id` = `nr`.`request_id`)) ;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `aereo_maritimo_requests`
--
ALTER TABLE `aereo_maritimo_requests`
  ADD CONSTRAINT `aereo_maritimo_requests_ibfk_1` FOREIGN KEY (`request_id`) REFERENCES `shipping_requests` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `fedex_requests`
--
ALTER TABLE `fedex_requests`
  ADD CONSTRAINT `fedex_requests_ibfk_1` FOREIGN KEY (`request_id`) REFERENCES `shipping_requests` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `nacional_requests`
--
ALTER TABLE `nacional_requests`
  ADD CONSTRAINT `nacional_requests_ibfk_1` FOREIGN KEY (`request_id`) REFERENCES `shipping_requests` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `quotes`
--
ALTER TABLE `quotes`
  ADD CONSTRAINT `quotes_ibfk_1` FOREIGN KEY (`request_id`) REFERENCES `shipping_requests` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `quotes_ibfk_2` FOREIGN KEY (`carrier_id`) REFERENCES `carriers` (`id`);

--
-- Filtros para la tabla `sap_queue`
--
ALTER TABLE `sap_queue`
  ADD CONSTRAINT `sap_queue_ibfk_1` FOREIGN KEY (`quote_id`) REFERENCES `quotes` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

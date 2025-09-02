<?php

// Clase para manejar la conexión a la Base de Datos
class LocalConector {

    // Propiedades de conexión
    private $host = "127.0.0.1:3306"; // Dirección del servidor
    private $usuario = "u909553968_traffic"; // Usuario de la BD
    private $password = "PremiumFreight***2025"; // Contraseña del Usuario
    private $database = "u909553968_cotizaciones"; // Nombre de la BD
    private $conexion;

    // Método para establecer la conexión
    public function conectar() {
        $this->conexion = mysqli_connect($this->host, $this->usuario, $this->password, $this->database);
        if ($this->conexion->connect_error) {
            die("Error al conectar con la base de datos");
        }
        return $this->conexion; // Retorna el objeto de conexión
    }
}













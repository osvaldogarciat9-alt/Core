<?php
// backend/config.php
class PushConfig {
    private $vapidKeys;
    
    public function __construct() {
        // ESTAS CLAVES DEBEN GENERARSE UNA VEZ Y USARSE SIEMPRE
        // Pueden generar unas nuevas en: https://web-push-codelab.glitch.me/
        $this->vapidKeys = [
            'publicKey' => 'BOEQSjdhorIf8M0XFNlwohK3sTz6h-J2SVIptPfR7mpOlGCdXK1qF7H2aV0-5Fz4kd-v2CCkzDnQvQxQpLOaZjY',
            'privateKey' => 'S2g6Y3gWEMeeU2yTSLqmVLGFcMr4NlTqdDUqObU7J8w'
        ];
    }
    
    public function getVapidKeys() {
        return $this->vapidKeys;
    }
    
    public function getAuthHeaders() {
        return [
            'Authorization: Bearer ' . $this->generateAuthToken(),
            'Content-Type: application/json'
        ];
    }
    
    private function generateAuthToken() {
        // En un entorno real, aquí implementarías tu lógica de autenticación
        return 'server-auth-token';
    }
}
?>
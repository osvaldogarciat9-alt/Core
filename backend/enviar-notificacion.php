<?php
// backend/enviar-notificacion.php
require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$tipo = $input['tipo'] ?? 'test';

// Cargar suscripciones
$suscripciones = [];
if (file_exists('suscripciones.json')) {
    $suscripciones = json_decode(file_get_contents('suscripciones.json'), true);
}

if (empty($suscripciones)) {
    echo json_encode(['success' => false, 'message' => 'No hay suscripciones activas']);
    exit;
}

$config = new PushConfig();
$results = [];
$enviadas = 0;

foreach ($suscripciones as $id => $data) {
    $result = enviarNotificacionWebPush($data['suscripcion'], $tipo, $config);
    $results[$id] = $result;
    
    if ($result['success']) {
        $enviadas++;
    }
}

echo json_encode([
    'success' => true,
    'message' => "Notificaciones procesadas: $enviadas enviadas de " . count($suscripciones),
    'total' => count($suscripciones),
    'enviadas' => $enviadas,
    'results' => $results
]);

function enviarNotificacionWebPush($suscripcion, $tipo, $config) {
    $payload = generarPayload($tipo);
    
    // Datos que se enviarán en la notificación
    $data = [
        'title' => $payload['title'],
        'body' => $payload['body'],
        'icon' => '/assets/icon-192.png',
        'badge' => '/assets/badge-72.png',
        'url' => $payload['url'],
        'actions' => [
            [
                'action' => 'ver',
                'title' => '👀 Ver'
            ],
            [
                'action' => 'cerrar',
                'title' => '❌ Cerrar'
            ]
        ]
    ];

    // El payload debe ser un string JSON
    $postData = json_encode($data);
    
    // Headers para Web Push estándar
    $headers = [
        'Content-Type: application/json',
        'Content-Length: ' . strlen($postData)
    ];

    // Usar el endpoint de la suscripción directamente
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $suscripcion['endpoint']);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Solo para desarrollo
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    return [
        'success' => ($httpCode >= 200 && $httpCode < 300),
        'httpCode' => $httpCode,
        'response' => $response,
        'error' => $error
    ];
}

function generarPayload($tipo) {
    switch ($tipo) {
        case 'oferta':
            return [
                'title' => '🎉 ¡Oferta Especial!',
                'body' => '20% de descuento en Desarollo de Videojuegos.',
                'url' => '/ofertas'
            ];
        case 'recordatorio':
            return [
                'title' => '⏰ Recordatorio',
                'body' => 'Tu carrito te espera. ¡Completa tu compra!',
                'url' => '/carrito'
            ];
        case 'test':
        default:
            return [
                'title' => '✅ Demo Exitosa - 10C EVND',
                'body' => '¡Funciona! Las notificaciones push están configuradas correctamente.',
                'url' => '/'
            ];
    }
}
?>
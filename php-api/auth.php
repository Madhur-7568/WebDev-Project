<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

$email = filter_var(trim($data['email'] ?? ''), FILTER_VALIDATE_EMAIL);
$role = htmlspecialchars(strip_tags(trim($data['role'] ?? 'organizer')), ENT_QUOTES, 'UTF-8');

if (!$email) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Valid institutional email is required.']);
    exit;
}

$allowedRoles = ['organizer', 'attendee', 'venue_manager', 'staff', 'superadmin'];
if (!in_array($role, $allowedRoles, true)) {
    $role = 'organizer';
}

echo json_encode([
    'status' => 'success',
    'message' => 'Authenticated successfully',
    'user' => [
        'email' => $email,
        'role' => $role,
        'token' => bin2hex(random_bytes(16))
    ]
], JSON_PRETTY_PRINT);

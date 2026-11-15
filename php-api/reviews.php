<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$storageFile = __DIR__ . '/reviews_data.json';

if (!file_exists($storageFile)) {
    file_put_contents($storageFile, json_encode([], JSON_PRETTY_PRINT));
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $reviews = json_decode(file_get_contents($storageFile), true) ?: [];
    $eventId = $_GET['eventId'] ?? null;
    if ($eventId && $eventId !== 'all') {
        $reviews = array_values(array_filter($reviews, fn($r) => ($r['eventId'] ?? '') === $eventId));
    }
    echo json_encode(['status' => 'success', 'reviews' => $reviews]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $payload = json_decode(file_get_contents('php://input'), true);
    if (!$payload || empty($payload['comment'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Review comment is required.']);
        exit;
    }

    $rating = max(1, min(5, intval($payload['rating'] ?? 5)));
    $entry = [
        'id'         => 'rev-' . time(),
        'eventId'    => htmlspecialchars(strip_tags($payload['eventId'] ?? 'evt-1')),
        'eventTitle' => htmlspecialchars(strip_tags($payload['eventTitle'] ?? 'Campus Event')),
        'author'     => htmlspecialchars(strip_tags($payload['author'] ?? 'Anonymous Student')),
        'role'       => htmlspecialchars(strip_tags($payload['role'] ?? 'Student Attendee')),
        'rating'     => $rating,
        'comment'    => htmlspecialchars(strip_tags($payload['comment'])),
        'date'       => date('Y-m-d'),
        'helpful'    => 0
    ];

    $reviews = json_decode(file_get_contents($storageFile), true) ?: [];
    array_unshift($reviews, $entry);
    file_put_contents($storageFile, json_encode($reviews, JSON_PRETTY_PRINT));

    echo json_encode(['status' => 'success', 'review' => $entry]);
    exit;
}

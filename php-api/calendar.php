<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$month = isset($_GET['month']) ? preg_replace('/[^0-9\-]/', '', $_GET['month']) : date('Y-m');
$category = isset($_GET['category']) ? htmlspecialchars(strip_tags(trim($_GET['category'])), ENT_QUOTES, 'UTF-8') : 'All';

$sampleEvents = [
    [
        'id' => 'evt_101',
        'title' => 'HackCampus 2026: 24h National Hackathon',
        'category' => 'Technical',
        'venue' => 'Main Auditorium & CS Labs 3 & 4',
        'date' => '2026-11-20T09:00',
        'endDate' => '2026-11-21T09:00'
    ],
    [
        'id' => 'evt_102',
        'title' => 'Tarangini 2026: Annual Inter-College Cultural Gala',
        'category' => 'Cultural',
        'venue' => 'Tagore Open-Air Theatre (OAT)',
        'date' => '2026-11-28T17:30',
        'endDate' => '2026-11-30T22:00'
    ]
];

$filtered = array_values(array_filter($sampleEvents, function ($evt) use ($month, $category) {
    $matchesMonth = strpos($evt['date'], $month) === 0;
    $matchesCat = ($category === 'All') || (strcasecmp($evt['category'], $category) === 0);
    return $matchesMonth && $matchesCat;
}));

echo json_encode([
    'status' => 'success',
    'month' => $month,
    'category' => $category,
    'count' => count($filtered),
    'events' => $filtered
], JSON_PRETTY_PRINT);

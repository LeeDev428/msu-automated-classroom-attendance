<?php
/**
 * GET /attendance/student_history.php?student_id={id}&class_id={id}
 * Returns per-date attendance history for one student in one class.
 */
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

require_once '../core/Database.php';

$database = new Database();
$db = $database->getConnection();

$headers = getallheaders();
$token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : '';
if (empty($token)) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No token provided']); exit();
}
$decoded = explode(':', base64_decode($token));
$userId  = $decoded[0] ?? null;
if (!$userId) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Invalid token']); exit();
}

$studentId = $_GET['student_id'] ?? null;
$classId   = $_GET['class_id']   ?? null;

if (!$studentId || !$classId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'student_id and class_id are required']); exit();
}

try {
    // Verify class belongs to this instructor
    $chk = $db->prepare("SELECT id FROM classes WHERE id = ? AND instructor_id = ?");
    $chk->execute([$classId, $userId]);
    if (!$chk->fetch()) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Access denied']); exit();
    }

    // Per-date attendance records
    $stmt = $db->prepare("
        SELECT
            a.id,
            DATE_FORMAT(a.check_in_time, '%Y-%m-%d')       AS date,
            DATE_FORMAT(a.check_in_time, '%M %d, %Y')      AS date_formatted,
            DATE_FORMAT(a.check_in_time, '%h:%i %p')       AS time_in,
            a.status,
            a.notes
        FROM attendance a
        WHERE a.student_id = ? AND a.class_id = ?
        ORDER BY a.check_in_time DESC
    ");
    $stmt->execute([$studentId, $classId]);
    $records = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'records' => $records,
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>

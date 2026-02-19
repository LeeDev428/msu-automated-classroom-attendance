<?php
/**
 * Get Class Attendance Report
 * Endpoint: GET /reports/class_report.php?class_id={id}
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../core/Database.php';

$database = new Database();
$db = $database->getConnection();

$headers = getallheaders();
$token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : '';

if (empty($token)) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No token provided']);
    exit();
}

$decoded = explode(':', base64_decode($token));
$userId = $decoded[0] ?? null;

if (!$userId) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Invalid token']);
    exit();
}

$classId = $_GET['class_id'] ?? null;

if (!$classId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Class ID is required']);
    exit();
}

try {
    // Verify the class belongs to the instructor
    $verifyStmt = $db->prepare("SELECT id, class_name, class_code, section FROM classes WHERE id = ? AND instructor_id = ?");
    $verifyStmt->execute([$classId, $userId]);
    $class = $verifyStmt->fetch(PDO::FETCH_ASSOC);

    if (!$class) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'You do not have access to this class']);
        exit();
    }

    // Get total enrolled students
    $enrolledStmt = $db->prepare("SELECT COUNT(*) as total FROM enrollments WHERE class_id = ? AND status = 'active'");
    $enrolledStmt->execute([$classId]);
    $enrolled = $enrolledStmt->fetch(PDO::FETCH_ASSOC);

    // Get total unique session days
    $sessionsStmt = $db->prepare("SELECT COUNT(DISTINCT DATE(check_in_time)) as sessions FROM attendance WHERE class_id = ?");
    $sessionsStmt->execute([$classId]);
    $sessions = $sessionsStmt->fetch(PDO::FETCH_ASSOC);

    // Get today's attendance count
    $today = date('Y-m-d');
    $todayPresentStmt = $db->prepare("SELECT COUNT(*) as present FROM attendance WHERE class_id = ? AND DATE(check_in_time) = ? AND status = 'present'");
    $todayPresentStmt->execute([$classId, $today]);
    $todayPresent = $todayPresentStmt->fetch(PDO::FETCH_ASSOC);

    // Get per-student attendance summary
    $studentsStmt = $db->prepare("
        SELECT 
            s.id,
            s.student_id,
            s.first_name,
            s.middle_initial,
            s.last_name,
            s.email,
            s.phone,
            COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
            COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_count,
            COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_count,
            COUNT(a.id) as total_sessions,
            ROUND(
                (COUNT(CASE WHEN a.status = 'present' THEN 1 END) / NULLIF(COUNT(a.id), 0)) * 100, 1
            ) as attendance_rate
        FROM students s
        INNER JOIN enrollments e ON s.id = e.student_id AND e.class_id = ? AND e.status = 'active'
        LEFT JOIN attendance a ON s.id = a.student_id AND a.class_id = ?
        GROUP BY s.id, s.student_id, s.first_name, s.middle_initial, s.last_name, s.email, s.phone
        ORDER BY s.last_name, s.first_name
    ");
    $studentsStmt->execute([$classId, $classId]);
    $students = $studentsStmt->fetchAll(PDO::FETCH_ASSOC);

    // Calculate overall rate
    $totalPresent = array_sum(array_column($students, 'present_count'));
    $totalRecords = array_sum(array_column($students, 'total_sessions'));
    $overallRate = $totalRecords > 0 ? round(($totalPresent / $totalRecords) * 100, 1) : 0;

    echo json_encode([
        'success' => true,
        'class' => $class,
        'summary' => [
            'total_enrolled' => (int)($enrolled['total'] ?? 0),
            'total_sessions' => (int)($sessions['sessions'] ?? 0),
            'present_today' => (int)($todayPresent['present'] ?? 0),
            'overall_attendance_rate' => $overallRate,
        ],
        'students' => $students,
        'generated_at' => date('Y-m-d H:i:s'),
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>

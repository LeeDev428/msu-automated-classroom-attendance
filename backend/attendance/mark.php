<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../core/Database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

$studentDbId = $data->studentId ?? null;
$classId     = $data->classId   ?? null;

if (!$studentDbId || !$classId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'studentId and classId are required']);
    exit();
}

try {
    // Get student info
    $studentStmt = $db->prepare("SELECT id, first_name, middle_initial, last_name, student_id FROM students WHERE id = ?");
    $studentStmt->execute([$studentDbId]);
    $student = $studentStmt->fetch(PDO::FETCH_ASSOC);

    if (!$student) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Student not found']);
        exit();
    }

    // Check enrollment
    $enrollStmt = $db->prepare("SELECT id FROM enrollments WHERE student_id = ? AND class_id = ? AND status = 'active'");
    $enrollStmt->execute([$studentDbId, $classId]);
    if ($enrollStmt->rowCount() === 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Student is not enrolled in this class']);
        exit();
    }

    // Check duplicate for today
    $today = date('Y-m-d');
    $dupStmt = $db->prepare("SELECT id FROM attendance WHERE student_id = ? AND class_id = ? AND DATE(check_in_time) = ?");
    $dupStmt->execute([$studentDbId, $classId, $today]);
    if ($dupStmt->rowCount() > 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Attendance already marked for today']);
        exit();
    }

    // Mark attendance
    $markStmt = $db->prepare("INSERT INTO attendance (student_id, class_id, check_in_time, status) VALUES (?, ?, NOW(), 'present')");
    $markStmt->execute([$studentDbId, $classId]);

    $nameParts = array_filter([$student['first_name'], $student['middle_initial'] ? $student['middle_initial'].'.' : null, $student['last_name']]);
    $fullName  = implode(' ', $nameParts);

    echo json_encode([
        'success'        => true,
        'message'        => 'Attendance marked successfully',
        'student_name'   => $fullName,
        'student_number' => $student['student_id'],
        'attendance_id'  => $db->lastInsertId(),
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>

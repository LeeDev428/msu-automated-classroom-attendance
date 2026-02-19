<?php
/**
 * Update Student Information
 * Endpoint: PUT /enrollments/update_student.php
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: PUT, OPTIONS");
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

$data = json_decode(file_get_contents("php://input"));

$studentDbId   = $data->id          ?? null;
$studentNumber = trim($data->student_id     ?? '');
$firstName     = trim($data->first_name     ?? '');
$middleInitial = trim($data->middle_initial ?? '');
$lastName      = trim($data->last_name      ?? '');
$email         = trim($data->email          ?? '');
$phone         = trim($data->phone          ?? '');

if (!$studentDbId || !$studentNumber || !$firstName || !$lastName) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'id, student_id, first_name, and last_name are required']);
    exit();
}

try {
    // Verify the student is enrolled in at least one class that belongs to this instructor
    $authStmt = $db->prepare("
        SELECT s.id FROM students s
        INNER JOIN enrollments e ON s.id = e.student_id
        INNER JOIN classes c ON e.class_id = c.id
        WHERE s.id = ? AND c.instructor_id = ?
        LIMIT 1
    ");
    $authStmt->execute([$studentDbId, $userId]);

    if (!$authStmt->fetch()) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'You do not have permission to edit this student']);
        exit();
    }

    // Check for duplicate student_id (excluding current student)
    $dupStmt = $db->prepare("SELECT id FROM students WHERE student_id = ? AND id != ?");
    $dupStmt->execute([$studentNumber, $studentDbId]);
    if ($dupStmt->fetch()) {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'Student ID already exists for another student']);
        exit();
    }

    // Check for duplicate email (excluding current student, only if email provided)
    if (!empty($email)) {
        $emailDupStmt = $db->prepare("SELECT id FROM students WHERE email = ? AND id != ?");
        $emailDupStmt->execute([$email, $studentDbId]);
        if ($emailDupStmt->fetch()) {
            http_response_code(409);
            echo json_encode(['success' => false, 'message' => 'Email already exists for another student']);
            exit();
        }
    }

    $updateStmt = $db->prepare("
        UPDATE students
        SET student_id = ?, first_name = ?, middle_initial = ?, last_name = ?, email = ?, phone = ?
        WHERE id = ?
    ");
    $updateStmt->execute([
        $studentNumber,
        $firstName,
        !empty($middleInitial) ? $middleInitial : null,
        $lastName,
        !empty($email) ? $email : null,
        !empty($phone) ? $phone : null,
        $studentDbId,
    ]);

    echo json_encode(['success' => true, 'message' => 'Student updated successfully']);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>

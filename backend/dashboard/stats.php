<?php
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

// Get user ID from token (simplified - in production use JWT)
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

try {
    // Get instructor info
    $userStmt = $db->prepare("SELECT name FROM users WHERE id = ?");
    $userStmt->execute([$userId]);
    $user = $userStmt->fetch(PDO::FETCH_ASSOC);
    
    // Get total enrolled students across all classes
    $enrolledStmt = $db->prepare("SELECT COUNT(DISTINCT e.student_id) as total 
        FROM enrollments e 
        JOIN classes c ON e.class_id = c.id 
        WHERE c.instructor_id = ?");
    $enrolledStmt->execute([$userId]);
    $enrolled = $enrolledStmt->fetch(PDO::FETCH_ASSOC);
    
    // Get total classes
    $classesStmt = $db->prepare("SELECT COUNT(*) as total FROM classes WHERE instructor_id = ?");
    $classesStmt->execute([$userId]);
    $classCount = $classesStmt->fetch(PDO::FETCH_ASSOC);
    
    // Get today's attendance
    $today = date('Y-m-d');
    $presentStmt = $db->prepare("SELECT COUNT(*) as total 
        FROM attendance a 
        JOIN classes c ON a.class_id = c.id 
        WHERE c.instructor_id = ? AND DATE(a.check_in_time) = ? AND a.status = 'present'");
    $presentStmt->execute([$userId, $today]);
    $present = $presentStmt->fetch(PDO::FETCH_ASSOC);
    
    $absentStmt = $db->prepare("SELECT COUNT(*) as total 
        FROM attendance a 
        JOIN classes c ON a.class_id = c.id 
        WHERE c.instructor_id = ? AND DATE(a.check_in_time) = ? AND a.status = 'absent'");
    $absentStmt->execute([$userId, $today]);
    $absent = $absentStmt->fetch(PDO::FETCH_ASSOC);
    
    // Calculate attendance rate
    $totalToday = ($present['total'] ?? 0) + ($absent['total'] ?? 0);
    $attendanceRate = $totalToday > 0 ? round(($present['total'] / $totalToday) * 100) : 0;
    
    echo json_encode([
        'success' => true,
        'data' => [
            'instructorName' => $user['name'] ?? 'Instructor',
            'date' => date('l, F j, Y'),
            'enrolledStudents' => (int)($enrolled['total'] ?? 0),
            'enrolledClasses' => (int)($classCount['total'] ?? 0),
            'presentToday' => (int)($present['total'] ?? 0),
            'absentToday' => (int)($absent['total'] ?? 0),
            'attendanceRate' => $attendanceRate
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>

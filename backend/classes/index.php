<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../core/Database.php';

$database = new Database();
$db = $database->getConnection();

// Get user ID from token
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

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            // Get all classes for instructor
            $stmt = $db->prepare("SELECT c.*, 
                (SELECT COUNT(*) FROM enrollments WHERE class_id = c.id) as enrolled,
                (SELECT COUNT(*) FROM attendance WHERE class_id = c.id AND date = CURDATE() AND status = 'present') as present_today
                FROM classes c WHERE c.instructor_id = ? ORDER BY c.created_at DESC");
            $stmt->execute([$userId]);
            $classes = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Calculate attendance rate for each class
            foreach ($classes as &$class) {
                $class['attendanceRate'] = $class['enrolled'] > 0 
                    ? round(($class['present_today'] / $class['enrolled']) * 100) 
                    : 0;
            }
            
            echo json_encode(['success' => true, 'data' => $classes]);
            break;
            
        case 'POST':
            // Create new class
            $data = json_decode(file_get_contents("php://input"));
            
            if (empty($data->class_name) || empty($data->class_code)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Class name and code required']);
                exit();
            }
            
            // Check if class code exists
            $check = $db->prepare("SELECT id FROM classes WHERE class_code = ?");
            $check->execute([$data->class_code]);
            if ($check->rowCount() > 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Class code already exists']);
                exit();
            }
            
            $stmt = $db->prepare("INSERT INTO classes (instructor_id, class_name, class_code, section, schedule, room) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $userId,
                $data->class_name,
                $data->class_code,
                $data->section ?? null,
                $data->schedule ?? null,
                $data->room ?? null
            ]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Class created successfully',
                'id' => $db->lastInsertId()
            ]);
            break;
            
        case 'PUT':
            // Update class
            $data = json_decode(file_get_contents("php://input"));
            
            if (empty($data->id)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Class ID required']);
                exit();
            }
            
            $stmt = $db->prepare("UPDATE classes SET class_name = ?, section = ?, schedule = ?, room = ? WHERE id = ? AND instructor_id = ?");
            $stmt->execute([
                $data->class_name,
                $data->section ?? null,
                $data->schedule ?? null,
                $data->room ?? null,
                $data->id,
                $userId
            ]);
            
            echo json_encode(['success' => true, 'message' => 'Class updated successfully']);
            break;
            
        case 'DELETE':
            $classId = $_GET['id'] ?? null;
            
            if (!$classId) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Class ID required']);
                exit();
            }
            
            $stmt = $db->prepare("DELETE FROM classes WHERE id = ? AND instructor_id = ?");
            $stmt->execute([$classId, $userId]);
            
            echo json_encode(['success' => true, 'message' => 'Class deleted successfully']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>

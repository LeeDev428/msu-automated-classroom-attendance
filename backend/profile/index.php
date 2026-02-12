<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, PUT, OPTIONS");
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
            // Get user profile
            $stmt = $db->prepare("SELECT id, name, email, role, department, employee_id, created_at FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$user) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'User not found']);
                exit();
            }
            
            echo json_encode(['success' => true, 'data' => $user]);
            break;
            
        case 'PUT':
            // Update profile
            $data = json_decode(file_get_contents("php://input"));
            
            $updates = [];
            $params = [];
            
            if (!empty($data->name)) {
                $updates[] = "name = ?";
                $params[] = $data->name;
            }
            if (!empty($data->department)) {
                $updates[] = "department = ?";
                $params[] = $data->department;
            }
            if (!empty($data->password)) {
                $updates[] = "password = ?";
                $params[] = password_hash($data->password, PASSWORD_BCRYPT);
            }
            
            if (empty($updates)) {
                echo json_encode(['success' => true, 'message' => 'Nothing to update']);
                exit();
            }
            
            $params[] = $userId;
            $sql = "UPDATE users SET " . implode(', ', $updates) . " WHERE id = ?";
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            
            echo json_encode(['success' => true, 'message' => 'Profile updated successfully']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>

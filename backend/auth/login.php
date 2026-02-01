<?php
// backend/auth/login.php
// Handle instructor login

include_once '../config/cors.php';
include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

$response = array();

try {
    if (!empty($data->email) && !empty($data->password) && !empty($data->role)) {
        $query = "SELECT id, name, email, password, role, department, employee_id 
                 FROM users 
                 WHERE email = :email AND role = :role";

        $stmt = $db->prepare($query);
        $stmt->bindParam(":email", $data->email);
        $stmt->bindParam(":role", $data->role);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            // Verify password
            if (password_verify($data->password, $row['password'])) {
                http_response_code(200);
                $response['success'] = true;
                $response['message'] = "Login successful";
                $response['user'] = array(
                    'id' => $row['id'],
                    'name' => $row['name'],
                    'email' => $row['email'],
                    'role' => $row['role'],
                    'department' => $row['department'],
                    'employee_id' => $row['employee_id']
                );
                // In production, generate and return JWT token here
                $response['token'] = base64_encode($row['id'] . ":" . time());
            } else {
                http_response_code(401);
                $response['success'] = false;
                $response['message'] = "Invalid password";
            }
        } else {
            http_response_code(401);
            $response['success'] = false;
            $response['message'] = "User not found";
        }
    } else {
        http_response_code(400);
        $response['success'] = false;
        $response['message'] = "Email, password, and role are required";
    }
} catch (Exception $e) {
    http_response_code(500);
    $response['success'] = false;
    $response['message'] = "Server error: " . $e->getMessage();
}

echo json_encode($response);
?>

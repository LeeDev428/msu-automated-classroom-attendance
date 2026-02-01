<?php
// backend/auth/register.php
// Handle instructor registration

include_once '../config/cors.php';
include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

$response = array();

try {
    // Validate required fields
    if (
        !empty($data->fullName) &&
        !empty($data->email) &&
        !empty($data->department) &&
        !empty($data->employeeId) &&
        !empty($data->password) &&
        !empty($data->role)
    ) {
        // Check if email already exists
        $check_query = "SELECT id FROM users WHERE email = :email";
        $check_stmt = $db->prepare($check_query);
        $check_stmt->bindParam(":email", $data->email);
        $check_stmt->execute();

        if ($check_stmt->rowCount() > 0) {
            http_response_code(400);
            $response['success'] = false;
            $response['message'] = "Email already registered";
        } else {
            // Insert new user
            $query = "INSERT INTO users 
                     (name, email, password, role, department, employee_id, created_at) 
                     VALUES 
                     (:name, :email, :password, :role, :department, :employee_id, NOW())";

            $stmt = $db->prepare($query);

            // Hash password
            $hashed_password = password_hash($data->password, PASSWORD_BCRYPT);

            // Bind values
            $stmt->bindParam(":name", $data->fullName);
            $stmt->bindParam(":email", $data->email);
            $stmt->bindParam(":password", $hashed_password);
            $stmt->bindParam(":role", $data->role);
            $stmt->bindParam(":department", $data->department);
            $stmt->bindParam(":employee_id", $data->employeeId);

            if ($stmt->execute()) {
                http_response_code(201);
                $response['success'] = true;
                $response['message'] = "Registration successful";
                $response['user_id'] = $db->lastInsertId();
            } else {
                http_response_code(500);
                $response['success'] = false;
                $response['message'] = "Unable to register user";
            }
        }
    } else {
        http_response_code(400);
        $response['success'] = false;
        $response['message'] = "All fields are required";
    }
} catch (Exception $e) {
    http_response_code(500);
    $response['success'] = false;
    $response['message'] = "Server error: " . $e->getMessage();
}

echo json_encode($response);
?>

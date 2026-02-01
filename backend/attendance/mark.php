<?php
// backend/attendance/mark.php
// Mark student attendance via QR code scan

include_once '../config/cors.php';
include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

$response = array();

try {
    if (!empty($data->studentId) && !empty($data->classId)) {
        // Check if student is enrolled in the class
        $check_query = "SELECT id FROM enrollments 
                       WHERE student_id = :student_id AND class_id = :class_id";
        $check_stmt = $db->prepare($check_query);
        $check_stmt->bindParam(":student_id", $data->studentId);
        $check_stmt->bindParam(":class_id", $data->classId);
        $check_stmt->execute();

        if ($check_stmt->rowCount() > 0) {
            // Check if already marked present today
            $today = date('Y-m-d');
            $duplicate_query = "SELECT id FROM attendance 
                               WHERE student_id = :student_id 
                               AND class_id = :class_id 
                               AND DATE(check_in_time) = :today";
            $duplicate_stmt = $db->prepare($duplicate_query);
            $duplicate_stmt->bindParam(":student_id", $data->studentId);
            $duplicate_stmt->bindParam(":class_id", $data->classId);
            $duplicate_stmt->bindParam(":today", $today);
            $duplicate_stmt->execute();

            if ($duplicate_stmt->rowCount() > 0) {
                http_response_code(400);
                $response['success'] = false;
                $response['message'] = "Attendance already marked for today";
            } else {
                // Mark attendance
                $query = "INSERT INTO attendance 
                         (student_id, class_id, check_in_time, status) 
                         VALUES 
                         (:student_id, :class_id, NOW(), 'present')";

                $stmt = $db->prepare($query);
                $stmt->bindParam(":student_id", $data->studentId);
                $stmt->bindParam(":class_id", $data->classId);

                if ($stmt->execute()) {
                    http_response_code(201);
                    $response['success'] = true;
                    $response['message'] = "Attendance marked successfully";
                    $response['attendance_id'] = $db->lastInsertId();
                } else {
                    http_response_code(500);
                    $response['success'] = false;
                    $response['message'] = "Unable to mark attendance";
                }
            }
        } else {
            http_response_code(404);
            $response['success'] = false;
            $response['message'] = "Student not enrolled in this class";
        }
    } else {
        http_response_code(400);
        $response['success'] = false;
        $response['message'] = "Student ID and Class ID are required";
    }
} catch (Exception $e) {
    http_response_code(500);
    $response['success'] = false;
    $response['message'] = "Server error: " . $e->getMessage();
}

echo json_encode($response);
?>

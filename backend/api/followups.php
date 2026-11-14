<?php
// =====================================================================
// Resident and Staff Follow-Up Communication API (Feature 7)
// =====================================================================

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../services/FileUploadService.php';

$db = Database::getConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $complaintId = (int)($_GET['complaint_id'] ?? 0);
    if ($complaintId <= 0) {
        sendResponse(false, null, 'Complaint ID is required.', 400);
    }

    $stmt = $db->prepare("SELECT id, complaint_id, sender_name, sender_role, message, attachment_path, created_at 
                          FROM complaint_followups WHERE complaint_id = :cid ORDER BY id ASC");
    $stmt->execute([':cid' => $complaintId]);
    $rows = $stmt->fetchAll();

    $followups = [];
    foreach ($rows as $r) {
        $followups[] = [
            'id'             => (string)$r['id'],
            'senderName'     => $r['sender_name'],
            'senderRole'     => $r['sender_role'],
            'message'        => $r['message'],
            'attachmentPath' => $r['attachment_path'],
            'date'           => date('Y-m-d h:i A', strtotime($r['created_at']))
        ];
    }

    sendResponse(true, $followups, 'Follow-up messages retrieved.');
}

if ($method === 'POST') {
    $isMultipart = !empty($_POST);
    $data = $isMultipart ? $_POST : getJsonInput();

    $complaintId = (int)($data['complaintId'] ?? 0);
    $senderName = trim($data['senderName'] ?? 'Resident');
    $senderRole = trim($data['senderRole'] ?? 'Resident');
    $senderId = !empty($data['senderId']) ? (int)$data['senderId'] : null;
    $message = trim($data['message'] ?? '');
    $attachmentPath = null;

    if ($complaintId <= 0 || empty($message)) {
        sendResponse(false, null, 'Complaint ID and message cannot be empty.', 400);
    }

    // Handle optional file attachment
    if (!empty($_FILES['attachment']) && $_FILES['attachment']['error'] === UPLOAD_ERR_OK) {
        try {
            $upResult = FileUploadService::upload($_FILES['attachment'], 'evidence');
            $attachmentPath = $upResult['file_path'];
        } catch (Exception $e) {
            // Log issue
        }
    }

    $cStmt = $db->prepare("SELECT reference_no, resident_id FROM complaints WHERE id = :id");
    $cStmt->execute([':id' => $complaintId]);
    $complaint = $cStmt->fetch();

    if (!$complaint) {
        sendResponse(false, null, 'Complaint not found.', 404);
    }

    $db->beginTransaction();
    try {
        $insStmt = $db->prepare("INSERT INTO complaint_followups (complaint_id, sender_id, sender_name, sender_role, message, attachment_path) 
                                 VALUES (:cid, :sid, :sname, :srole, :msg, :att)");
        $insStmt->execute([
            ':cid'   => $complaintId,
            ':sid'   => $senderId,
            ':sname' => $senderName,
            ':srole' => $senderRole,
            ':msg'   => $message,
            ':att'   => $attachmentPath
        ]);

        // Add timeline milestone for transparency
        $histStmt = $db->prepare("INSERT INTO complaint_status_history 
            (complaint_id, status, action_title, description, performed_by_name, performed_by_role)
            VALUES (:cid, 'In Progress', 'Follow-up Information Added', :desc, :pname, :prole)");
        $histStmt->execute([
            ':cid'   => $complaintId,
            ':desc'  => "{$senderRole} {$senderName}: {$message}",
            ':pname' => $senderName,
            ':prole' => $senderRole
        ]);

        // Push in-app notification to counter-party
        $targetRole = (strtolower($senderRole) === 'resident') ? 'staff' : 'resident';
        $notifStmt = $db->prepare("INSERT INTO notifications (user_id, target_role, title, message, reference_no, type) 
                                   VALUES (NULL, :trole, 'New Message on Complaint', :msg, :ref, 'followup')");
        $notifStmt->execute([
            ':trole' => $targetRole,
            ':msg'   => "{$complaint['reference_no']} - {$senderName}: {$message}",
            ':ref'   => $complaint['reference_no']
        ]);

        $db->commit();
        sendResponse(true, ['complaintId' => $complaintId], 'Follow-up message sent successfully.');
    } catch (Exception $e) {
        $db->rollBack();
        sendResponse(false, null, 'Error saving message: ' . $e->getMessage(), 500);
    }
}

sendResponse(false, null, 'Method not allowed.', 405);

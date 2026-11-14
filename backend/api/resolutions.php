<?php
// =====================================================================
// Resolutions and Resident Feedback Verification API (Feature 8)
// =====================================================================

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../services/FileUploadService.php';

$db = Database::getConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $action = $_GET['action'] ?? 'submit_resolution';

    // 1. Staff Submits Resolution (Proof of Work)
    if ($action === 'submit_resolution') {
        $isMultipart = !empty($_POST);
        $data = $isMultipart ? $_POST : getJsonInput();

        $complaintId = (int)($data['complaintId'] ?? 0);
        $summary = trim($data['summary'] ?? $data['actionTaken'] ?? $data['resolutionNotes'] ?? '');
        $resolvedBy = trim($data['resolvedBy'] ?? $data['staffName'] ?? 'Staff Officer');
        $evidenceUrl = $data['evidenceUrl'] ?? null;

        if ($complaintId <= 0 || empty($summary)) {
            sendResponse(false, null, 'Complaint ID and resolution summary are required.', 400);
        }

        // Handle uploaded photo evidence if provided
        if (!empty($_FILES['evidence']) && $_FILES['evidence']['error'] === UPLOAD_ERR_OK) {
            try {
                $upResult = FileUploadService::upload($_FILES['evidence'], 'resolutions');
                $evidenceUrl = $upResult['file_path'];
            } catch (Exception $e) {
                // Keep provided fallback URL or null
            }
        }

        $cStmt = $db->prepare("SELECT * FROM complaints WHERE id = :id");
        $cStmt->execute([':id' => $complaintId]);
        $complaint = $cStmt->fetch();

        if (!$complaint) {
            sendResponse(false, null, 'Complaint not found.', 404);
        }

        $db->beginTransaction();
        try {
            // Save or replace resolution
            $resStmt = $db->prepare("INSERT INTO complaint_resolutions (complaint_id, resolved_by, summary, evidence_url, resolved_at) 
                                      VALUES (:cid, :rby, :sum, :ev, NOW())
                                      ON DUPLICATE KEY UPDATE resolved_by = VALUES(resolved_by), summary = VALUES(summary), evidence_url = VALUES(evidence_url), resolved_at = NOW()");
            $resStmt->execute([
                ':cid' => $complaintId,
                ':rby' => $resolvedBy,
                ':sum' => $summary,
                ':ev'  => $evidenceUrl
            ]);

            // Change status to 'Resolution Submitted' (NEVER auto-close before verification!)
            $newStatus = 'Resolution Submitted';
            $upStmt = $db->prepare("UPDATE complaints SET status = :st WHERE id = :id");
            $upStmt->execute([':st' => $newStatus, ':id' => $complaintId]);

            // Append timeline milestone
            $histStmt = $db->prepare("INSERT INTO complaint_status_history 
                (complaint_id, status, action_title, description, performed_by_name, performed_by_role)
                VALUES (:cid, :st, 'Resolution Submitted by Staff', :desc, :pname, 'Staff')");
            $histStmt->execute([
                ':cid'   => $complaintId,
                ':st'    => $newStatus,
                ':desc'  => "Action taken: {$summary}. Awaiting resident review and verification.",
                ':pname' => $resolvedBy
            ]);

            // Push notification to resident
            $notifStmt = $db->prepare("INSERT INTO notifications (user_id, target_role, title, message, reference_no, type) 
                                       VALUES (:uid, 'resident', 'Resolution Submitted for Review', :msg, :ref, 'status')");
            $notifStmt->execute([
                ':uid' => $complaint['resident_id'],
                ':msg' => "{$complaint['reference_no']} - Staff submitted resolution details. Please review and verify.",
                ':ref' => $complaint['reference_no']
            ]);

            // Audit
            $auditStmt = $db->prepare("INSERT INTO audit_logs (user_name, user_role, action, module, entity_ref, old_value, new_value, ip_address) 
                                       VALUES (:name, 'Staff', 'Submitted Complaint Resolution', 'Resolution Module', :ref, :old, :new, :ip)");
            $auditStmt->execute([
                ':name' => $resolvedBy,
                ':ref'  => $complaint['reference_no'],
                ':old'  => $complaint['status'],
                ':new'  => $newStatus,
                ':ip'   => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'
            ]);

            $db->commit();
            sendResponse(true, ['complaintId' => $complaintId, 'status' => $newStatus], 'Resolution submitted for resident verification.');
        } catch (Exception $e) {
            $db->rollBack();
            sendResponse(false, null, 'Error submitting resolution: ' . $e->getMessage(), 500);
        }
    }

    // 2. Resident Reviews Resolution & Submits Feedback
    if ($action === 'submit_feedback' || $action === 'verify_resident') {
        $input = getJsonInput();
        $complaintId = (int)($input['complaintId'] ?? 0);
        $rawAction = strtolower($input['action'] ?? $input['actionStatus'] ?? 'accepted');
        $actionStatus = ($rawAction === 'accept' || $rawAction === 'accepted') ? 'Accepted' : 'Request Further Action';
        $rating = max(1, min(5, (int)($input['rating'] ?? 5)));
        $satisfaction = trim($input['satisfaction'] ?? $input['satisfactionLevel'] ?? 'Satisfied');
        $comments = trim($input['comments'] ?? $input['feedbackNotes'] ?? '');
        $residentName = trim($input['residentName'] ?? 'Resident');

        if ($complaintId <= 0) {
            sendResponse(false, null, 'Complaint ID is required.', 400);
        }

        $cStmt = $db->prepare("SELECT * FROM complaints WHERE id = :id");
        $cStmt->execute([':id' => $complaintId]);
        $complaint = $cStmt->fetch();

        if (!$complaint) {
            sendResponse(false, null, 'Complaint not found.', 404);
        }

        $db->beginTransaction();
        try {
            // Record resident feedback
            $fbStmt = $db->prepare("INSERT INTO resident_feedback (complaint_id, resident_id, action_status, rating, satisfaction_level, comments) 
                                    VALUES (:cid, :rid, :astatus, :rating, :sat, :comments)
                                    ON DUPLICATE KEY UPDATE action_status = VALUES(action_status), rating = VALUES(rating), satisfaction_level = VALUES(satisfaction_level), comments = VALUES(comments)");
            $fbStmt->execute([
                ':cid'     => $complaintId,
                ':rid'     => $complaint['resident_id'],
                ':astatus' => $actionStatus,
                ':rating'  => $rating,
                ':sat'     => $satisfaction,
                ':comments'=> $comments
            ]);

            // Lifecycle outcome:
            // If Accepted -> Status changes to 'Resolved' and ready for administrative 'Closed'
            // If Rejected (Request Further Action) -> Reopens to 'In Progress' with note
            $finalStatus = ($actionStatus === 'Accepted') ? 'Resolved' : 'In Progress';
            $upStmt = $db->prepare("UPDATE complaints SET status = :st WHERE id = :id");
            $upStmt->execute([':st' => $finalStatus, ':id' => $complaintId]);

            $timelineDesc = ($actionStatus === 'Accepted') 
                ? "Resident {$residentName} verified and accepted resolution with a {$rating}-star rating ({$satisfaction})."
                : "Resident {$residentName} requested further action: {$comments}";

            $histStmt = $db->prepare("INSERT INTO complaint_status_history 
                (complaint_id, status, action_title, description, performed_by_name, performed_by_role)
                VALUES (:cid, :st, :title, :desc, :pname, 'Resident')");
            $histStmt->execute([
                ':cid'   => $complaintId,
                ':st'    => $finalStatus,
                ':title' => ($actionStatus === 'Accepted') ? 'Resident Verified Resolution' : 'Resident Requested Further Action',
                ':desc'  => $timelineDesc,
                ':pname' => $residentName
            ]);

            // Notification to staff/admin
            $notifTitle = ($actionStatus === 'Accepted') ? 'Resolution Verified & Accepted' : 'Resolution Rejected - Reopened';
            $notifStmt = $db->prepare("INSERT INTO notifications (user_id, target_role, title, message, reference_no, type) 
                                       VALUES (NULL, 'staff', :title, :msg, :ref, 'status')");
            $notifStmt->execute([
                ':title' => $notifTitle,
                ':msg'   => "{$complaint['reference_no']} - {$timelineDesc}",
                ':ref'   => $complaint['reference_no']
            ]);

            // Audit
            $auditStmt = $db->prepare("INSERT INTO audit_logs (user_name, user_role, action, module, entity_ref, old_value, new_value, ip_address) 
                                       VALUES (:name, 'Resident', 'Submitted Resolution Feedback', 'Verification Module', :ref, :old, :new, :ip)");
            $auditStmt->execute([
                ':name' => $residentName,
                ':ref'  => $complaint['reference_no'],
                ':old'  => 'Resolution Submitted',
                ':new'  => $finalStatus,
                ':ip'   => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'
            ]);

            $db->commit();
            sendResponse(true, ['complaintId' => $complaintId, 'status' => $finalStatus], 'Feedback submitted successfully.');
        } catch (Exception $e) {
            $db->rollBack();
            sendResponse(false, null, 'Error submitting feedback: ' . $e->getMessage(), 500);
        }
    }
}

sendResponse(false, null, 'Invalid resolution endpoint.', 400);

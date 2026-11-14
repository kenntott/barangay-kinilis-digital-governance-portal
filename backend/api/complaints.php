<?php
// =====================================================================
// Complaints API (List, Create, Update Status, Override, Duplicate Check)
// =====================================================================

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../services/ClassificationEngine.php';
require_once __DIR__ . '/../services/FileUploadService.php';

$db = Database::getConnection();
$method = $_SERVER['REQUEST_METHOD'];

// Helper to fetch full complaint object with all relational children
function formatComplaint(array $c, PDO $db): array {
    $cid = (int)$c['id'];

    // 1. Fetch Timeline
    $timelineStmt = $db->prepare("SELECT status, action_title, description as desc_text, performed_by_name, created_at 
                                  FROM complaint_status_history WHERE complaint_id = :id ORDER BY id ASC");
    $timelineStmt->execute([':id' => $cid]);
    $timelineRows = $timelineStmt->fetchAll();
    $timeline = [];
    foreach ($timelineRows as $t) {
        $timeline[] = [
            'status' => $t['status'],
            'date'   => date('Y-m-d h:i A', strtotime($t['created_at'])),
            'desc'   => $t['desc_text'],
            'actor'  => $t['performed_by_name']
        ];
    }

    // 2. Fetch Evidence Attachments
    $evStmt = $db->prepare("SELECT file_name, file_path, file_size FROM complaint_evidence WHERE complaint_id = :id");
    $evStmt->execute([':id' => $cid]);
    $evRows = $evStmt->fetchAll();
    $attachments = [];
    foreach ($evRows as $e) {
        $attachments[] = [
            'name' => $e['file_name'],
            'url'  => $e['file_path'],
            'size' => $e['file_size'] ?? '1.2 MB'
        ];
    }

    // 3. Fetch Active Assignment
    $asStmt = $db->prepare("SELECT department_name, assigned_staff, routing_status, assigned_at 
                            FROM complaint_assignments WHERE complaint_id = :id AND is_active = 1 ORDER BY id DESC LIMIT 1");
    $asStmt->execute([':id' => $cid]);
    $asRow = $asStmt->fetch();
    $routing = [
        'department'    => $asRow['department_name'] ?? 'Barangay Administrative Office',
        'assignedStaff' => $asRow['assigned_staff'] ?? 'Department Desk Officer',
        'routingStatus' => $asRow['routing_status'] ?? 'Automatically Routed',
        'routedAt'      => $asRow['assigned_at'] ?? $c['submitted_at']
    ];

    // 4. Fetch AI Classification Log
    $aiStmt = $db->prepare("SELECT category, priority, suggested_department, confidence, reasoning, keywords, created_at 
                            FROM ai_classification_logs WHERE complaint_id = :id ORDER BY id DESC LIMIT 1");
    $aiStmt->execute([':id' => $cid]);
    $aiRow = $aiStmt->fetch();
    $aiResult = [
        'category'     => $aiRow['category'] ?? $c['category'],
        'priority'     => $aiRow['priority'] ?? $c['priority'],
        'department'   => $aiRow['suggested_department'] ?? $routing['department'],
        'confidence'   => (int)($aiRow['confidence'] ?? 90),
        'reason'       => $aiRow['reasoning'] ?? "Categorized based on {$c['category']} indicators.",
        'keywords'     => !empty($aiRow['keywords']) ? explode(',', $aiRow['keywords']) : [$c['category']],
        'classifiedAt' => $aiRow['created_at'] ?? $c['submitted_at']
    ];

    // 5. Fetch Resolution
    $resStmt = $db->prepare("SELECT resolved_by, summary, evidence_url, resolved_at FROM complaint_resolutions WHERE complaint_id = :id");
    $resStmt->execute([':id' => $cid]);
    $resRow = $resStmt->fetch();
    $resolution = null;
    if ($resRow) {
        $resolution = [
            'resolvedBy'  => $resRow['resolved_by'],
            'summary'     => $resRow['summary'],
            'evidenceUrl' => $resRow['evidence_url'],
            'resolvedAt'  => $resRow['resolved_at']
        ];
    }

    // 6. Fetch Feedback
    $fbStmt = $db->prepare("SELECT rating, satisfaction_level, comments, submitted_at FROM resident_feedback WHERE complaint_id = :id");
    $fbStmt->execute([':id' => $cid]);
    $fbRow = $fbStmt->fetch();
    $feedback = null;
    if ($fbRow) {
        $feedback = [
            'rating'       => (int)$fbRow['rating'],
            'satisfaction' => $fbRow['satisfaction_level'] ?? 'Satisfied',
            'comments'     => $fbRow['comments'] ?? '',
            'submittedAt'  => $fbRow['submitted_at']
        ];
    }

    // Calculate overdue status
    $isOverdue = false;
    if (!empty($c['target_resolution_date']) && !in_array($c['status'], ['Resolved', 'Closed', 'Rejected'])) {
        $isOverdue = (strtotime($c['target_resolution_date']) < time());
    }

    return [
        'id'                   => (string)$c['id'],
        'referenceNo'          => $c['reference_no'],
        'residentId'           => $c['resident_id'] ? (string)$c['resident_id'] : null,
        'title'                => $c['title'],
        'description'          => $c['description'],
        'category'             => $c['category'],
        'priority'             => $c['priority'],
        'status'               => $c['status'],
        'location'             => $c['location'],
        'incidentDate'         => $c['incident_date'] ?? date('Y-m-d', strtotime($c['submitted_at'])),
        'incidentTime'         => $c['incident_time'] ?? date('h:i A', strtotime($c['submitted_at'])),
        'residentName'         => $c['resident_name'],
        'residentEmail'        => $c['resident_email'],
        'residentPhone'        => $c['resident_phone'] ?? '',
        'preferredContact'     => $c['preferred_contact'] ?? 'Phone',
        'submittedAt'          => $c['submitted_at'],
        'targetResolutionDate' => $c['target_resolution_date'],
        'isOverdue'            => $isOverdue,
        'remarks'              => $c['remarks'] ?? '',
        'aiResult'             => $aiResult,
        'routing'              => $routing,
        'timeline'             => $timeline,
        'attachments'          => $attachments,
        'resolution'           => $resolution,
        'feedback'             => $feedback
    ];
}

// -------------------------------------------------------------
// GET: Fetch Complaints List or Duplicate Check
// -------------------------------------------------------------
if ($method === 'GET') {
    $action = $_GET['action'] ?? 'list';

    // Duplicate Check Action (Feature 3)
    if ($action === 'check_duplicates') {
        $title = $_GET['title'] ?? '';
        $desc = $_GET['description'] ?? '';
        $loc = $_GET['location'] ?? '';
        $cat = $_GET['category'] ?? '';
        $exclude = (int)($_GET['exclude_id'] ?? 0);

        $dupes = ClassificationEngine::checkDuplicates($title, $desc, $loc, $cat, $exclude);
        sendResponse(true, $dupes, 'Duplicate check completed.');
    }

    // Classify Preview Action (Feature 3)
    if ($action === 'classify_preview') {
        $title = $_GET['title'] ?? '';
        $desc = $_GET['description'] ?? '';
        $pref = $_GET['category_preference'] ?? '';

        $analysis = ClassificationEngine::classify($title, $desc, $pref);
        sendResponse(true, $analysis, 'Classification generated.');
    }

    // Default: List All Complaints with optional filters
    $sql = "SELECT c.* FROM complaints c WHERE 1=1";
    $params = [];

    if (!empty($_GET['resident_id'])) {
        $sql .= " AND c.resident_id = :resident_id";
        $params[':resident_id'] = (int)$_GET['resident_id'];
    }

    if (!empty($_GET['category']) && $_GET['category'] !== 'All') {
        $sql .= " AND c.category = :category";
        $params[':category'] = $_GET['category'];
    }

    if (!empty($_GET['status']) && $_GET['status'] !== 'All') {
        $sql .= " AND c.status = :status";
        $params[':status'] = $_GET['status'];
    }

    if (!empty($_GET['priority']) && $_GET['priority'] !== 'All') {
        $sql .= " AND c.priority = :priority";
        $params[':priority'] = $_GET['priority'];
    }

    if (!empty($_GET['search'])) {
        $sql .= " AND (c.reference_no LIKE :search OR c.title LIKE :search OR c.resident_name LIKE :search OR c.location LIKE :search)";
        $params[':search'] = '%' . $_GET['search'] . '%';
    }

    $sql .= " ORDER BY c.id DESC";

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    $results = [];
    foreach ($rows as $row) {
        $results[] = formatComplaint($row, $db);
    }

    sendResponse(true, $results, 'Complaints retrieved successfully.');
}

// -------------------------------------------------------------
// POST: Create New Complaint (Feature 1)
// -------------------------------------------------------------
if ($method === 'POST') {
    // Check if multipart form or JSON
    $isMultipart = !empty($_POST);
    $data = $isMultipart ? $_POST : getJsonInput();

    $title = trim($data['title'] ?? '');
    $description = trim($data['description'] ?? '');
    $categoryPref = trim($data['category'] ?? '');
    $location = trim($data['location'] ?? 'Brgy. Kinilis, Polomolok');
    $incidentDate = $data['incidentDate'] ?? date('Y-m-d');
    $incidentTime = $data['incidentTime'] ?? date('h:i A');
    $residentName = trim($data['residentName'] ?? $data['name'] ?? 'Juan dela Cruz');
    $residentEmail = trim($data['residentEmail'] ?? $data['email'] ?? 'juan.delacruz@kinilis.gov.ph');
    $residentPhone = trim($data['residentPhone'] ?? $data['phone'] ?? '');
    $preferredContact = $data['preferredContact'] ?? 'Phone';
    $residentId = !empty($data['residentId']) ? (int)$data['residentId'] : null;

    if (empty($title) || empty($description)) {
        sendResponse(false, null, 'Complaint title and description are required.', 400);
    }

    // Feature 3: Smart Classification
    $analysis = ClassificationEngine::classify($title, $description, $categoryPref);
    $category = $analysis['category'];
    $priority = $analysis['priority'];
    $department = $analysis['department'];
    $assignedStaff = $analysis['assigned_staff'];

    // Feature 2: Generate Unique Reference Number KIN-YYYY-XXXXXX
    $year = date('Y');
    $countStmt = $db->query("SELECT MAX(id) as max_id FROM complaints");
    $maxRow = $countStmt->fetch();
    $nextSeq = (int)($maxRow['max_id'] ?? 0) + 101;
    $referenceNo = sprintf('KIN-%s-%06d', $year, $nextSeq);

    // Feature 6: Calculate Response Deadline (SLA Target Hours)
    $slaHours = ($priority === 'Urgent') ? 24 : (($priority === 'High') ? 48 : 72);
    $targetResolutionDate = date('Y-m-d H:i:s', strtotime("+{$slaHours} hours"));

    // Begin DB Transaction
    $db->beginTransaction();
    try {
        // Insert Complaint
        $insStmt = $db->prepare("INSERT INTO complaints 
            (reference_no, resident_id, title, description, category, priority, status, location, incident_date, incident_time, 
             resident_name, resident_email, resident_phone, preferred_contact, target_resolution_date)
            VALUES 
            (:ref, :resid, :title, :desc, :cat, :prio, 'Submitted', :loc, :idate, :itime, :rname, :remail, :rphone, :pref, :target)");
        $insStmt->execute([
            ':ref'    => $referenceNo,
            ':resid'  => $residentId,
            ':title'  => $title,
            ':desc'   => $description,
            ':cat'    => $category,
            ':prio'   => $priority,
            ':loc'    => $location,
            ':idate'  => $incidentDate,
            ':itime'  => $incidentTime,
            ':rname'  => $residentName,
            ':remail' => $residentEmail,
            ':rphone' => $residentPhone,
            ':pref'   => $preferredContact,
            ':target' => $targetResolutionDate
        ]);
        $complaintId = (int)$db->lastInsertId();

        // Feature 2: Initial Status History
        $histStmt = $db->prepare("INSERT INTO complaint_status_history 
            (complaint_id, status, action_title, description, performed_by_name, performed_by_role)
            VALUES 
            (:cid, 'Submitted', 'Complaint Submitted', :desc, :pname, 'Resident')");
        $histStmt->execute([
            ':cid'   => $complaintId,
            ':desc'  => "Complaint registered online by {$residentName}.",
            ':pname' => $residentName
        ]);

        // Feature 3: AI Classification Log
        $aiLogStmt = $db->prepare("INSERT INTO ai_classification_logs 
            (complaint_id, category, priority, suggested_department, confidence, reasoning, keywords)
            VALUES 
            (:cid, :cat, :prio, :dept, :conf, :reason, :kw)");
        $aiLogStmt->execute([
            ':cid'    => $complaintId,
            ':cat'    => $category,
            ':prio'   => $priority,
            ':dept'   => $department,
            ':conf'   => $analysis['confidence'],
            ':reason' => $analysis['reasoning'],
            ':kw'     => implode(',', $analysis['keywords'])
        ]);

        // Feature 5: Initial Department Routing & Assignment
        $asStmt = $db->prepare("INSERT INTO complaint_assignments 
            (complaint_id, department_name, assigned_staff, assigned_by_name, routing_status, notes)
            VALUES 
            (:cid, :dept, :staff, 'Classification Engine', 'Automatically Routed', :notes)");
        $asStmt->execute([
            ':cid'   => $complaintId,
            ':dept'  => $department,
            ':staff' => $assignedStaff,
            ':notes' => "Auto-routed based on {$category} indicators."
        ]);

        // Second timeline step for AI Routing
        $histStmt2 = $db->prepare("INSERT INTO complaint_status_history 
            (complaint_id, status, action_title, description, performed_by_name, performed_by_role)
            VALUES 
            (:cid, 'Under Review', 'AI Classified & Routed', :desc, 'System AI', 'System')");
        $histStmt2->execute([
            ':cid'  => $complaintId,
            ':desc' => "Automatically classified as {$category} ({$analysis['confidence']}% confidence) and routed to {$department}."
        ]);

        // Feature 1: Handle Photo Uploads
        if (!empty($_FILES['evidence'])) {
            $files = $_FILES['evidence'];
            // Normalize single or multiple files
            $isMulti = is_array($files['name']);
            $count = $isMulti ? count($files['name']) : 1;

            for ($i = 0; $i < $count; $i++) {
                $singleFile = [
                    'name'     => $isMulti ? $files['name'][$i] : $files['name'],
                    'type'     => $isMulti ? $files['type'][$i] : $files['type'],
                    'tmp_name' => $isMulti ? $files['tmp_name'][$i] : $files['tmp_name'],
                    'error'    => $isMulti ? $files['error'][$i] : $files['error'],
                    'size'     => $isMulti ? $files['size'][$i] : $files['size']
                ];

                if (!empty($singleFile['name']) && $singleFile['error'] === UPLOAD_ERR_OK) {
                    try {
                        $upResult = FileUploadService::upload($singleFile, 'evidence');
                        $evStmt = $db->prepare("INSERT INTO complaint_evidence 
                            (complaint_id, file_name, file_path, file_size, file_type, uploaded_by)
                            VALUES (:cid, :fname, :fpath, :fsize, :ftype, :upby)");
                        $evStmt->execute([
                            ':cid'   => $complaintId,
                            ':fname' => $upResult['original_name'],
                            ':fpath' => $upResult['file_path'],
                            ':fsize' => $upResult['file_size'],
                            ':ftype' => $upResult['file_type'],
                            ':upby'  => $residentName
                        ]);
                    } catch (Exception $e) {
                        // Log upload issue but don't abort overall complaint
                        error_log("Upload failed: " . $e->getMessage());
                    }
                }
            }
        }

        // Feature 7: Automated Notifications
        $notifStmt = $db->prepare("INSERT INTO notifications (user_id, target_role, title, message, reference_no, type) 
                                   VALUES (NULL, 'all', 'New complaint submitted', :msg, :ref, 'submission')");
        $notifStmt->execute([
            ':msg' => "{$referenceNo} - {$title}",
            ':ref' => $referenceNo
        ]);

        if ($priority === 'Urgent') {
            $urgentNotif = $db->prepare("INSERT INTO notifications (user_id, target_role, title, message, reference_no, type) 
                                         VALUES (NULL, 'admin', 'Urgent complaint alert', :msg, :ref, 'urgent')");
            $urgentNotif->execute([
                ':msg' => "{$referenceNo} - High alert reported at {$location}",
                ':ref' => $referenceNo
            ]);
        }

        // Feature 9: Audit Trail
        $auditStmt = $db->prepare("INSERT INTO audit_logs (user_name, user_role, action, module, entity_ref, old_value, new_value, ip_address) 
                                   VALUES (:name, 'Resident', 'Registered New Complaint', 'Submission Module', :ref, 'None', :val, :ip)");
        $auditStmt->execute([
            ':name' => $residentName,
            ':ref'  => $referenceNo,
            ':val'  => "{$category} -> {$department}",
            ':ip'   => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'
        ]);

        $db->commit();

        // Fetch complete saved complaint to return
        $fetchStmt = $db->prepare("SELECT * FROM complaints WHERE id = :id");
        $fetchStmt->execute([':id' => $complaintId]);
        $savedComplaint = formatComplaint($fetchStmt->fetch(), $db);

        sendResponse(true, $savedComplaint, "Complaint {$referenceNo} successfully registered.", 201);
    } catch (Exception $e) {
        $db->rollBack();
        sendResponse(false, null, 'Error submitting complaint: ' . $e->getMessage(), 500);
    }
}

// -------------------------------------------------------------
// PUT: Update Status, Acknowledge, Reassign, Override
// -------------------------------------------------------------
if ($method === 'PUT') {
    $input = getJsonInput();
    $action = $_GET['action'] ?? 'update_status';
    $complaintId = (int)($input['complaintId'] ?? $input['id'] ?? 0);

    if ($complaintId <= 0) {
        sendResponse(false, null, 'Complaint ID is required.', 400);
    }

    $cStmt = $db->prepare("SELECT * FROM complaints WHERE id = :id");
    $cStmt->execute([':id' => $complaintId]);
    $complaint = $cStmt->fetch();

    if (!$complaint) {
        sendResponse(false, null, 'Complaint not found.', 404);
    }

    $actorName = $input['userName'] ?? $input['actor'] ?? 'Staff Officer';
    $actorRole = $input['userRole'] ?? 'Staff';

    // 1. Update Status & Add Milestone
    if ($action === 'update_status') {
        $newStatus = trim($input['status'] ?? '');
        $remarks = trim($input['remarks'] ?? $input['description'] ?? '');

        if (empty($newStatus)) {
            sendResponse(false, null, 'New status is required.', 400);
        }

        $oldStatus = $complaint['status'];

        $db->beginTransaction();
        try {
            $upStmt = $db->prepare("UPDATE complaints SET status = :st, remarks = :rem WHERE id = :id");
            $upStmt->execute([':st' => $newStatus, ':rem' => $remarks, ':id' => $complaintId]);

            $histStmt = $db->prepare("INSERT INTO complaint_status_history 
                (complaint_id, status, action_title, description, performed_by_name, performed_by_role)
                VALUES (:cid, :st, :title, :desc, :pname, :prole)");
            $histStmt->execute([
                ':cid'   => $complaintId,
                ':st'    => $newStatus,
                ':title' => "Status Updated to {$newStatus}",
                ':desc'  => !empty($remarks) ? $remarks : "Status changed from {$oldStatus} to {$newStatus}.",
                ':pname' => $actorName,
                ':prole' => $actorRole
            ]);

            // Notification to Resident
            $notifStmt = $db->prepare("INSERT INTO notifications (user_id, target_role, title, message, reference_no, type) 
                                       VALUES (:uid, 'resident', :title, :msg, :ref, 'status')");
            $notifStmt->execute([
                ':uid'   => $complaint['resident_id'],
                ':title' => "Status updated to {$newStatus}",
                ':msg'   => "{$complaint['reference_no']} status updated by {$actorName}",
                ':ref'   => $complaint['reference_no']
            ]);

            // Audit
            $auditStmt = $db->prepare("INSERT INTO audit_logs (user_name, user_role, action, module, entity_ref, old_value, new_value, ip_address) 
                                       VALUES (:name, :role, 'Updated Complaint Status', 'Workflow Engine', :ref, :old, :new, :ip)");
            $auditStmt->execute([
                ':name' => $actorName,
                ':role' => $actorRole,
                ':ref'  => $complaint['reference_no'],
                ':old'  => $oldStatus,
                ':new'  => $newStatus,
                ':ip'   => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'
            ]);

            $db->commit();

            $cStmt->execute([':id' => $complaintId]);
            sendResponse(true, formatComplaint($cStmt->fetch(), $db), "Status updated to {$newStatus}.");
        } catch (Exception $e) {
            $db->rollBack();
            sendResponse(false, null, 'Error updating status: ' . $e->getMessage(), 500);
        }
    }

    // 2. Reassign Department & Officer (Feature 5)
    if ($action === 'reassign') {
        $department = trim($input['department'] ?? '');
        $officer = trim($input['assignedStaff'] ?? $input['officer'] ?? 'Unassigned');
        $notes = trim($input['notes'] ?? 'Administrative reassignment');

        if (empty($department)) {
            sendResponse(false, null, 'Target department is required.', 400);
        }

        $db->beginTransaction();
        try {
            // Deactivate previous active assignments
            $db->prepare("UPDATE complaint_assignments SET is_active = 0 WHERE complaint_id = :cid")
               ->execute([':cid' => $complaintId]);

            // Insert new active assignment
            $asStmt = $db->prepare("INSERT INTO complaint_assignments 
                (complaint_id, department_name, assigned_staff, assigned_by_name, routing_status, notes)
                VALUES (:cid, :dept, :staff, :by, 'Manually Reassigned', :notes)");
            $asStmt->execute([
                ':cid'   => $complaintId,
                ':dept'  => $department,
                ':staff' => $officer,
                ':by'    => $actorName,
                ':notes' => $notes
            ]);

            // Status timeline record
            $histStmt = $db->prepare("INSERT INTO complaint_status_history 
                (complaint_id, status, action_title, description, performed_by_name, performed_by_role)
                VALUES (:cid, 'Assigned', 'Department Reassignment', :desc, :pname, :prole)");
            $histStmt->execute([
                ':cid'   => $complaintId,
                ':desc'  => "Reassigned to {$department} under officer {$officer}. Reason: {$notes}",
                ':pname' => $actorName,
                ':prole' => $actorRole
            ]);

            // Audit
            $auditStmt = $db->prepare("INSERT INTO audit_logs (user_name, user_role, action, module, entity_ref, old_value, new_value, ip_address) 
                                       VALUES (:name, :role, 'Reassigned Department', 'Assignment Module', :ref, 'Reassigned', :new, :ip)");
            $auditStmt->execute([
                ':name' => $actorName,
                ':role' => $actorRole,
                ':ref'  => $complaint['reference_no'],
                ':new'  => "{$department} -> {$officer}",
                ':ip'   => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'
            ]);

            $db->commit();

            $cStmt->execute([':id' => $complaintId]);
            sendResponse(true, formatComplaint($cStmt->fetch(), $db), "Complaint reassigned to {$department}.");
        } catch (Exception $e) {
            $db->rollBack();
            sendResponse(false, null, 'Error reassigning complaint: ' . $e->getMessage(), 500);
        }
    }

    // 3. AI Classification Manual Override (Feature 3)
    if ($action === 'override_ai') {
        $category = trim($input['category'] ?? '');
        $department = trim($input['department'] ?? '');
        $priority = trim($input['priority'] ?? 'Medium');
        $reason = trim($input['reason'] ?? $input['overrideReason'] ?? '');

        if (empty($category) || empty($department) || empty($reason)) {
            sendResponse(false, null, 'Category, department, and justification reason are required for override.', 400);
        }

        $db->beginTransaction();
        try {
            // Update complaint record
            $upStmt = $db->prepare("UPDATE complaints SET category = :cat, priority = :prio WHERE id = :id");
            $upStmt->execute([':cat' => $category, ':prio' => $priority, ':id' => $complaintId]);

            // Update assignment
            $db->prepare("UPDATE complaint_assignments SET is_active = 0 WHERE complaint_id = :cid")
               ->execute([':cid' => $complaintId]);

            $asStmt = $db->prepare("INSERT INTO complaint_assignments 
                (complaint_id, department_name, assigned_staff, assigned_by_name, routing_status, notes)
                VALUES (:cid, :dept, 'Department Desk Officer', :by, 'Staff Override', :notes)");
            $asStmt->execute([
                ':cid'   => $complaintId,
                ':dept'  => $department,
                ':by'    => $actorName,
                ':notes' => "AI Override: {$reason}"
            ]);

            // Update AI log
            $aiStmt = $db->prepare("UPDATE ai_classification_logs 
                SET was_overridden = 1, override_reason = :reason, overridden_by = :by 
                WHERE complaint_id = :cid");
            $aiStmt->execute([':reason' => $reason, ':by' => $actorName, ':cid' => $complaintId]);

            // Add timeline entry
            $histStmt = $db->prepare("INSERT INTO complaint_status_history 
                (complaint_id, status, action_title, description, performed_by_name, performed_by_role)
                VALUES (:cid, 'Under Review', 'AI Classification Override', :desc, :pname, :prole)");
            $histStmt->execute([
                ':cid'   => $complaintId,
                ':desc'  => "Manual override applied: Set to {$category} ({$department}, Priority: {$priority}). Reason: {$reason}",
                ':pname' => $actorName,
                ':prole' => $actorRole
            ]);

            // Audit
            $auditStmt = $db->prepare("INSERT INTO audit_logs (user_name, user_role, action, module, entity_ref, old_value, new_value, ip_address) 
                                       VALUES (:name, :role, 'AI Classification Overridden', 'Classification Engine', :ref, :old, :new, :ip)");
            $auditStmt->execute([
                ':name' => $actorName,
                ':role' => $actorRole,
                ':ref'  => $complaint['reference_no'],
                ':old'  => "AI Suggested: {$complaint['category']}",
                ':new'  => "Overridden to: {$category} ({$reason})",
                ':ip'   => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'
            ]);

            $db->commit();

            $cStmt->execute([':id' => $complaintId]);
            sendResponse(true, formatComplaint($cStmt->fetch(), $db), "AI classification override recorded successfully.");
        } catch (Exception $e) {
            $db->rollBack();
            sendResponse(false, null, 'Error overriding classification: ' . $e->getMessage(), 500);
        }
    }
}

sendResponse(false, null, 'Invalid request method.', 405);

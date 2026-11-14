<?php
// =====================================================================
// Departments & Routing Rules API (Feature 5)
// =====================================================================

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';

$db = Database::getConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $action = $_GET['action'] ?? 'all';

    // 1. Fetch Departments with dynamically aggregated stats
    $deptStmt = $db->query("
        SELECT d.*, 
            COUNT(CASE WHEN c.status NOT IN ('Resolved', 'Closed', 'Rejected') THEN 1 END) as active_count,
            COUNT(CASE WHEN c.status IN ('Resolved', 'Closed') THEN 1 END) as resolved_count
        FROM departments d
        LEFT JOIN complaint_assignments ca ON d.name = ca.department_name AND ca.is_active = 1
        LEFT JOIN complaints c ON ca.complaint_id = c.id
        GROUP BY d.id
        ORDER BY d.id ASC
    ");
    $depts = $deptStmt->fetchAll();

    $formattedDepts = [];
    foreach ($depts as $d) {
        $formattedDepts[] = [
            'id'                 => (string)$d['id'],
            'name'               => $d['name'],
            'description'        => $d['description'] ?? '',
            'head'               => $d['head_officer'] ?? 'Unassigned',
            'staffCount'         => (int)($d['staff_count'] ?? 5),
            'slaHours'           => (int)($d['sla_hours'] ?? 72),
            'activeComplaints'   => (int)($d['active_count'] ?? 0),
            'resolvedComplaints' => (int)($d['resolved_count'] ?? 0),
            'status'             => $d['status'] ?? 'Active'
        ];
    }

    // 2. Fetch Routing Rules
    $ruleStmt = $db->query("SELECT * FROM complaint_routing_rules ORDER BY id ASC");
    $rules = $ruleStmt->fetchAll();
    $formattedRules = [];
    foreach ($rules as $r) {
        $formattedRules[] = [
            'id'              => (string)$r['id'],
            'category'        => $r['category'],
            'department'      => $r['department'],
            'defaultPriority' => $r['default_priority'],
            'keywords'        => array_map('trim', explode(',', $r['keywords'])),
            'assignedStaff'   => $r['assigned_staff'] ?? 'Department Desk Officer'
        ];
    }

    // 3. Fetch Staff List
    $staffStmt = $db->query("
        SELECT u.id, u.full_name, u.role, u.department, u.position, u.email, u.phone, u.status,
               COUNT(ca.id) as assigned_count
        FROM users u
        LEFT JOIN complaint_assignments ca ON u.full_name = ca.assigned_staff AND ca.is_active = 1
        WHERE u.role IN ('staff', 'admin')
        GROUP BY u.id
        ORDER BY u.id ASC
    ");
    $staffRows = $staffStmt->fetchAll();
    $formattedStaff = [];
    foreach ($staffRows as $s) {
        $formattedStaff[] = [
            'id'            => (string)$s['id'],
            'name'          => $s['full_name'],
            'role'          => ucfirst($s['role']),
            'department'    => $s['department'] ?? 'Barangay Administrative Office',
            'position'      => $s['position'] ?? 'Officer',
            'email'         => $s['email'],
            'phone'         => $s['phone'] ?? '',
            'status'        => $s['status'] ?? 'Active',
            'assignedCount' => (int)($s['assigned_count'] ?? 0)
        ];
    }

    sendResponse(true, [
        'departments'  => $formattedDepts,
        'routingRules' => $formattedRules,
        'staffList'    => $formattedStaff
    ], 'Department and staff records retrieved.');
}

if ($method === 'POST') {
    $action = $_GET['action'] ?? 'add_department';
    $input = getJsonInput();

    if ($action === 'add_department') {
        $name = trim($input['name'] ?? '');
        $description = trim($input['description'] ?? '');
        $head = trim($input['head'] ?? 'Unassigned');
        $staffCount = (int)($input['staffCount'] ?? 5);
        $slaHours = (int)($input['slaHours'] ?? 72);

        if (empty($name)) {
            sendResponse(false, null, 'Department name is required.', 400);
        }

        $insStmt = $db->prepare("INSERT INTO departments (name, description, head_officer, staff_count, sla_hours, status) 
                                 VALUES (:name, :desc, :head, :count, :sla, 'Active')");
        $insStmt->execute([
            ':name'  => $name,
            ':desc'  => $description,
            ':head'  => $head,
            ':count' => $staffCount,
            ':sla'   => $slaHours
        ]);

        sendResponse(true, ['id' => $db->lastInsertId(), 'name' => $name], 'Department created successfully.', 201);
    }

    if ($action === 'update_routing_rule') {
        $category = trim($input['category'] ?? '');
        $department = trim($input['department'] ?? '');
        $priority = trim($input['defaultPriority'] ?? 'Medium');
        $keywords = is_array($input['keywords'] ?? '') ? implode(',', $input['keywords']) : trim($input['keywords'] ?? '');
        $staff = trim($input['assignedStaff'] ?? 'Department Desk Officer');

        if (empty($category) || empty($department)) {
            sendResponse(false, null, 'Category and department are required.', 400);
        }

        $upStmt = $db->prepare("INSERT INTO complaint_routing_rules (category, department, default_priority, keywords, assigned_staff) 
                                VALUES (:cat, :dept, :prio, :kw, :staff)
                                ON DUPLICATE KEY UPDATE department = VALUES(department), default_priority = VALUES(default_priority), keywords = VALUES(keywords), assigned_staff = VALUES(assigned_staff)");
        $upStmt->execute([
            ':cat'   => $category,
            ':dept'  => $department,
            ':prio'  => $priority,
            ':kw'    => $keywords,
            ':staff' => $staff
        ]);

        sendResponse(true, null, "Routing rule for {$category} updated.");
    }
}

sendResponse(false, null, 'Method not allowed.', 405);

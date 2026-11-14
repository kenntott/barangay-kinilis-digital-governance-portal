<?php
// =====================================================================
// System Audit Trail API (Feature 9)
// =====================================================================

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';

$db = Database::getConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $sql = "SELECT * FROM audit_logs WHERE 1=1";
    $params = [];

    if (!empty($_GET['module']) && $_GET['module'] !== 'All') {
        $sql .= " AND module = :module";
        $params[':module'] = $_GET['module'];
    }

    if (!empty($_GET['search'])) {
        $sql .= " AND (entity_ref LIKE :search OR user_name LIKE :search OR action LIKE :search)";
        $params[':search'] = '%' . $_GET['search'] . '%';
    }

    $sql .= " ORDER BY id DESC LIMIT 100";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    $logs = [];
    foreach ($rows as $r) {
        $logs[] = [
            'id'        => (string)$r['id'],
            'user'      => $r['user_name'],
            'userRole'  => $r['user_role'] ?? 'Staff',
            'action'    => $r['action'],
            'module'    => $r['module'],
            'entity'    => $r['entity_ref'],
            'oldValue'  => $r['old_value'] ?? 'N/A',
            'newValue'  => $r['new_value'] ?? 'N/A',
            'timestamp' => date('M d, Y h:i A', strtotime($r['created_at']))
        ];
    }

    sendResponse(true, $logs, 'Audit logs retrieved.');
}

sendResponse(false, null, 'Method not allowed.', 405);

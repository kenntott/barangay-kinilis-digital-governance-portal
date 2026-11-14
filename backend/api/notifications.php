<?php
// =====================================================================
// In-App Notifications API (Feature 7)
// =====================================================================

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';

$db = Database::getConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $role = $_GET['role'] ?? 'all';
    $userId = !empty($_GET['user_id']) ? (int)$_GET['user_id'] : null;

    $sql = "SELECT * FROM notifications 
            WHERE target_role = 'all' OR target_role = :role";
    $params = [':role' => $role];

    if ($userId !== null) {
        $sql .= " OR user_id = :uid";
        $params[':uid'] = $userId;
    }

    $sql .= " ORDER BY id DESC LIMIT 40";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    $notifs = [];
    foreach ($rows as $r) {
        $notifs[] = [
            'id'          => (string)$r['id'],
            'title'       => $r['title'],
            'message'     => $r['message'],
            'referenceNo' => $r['reference_no'],
            'type'        => $r['type'],
            'targetRole'  => $r['target_role'],
            'read'        => (bool)$r['is_read'],
            'timestamp'   => date('Y-m-d h:i A', strtotime($r['created_at']))
        ];
    }

    sendResponse(true, $notifs, 'Notifications retrieved.');
}

if ($method === 'POST') {
    $action = $_GET['action'] ?? 'mark_read';
    $input = getJsonInput();

    if ($action === 'mark_read') {
        $id = (int)($input['id'] ?? 0);
        if ($id > 0) {
            $stmt = $db->prepare("UPDATE notifications SET is_read = 1 WHERE id = :id");
            $stmt->execute([':id' => $id]);
        }
        sendResponse(true, null, 'Marked as read.');
    }

    if ($action === 'mark_all_read') {
        $role = $input['role'] ?? 'all';
        $stmt = $db->prepare("UPDATE notifications SET is_read = 1 WHERE target_role = 'all' OR target_role = :role");
        $stmt->execute([':role' => $role]);
        sendResponse(true, null, 'All marked as read.');
    }
}

sendResponse(false, null, 'Method not allowed.', 405);

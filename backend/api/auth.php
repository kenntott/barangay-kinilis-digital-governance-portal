<?php
// =====================================================================
// Authentication API (Login, Register, Role Switch, Session)
// =====================================================================

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';

$db = Database::getConnection();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'current';

if ($method === 'POST') {
    $input = getJsonInput();

    if ($action === 'login') {
        $email = trim($input['email'] ?? '');
        $password = trim($input['password'] ?? '');

        if (empty($email) || empty($password)) {
            sendResponse(false, null, 'Email and password are required.', 400);
        }

        $stmt = $db->prepare("SELECT * FROM users WHERE email = :email AND status = 'Active' LIMIT 1");
        $stmt->execute([':email' => $email]);
        $user = $stmt->fetch();

        // For demo convenience, allow 'password123' or password_verify
        if ($user && ($password === 'password123' || password_verify($password, $user['password']))) {
            unset($user['password']);
            
            // Log audit
            $auditStmt = $db->prepare("INSERT INTO audit_logs (user_name, user_role, action, module, entity_ref, ip_address) 
                                       VALUES (:name, :role, 'User Signed In', 'Auth Module', :email, :ip)");
            $auditStmt->execute([
                ':name'  => $user['full_name'],
                ':role'  => $user['role'],
                ':email' => $user['email'],
                ':ip'    => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'
            ]);

            sendResponse(true, [
                'user' => [
                    'id'         => (string)$user['id'],
                    'name'       => $user['full_name'],
                    'email'      => $user['email'],
                    'role'       => $user['role'],
                    'contact'    => $user['phone'] ?? '',
                    'purok'      => $user['purok'] ?? 'Purok 3, Brgy. Kinilis, Polomolok',
                    'avatar'     => $user['avatar_url'] ?? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
                    'department' => $user['department'] ?? '',
                    'position'   => $user['position'] ?? ''
                ]
            ], 'Login successful.');
        } else {
            sendResponse(false, null, 'Invalid email or password.', 401);
        }
    }

    if ($action === 'switch_role') {
        $role = $input['role'] ?? 'resident';
        $stmt = $db->prepare("SELECT * FROM users WHERE role = :role AND status = 'Active' ORDER BY id ASC LIMIT 1");
        $stmt->execute([':role' => $role]);
        $user = $stmt->fetch();

        if ($user) {
            unset($user['password']);
            sendResponse(true, [
                'user' => [
                    'id'         => (string)$user['id'],
                    'name'       => $user['full_name'],
                    'email'      => $user['email'],
                    'role'       => $user['role'],
                    'contact'    => $user['phone'] ?? '',
                    'purok'      => $user['purok'] ?? 'Purok 3, Brgy. Kinilis, Polomolok',
                    'avatar'     => $user['avatar_url'] ?? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
                    'department' => $user['department'] ?? '',
                    'position'   => $user['position'] ?? ''
                ]
            ], 'Switched to ' . ucfirst($role) . ' role.');
        } else {
            sendResponse(false, null, 'No user found with role ' . $role, 404);
        }
    }

    if ($action === 'register') {
        $fullName = trim($input['name'] ?? $input['full_name'] ?? '');
        $email = trim($input['email'] ?? '');
        $password = trim($input['password'] ?? 'password123');
        $phone = trim($input['phone'] ?? '');
        $purok = trim($input['purok'] ?? 'Purok 3, Brgy. Kinilis, Polomolok');

        if (empty($fullName) || empty($email)) {
            sendResponse(false, null, 'Full name and email are required.', 400);
        }

        // Check duplicate email
        $checkStmt = $db->prepare("SELECT id FROM users WHERE email = :email");
        $checkStmt->execute([':email' => $email]);
        if ($checkStmt->fetch()) {
            sendResponse(false, null, 'An account with this email already exists.', 409);
        }

        $hash = password_hash($password, PASSWORD_BCRYPT);
        $avatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

        $insertStmt = $db->prepare("INSERT INTO users (full_name, email, password, role, phone, purok, avatar_url) 
                                    VALUES (:name, :email, :pass, 'resident', :phone, :purok, :avatar)");
        $insertStmt->execute([
            ':name'   => $fullName,
            ':email'  => $email,
            ':pass'   => $hash,
            ':phone'  => $phone,
            ':purok'  => $purok,
            ':avatar' => $avatar
        ]);
        $newId = (int)$db->lastInsertId();

        sendResponse(true, [
            'user' => [
                'id'         => (string)$newId,
                'name'       => $fullName,
                'email'      => $email,
                'role'       => 'resident',
                'contact'    => $phone,
                'purok'      => $purok,
                'avatar'     => $avatar,
                'department' => '',
                'position'   => ''
            ]
        ], 'Registration successful. Welcome to Barangay Kinilis!', 201);
    }
}

sendResponse(false, null, 'Invalid authentication request endpoint.', 400);

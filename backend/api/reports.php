<?php
// =====================================================================
// Analytics, Operational Deadlines, and Reports API (Features 6 & 9)
// =====================================================================

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';

$db = Database::getConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // 1. Overall Counts
    $statsStmt = $db->query("
        SELECT 
            COUNT(id) as total_received,
            COUNT(CASE WHEN status = 'Submitted' THEN 1 END) as submitted_count,
            COUNT(CASE WHEN status IN ('Submitted', 'Under Review', 'Acknowledged') THEN 1 END) as pending_count,
            COUNT(CASE WHEN status IN ('In Progress', 'Under Investigation', 'Assigned', 'Resolution Submitted') THEN 1 END) as in_progress_count,
            COUNT(CASE WHEN status = 'Resolved' THEN 1 END) as resolved_count,
            COUNT(CASE WHEN status = 'Closed' THEN 1 END) as closed_count,
            COUNT(CASE WHEN target_resolution_date < NOW() AND status NOT IN ('Resolved', 'Closed', 'Rejected') THEN 1 END) as overdue_count
        FROM complaints
    ");
    $stats = $statsStmt->fetch();

    // 2. Complaints by Category
    $catStmt = $db->query("SELECT category, COUNT(id) as count FROM complaints GROUP BY category ORDER BY count DESC");
    $categories = $catStmt->fetchAll();

    // 3. Complaints by Priority
    $prioStmt = $db->query("SELECT priority, COUNT(id) as count FROM complaints GROUP BY priority ORDER BY FIELD(priority, 'Urgent', 'High', 'Medium', 'Low')");
    $priorities = $prioStmt->fetchAll();

    // 4. Complaints by Department
    $deptStmt = $db->query("
        SELECT ca.department_name as department, COUNT(c.id) as count
        FROM complaints c
        JOIN complaint_assignments ca ON c.id = ca.complaint_id AND ca.is_active = 1
        GROUP BY ca.department_name
        ORDER BY count DESC
    ");
    $departments = $deptStmt->fetchAll();

    // 5. Officer Accountability Metrics (Feature 6)
    $officerStmt = $db->query("
        SELECT 
            ca.assigned_staff as officer_name,
            ca.department_name,
            COUNT(c.id) as total_assigned,
            COUNT(CASE WHEN c.status IN ('Submitted', 'Assigned', 'Acknowledged') THEN 1 END) as pending,
            COUNT(CASE WHEN c.status IN ('In Progress', 'Under Investigation', 'Resolution Submitted') THEN 1 END) as in_progress,
            COUNT(CASE WHEN c.status IN ('Resolved', 'Closed') THEN 1 END) as resolved,
            COUNT(CASE WHEN c.target_resolution_date < NOW() AND c.status NOT IN ('Resolved', 'Closed', 'Rejected') THEN 1 END) as overdue
        FROM complaint_assignments ca
        JOIN complaints c ON ca.complaint_id = c.id
        WHERE ca.is_active = 1 AND ca.assigned_staff IS NOT NULL AND ca.assigned_staff != ''
        GROUP BY ca.assigned_staff, ca.department_name
        ORDER BY total_assigned DESC
    ");
    $officers = $officerStmt->fetchAll();

    // 6. Resident Satisfaction Distribution
    $fbStmt = $db->query("
        SELECT 
            ROUND(AVG(rating), 1) as avg_rating,
            COUNT(id) as total_feedback,
            COUNT(CASE WHEN rating = 5 THEN 1 END) as stars_5,
            COUNT(CASE WHEN rating = 4 THEN 1 END) as stars_4,
            COUNT(CASE WHEN rating = 3 THEN 1 END) as stars_3,
            COUNT(CASE WHEN rating <= 2 THEN 1 END) as stars_low
        FROM resident_feedback
    ");
    $feedbackStats = $fbStmt->fetch();

    // 7. Monthly Complaint Trends (Past 6 months)
    $trendStmt = $db->query("
        SELECT DATE_FORMAT(submitted_at, '%b %Y') as month, COUNT(id) as count,
               COUNT(CASE WHEN status IN ('Resolved', 'Closed') THEN 1 END) as resolved
        FROM complaints
        GROUP BY DATE_FORMAT(submitted_at, '%b %Y')
        ORDER BY MIN(submitted_at) ASC
        LIMIT 6
    ");
    $monthlyTrends = $trendStmt->fetchAll();

    // 8. Overdue Complaints List (Feature 6)
    $overdueStmt = $db->query("
        SELECT c.id, c.reference_no, c.title, c.category, c.priority, c.status, c.target_resolution_date,
               ca.department_name, ca.assigned_staff,
               ROUND(TIMESTAMPDIFF(HOUR, c.target_resolution_date, NOW())) as hours_overdue
        FROM complaints c
        LEFT JOIN complaint_assignments ca ON c.id = ca.complaint_id AND ca.is_active = 1
        WHERE c.target_resolution_date < NOW() AND c.status NOT IN ('Resolved', 'Closed', 'Rejected')
        ORDER BY hours_overdue DESC
    ");
    $overdueComplaints = $overdueStmt->fetchAll();

    sendResponse(true, [
        'overview'          => [
            'totalReceived'  => (int)$stats['total_received'],
            'submitted'      => (int)$stats['submitted_count'],
            'pending'        => (int)$stats['pending_count'],
            'inProgress'     => (int)$stats['in_progress_count'],
            'resolved'       => (int)$stats['resolved_count'],
            'closed'         => (int)$stats['closed_count'],
            'overdue'        => (int)$stats['overdue_count'],
            'resolutionRate' => $stats['total_received'] > 0 ? round(($stats['resolved_count'] / $stats['total_received']) * 100, 1) : 0
        ],
        'byCategory'        => $categories,
        'byPriority'        => $priorities,
        'byDepartment'      => $departments,
        'officerPerformance'=> $officers,
        'residentFeedback'  => [
            'averageRating'  => (float)($feedbackStats['avg_rating'] ?? 5.0),
            'totalResponses' => (int)($feedbackStats['total_feedback'] ?? 0),
            'distribution'   => [
                '5_stars' => (int)($feedbackStats['stars_5'] ?? 0),
                '4_stars' => (int)($feedbackStats['stars_4'] ?? 0),
                '3_stars' => (int)($feedbackStats['stars_3'] ?? 0),
                'low'     => (int)($feedbackStats['stars_low'] ?? 0)
            ]
        ],
        'monthlyTrends'     => $monthlyTrends,
        'overdueComplaints' => $overdueComplaints
    ], 'Analytics data retrieved.');
}

sendResponse(false, null, 'Method not allowed.', 405);

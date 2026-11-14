<?php
// =====================================================================
// AI-Assisted Classification and Duplicate Detection Engine
// =====================================================================

require_once __DIR__ . '/../config/database.php';

class ClassificationEngine {
    
    public static function classify(string $title, string $description, string $userCategoryPreference = ''): array {
        $db = Database::getConnection();
        $combinedText = mb_strtolower($title . ' ' . $description);

        // Fetch routing rules from database
        $stmt = $db->query("SELECT * FROM complaint_routing_rules WHERE is_active = 1");
        $rules = $stmt->fetchAll();

        // Urgent & High trigger keywords
        $urgentKeywords = ['danger', 'fire', 'baha', 'flood', 'collapse', 'gun', 'blood', 'emergency', 'immediate', 'life threatening', 'landslide', 'electrocution'];
        $highKeywords = ['high', 'broken road', 'blocked', 'fight', 'leak', 'hazard', 'pothole', 'accident', 'rabid'];

        $bestRule = null;
        $maxScore = 0;
        $matchedKeywords = [];

        foreach ($rules as $rule) {
            $score = 0;
            $foundInRule = [];
            $keywords = array_map('trim', explode(',', mb_strtolower($rule['keywords'])));

            foreach ($keywords as $kw) {
                if (!empty($kw) && str_contains($combinedText, $kw)) {
                    $score += 2;
                    $foundInRule[] = $kw;
                }
            }

            if (!empty($userCategoryPreference) && mb_strtolower($rule['category']) === mb_strtolower($userCategoryPreference)) {
                $score += 1;
            }

            if ($score > $maxScore) {
                $maxScore = $score;
                $bestRule = $rule;
                $matchedKeywords = $foundInRule;
            }
        }

        // Fallback default if no keywords hit
        if (!$bestRule) {
            if (!empty($rules)) {
                $bestRule = $rules[0];
            } else {
                $bestRule = [
                    'category'         => 'Barangay Administration',
                    'department'       => 'Barangay Administrative Office',
                    'default_priority' => 'Medium',
                    'assigned_staff'   => 'Sec. Danilo Lopez'
                ];
            }
            $matchedKeywords = ['general', 'community'];
        }

        // Determine priority
        $priority = $bestRule['default_priority'];
        foreach ($urgentKeywords as $uk) {
            if (str_contains($combinedText, $uk)) {
                $priority = 'Urgent';
                break;
            }
        }
        if ($priority !== 'Urgent') {
            foreach ($highKeywords as $hk) {
                if (str_contains($combinedText, $hk)) {
                    $priority = 'High';
                    break;
                }
            }
        }

        $confidence = min(97, max(75, 74 + ($maxScore * 5)));
        $displayKeywords = !empty($matchedKeywords) ? array_slice($matchedKeywords, 0, 4) : [$bestRule['category']];
        $keywordsStr = implode(', ', $displayKeywords);

        $reasoning = "Classification engine detected key indicators ({$keywordsStr}) relating to " .
                     mb_strtolower($bestRule['category']) . " concerns in Barangay Kinilis. Automatically routed to {$bestRule['department']}.";

        return [
            'category'             => $bestRule['category'],
            'department'           => $bestRule['department'],
            'priority'             => $priority,
            'assigned_staff'       => $bestRule['assigned_staff'] ?? 'Department Desk Officer',
            'confidence'           => $confidence,
            'reasoning'            => $reasoning,
            'keywords'             => $displayKeywords
        ];
    }

    public static function checkDuplicates(string $title, string $description, string $location, string $category, int $excludeComplaintId = 0): array {
        $db = Database::getConnection();
        
        // Find active (non-closed) complaints
        $sql = "SELECT id, reference_no, title, description, category, priority, status, location, submitted_at, resident_name 
                FROM complaints 
                WHERE status NOT IN ('Closed', 'Rejected') AND id != :excludeId
                ORDER BY id DESC LIMIT 50";
        $stmt = $db->prepare($sql);
        $stmt->execute([':excludeId' => $excludeComplaintId]);
        $existing = $stmt->fetchAll();

        $duplicates = [];
        $newWords = self::extractSignificantTokens($title . ' ' . $description);
        $normLocation = mb_strtolower(trim($location));

        foreach ($existing as $item) {
            $existingWords = self::extractSignificantTokens($item['title'] . ' ' . $item['description']);
            
            // Jaccard similarity index on words
            $intersection = array_intersect($newWords, $existingWords);
            $union = array_unique(array_merge($newWords, $existingWords));
            
            $wordSim = !empty($union) ? (count($intersection) / count($union)) : 0;
            
            // Location match bonus
            $itemLocation = mb_strtolower(trim($item['location']));
            $locMatch = (str_contains($itemLocation, $normLocation) || str_contains($normLocation, $itemLocation));
            
            // Category match bonus
            $catMatch = (mb_strtolower($item['category']) === mb_strtolower($category));

            $score = ($wordSim * 70) + ($locMatch ? 20 : 0) + ($catMatch ? 10 : 0);

            if ($score >= 40) { // Potential duplicate threshold
                $duplicates[] = [
                    'complaint_id'   => $item['id'],
                    'reference_no'   => $item['reference_no'],
                    'title'          => $item['title'],
                    'status'         => $item['status'],
                    'location'       => $item['location'],
                    'resident_name'  => $item['resident_name'],
                    'submitted_at'   => $item['submitted_at'],
                    'match_score'    => round($score),
                    'match_reason'   => $locMatch ? "Similar description & shared location ({$item['location']})" : "High topic & keyword similarity"
                ];
            }
        }

        // Sort highest match first
        usort($duplicates, fn($a, $b) => $b['match_score'] <=> $a['match_score']);

        return array_slice($duplicates, 0, 5);
    }

    private static function extractSignificantTokens(string $text): array {
        $text = mb_strtolower($text);
        // Remove common Filipino and English stopwords
        $stopwords = [
            'ang', 'mga', 'ng', 'sa', 'at', 'na', 'ay', 'ito', 'may', 'ko', 'po', 'kami', 'namin', 'ba',
            'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'in', 'for', 'to', 'of', 'with', 'from'
        ];
        
        $tokens = preg_split('/[\s,\.\?!;:\(\)]+/', $text, -1, PREG_SPLIT_NO_EMPTY);
        $significant = [];

        foreach ($tokens as $t) {
            if (mb_strlen($t) > 2 && !in_array($t, $stopwords)) {
                $significant[] = $t;
            }
        }

        return array_unique($significant);
    }
}

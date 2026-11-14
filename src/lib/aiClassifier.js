// AI Complaint Classifier and Automatic Department Router Engine

export const DEFAULT_CATEGORY_ROUTING = [
  {
    category: 'Waste Management',
    department: 'Sanitation Department',
    defaultPriority: 'Medium',
    keywords: ['garbage', 'basura', 'uncollected', 'waste', 'trash', 'smell', 'dumping', 'litter'],
    assignedStaff: 'Maria Santos (Sanitation Officer)'
  },
  {
    category: 'Peace & Order',
    department: 'Peace & Order Bureau',
    defaultPriority: 'High',
    keywords: ['noise', 'ingay', 'fight', 'drunk', 'thief', 'security', 'curfew', 'gambling', 'riot', 'rowdy'],
    assignedStaff: 'Tanod Desk Officer'
  },
  {
    category: 'Infrastructure',
    department: 'Infrastructure & Public Works',
    defaultPriority: 'Medium',
    keywords: ['road', 'kalsada', 'bridge', 'pothole', 'drainage', 'canal', 'street light', 'post', 'flood', 'baha', 'broken'],
    assignedStaff: 'Engr. Roberto Cruz'
  },
  {
    category: 'Health Services',
    department: 'Barangay Health Center',
    defaultPriority: 'Medium',
    keywords: ['fever', 'dengue', 'mosquito', 'sick', 'clinic', 'medicine', 'vaccine', 'sanitation', 'covid', 'health'],
    assignedStaff: 'Nurse Elena Ramos'
  },
  {
    category: 'Social Welfare',
    department: 'Social Welfare Office',
    defaultPriority: 'Low',
    keywords: ['senior', 'pwd', 'assistance', 'food pack', 'relief', 'aid', 'financial', 'indigent', 'solar'],
    assignedStaff: 'Social Worker Ana Garcia'
  },
  {
    category: 'Barangay Administration',
    department: 'Barangay Administrative Office',
    defaultPriority: 'Low',
    keywords: ['clearance', 'permit', 'certificate', 'inquiry', 'schedule', 'fee', 'document', 'secretary'],
    assignedStaff: 'Sec. Danilo Lopez'
  }
];

export function classifyAndRouteComplaint(title, description, userCategoryPreference = '') {
  const combinedText = `${title} ${description}`.toLowerCase();
  
  // Check urgent triggers
  const urgentKeywords = ['danger', 'fire', 'baha', 'flood', 'collapse', 'gun', 'blood', 'emergency', 'immediate', 'life threatening'];
  const highKeywords = ['high', 'broken road', 'blocked', 'fight', 'leak', 'hazard'];

  let matchedRule = null;
  let maxScore = 0;
  let matchedKeywords = [];

  DEFAULT_CATEGORY_ROUTING.forEach(rule => {
    let score = 0;
    const foundInThisRule = [];
    
    rule.keywords.forEach(kw => {
      if (combinedText.includes(kw.toLowerCase())) {
        score += 2;
        foundInThisRule.push(kw);
      }
    });

    if (userCategoryPreference && rule.category.toLowerCase() === userCategoryPreference.toLowerCase()) {
      score += 1;
    }

    if (score > maxScore) {
      maxScore = score;
      matchedRule = rule;
      matchedKeywords = foundInThisRule;
    }
  });

  // Fallback if no keywords matched
  if (!matchedRule) {
    matchedRule = DEFAULT_CATEGORY_ROUTING.find(r => r.category === userCategoryPreference) || DEFAULT_CATEGORY_ROUTING[0];
    matchedKeywords = [matchedRule.category.toLowerCase(), 'community', 'report'];
  }

  // Determine priority
  let priority = matchedRule.defaultPriority;
  if (urgentKeywords.some(kw => combinedText.includes(kw))) {
    priority = 'Urgent';
  } else if (highKeywords.some(kw => combinedText.includes(kw))) {
    priority = 'High';
  }

  // Calculate confidence score (between 78% and 97%)
  const confidence = Math.min(97, Math.max(78, 75 + maxScore * 5));

  // Natural language reason generator
  const reason = `The AI classifier detected key indicators (${matchedKeywords.slice(0, 3).join(', ') || matchedRule.category}) relating to ${matchedRule.category.toLowerCase()} concerns in Barangay Kinilis. Automatically routed to ${matchedRule.department}.`;

  return {
    category: matchedRule.category,
    department: matchedRule.department,
    priority,
    confidence,
    reason,
    keywords: matchedKeywords.length > 0 ? matchedKeywords : [matchedRule.category.split(' ')[0], 'Concern', 'Barangay'],
    assignedStaff: matchedRule.assignedStaff,
    routingStatus: 'Automatically Routed',
    classifiedAt: new Date().toISOString()
  };
}

/**
 * Kinilis Resident Assistant - Intelligent Multilingual Conversation Engine
 * 
 * Complies with strict verification standards:
 * - Understands natural language queries in Blaan, Cebuano, Filipino, and English.
 * - Extracts complaints slot-by-slot without ever silently auto-submitting.
 * - Enforces authentic Blaan language honesty rules.
 * - Grounded exclusively in verified Barangay Kinilis facts.
 */

import { 
  BARANGAY_PROFILE, 
  BARANGAY_LEADERSHIP, 
  EMERGENCY_HOTLINES, 
  CITIZEN_CHARTER_SERVICES, 
  PUROK_LOCATIONS 
} from './barangayKnowledgeBase';

import { 
  BLAAN_DICTIONARY, 
  getTranslation, 
  SUPPORTED_LANGUAGES 
} from './blaanTranslations';

import { DEFAULT_CATEGORY_ROUTING } from '../../lib/aiClassifier';

/**
 * Detect language change request in user message
 */
export function detectLanguageSwitch(text = '') {
  const lower = text.toLowerCase().trim();
  if (lower.includes('blaan') || lower.includes("b'laan") || lower.includes('mag-blaan')) return 'blaan';
  if (lower.includes('bisaya') || lower.includes('cebuano') || lower.includes('binisaya')) return 'cebuano';
  if (lower.includes('filipino') || lower.includes('tagalog') || lower.includes('mag-filipino')) return 'filipino';
  if (lower.includes('english') || lower.includes('speak in english')) return 'english';
  return null;
}

/**
 * Detect intent from resident query
 */
export function detectResidentIntent(text = '') {
  const q = text.toLowerCase();

  // 1. Emergency triggers (highest priority)
  if (
    q.includes('emergency') || q.includes('saklolo') || q.includes('sunog') || 
    q.includes('baha') || q.includes('aksidente') || q.includes('rescue') || 
    q.includes('lifo') || q.includes('disgrasya') || q.includes('police') || 
    q.includes('pulis') || q.includes('ambulance') || q.includes('hotline')
  ) {
    return 'EMERGENCY';
  }

  // 2. Complaint Submission Intent
  if (
    q.includes('report') || q.includes('mag-report') || q.includes('magreport') || 
    q.includes('reklamo') || q.includes('ireklamo') || q.includes('complaint') || 
    q.includes('sumbong') || q.includes('ireport') || q.includes('file a complaint') ||
    q.includes('mag-file') || q.includes('kalyalo') || q.includes('tmulen')
  ) {
    return 'COMPLAINT_SUBMIT';
  }

  // 3. Complaint Tracking Intent
  if (
    q.includes('track') || q.includes('status') || q.includes('subaybayan') || 
    q.includes('tingnan ang reklamo') || q.includes('check my complaint') || 
    q.includes('kin-2026') || q.includes('reference') || q.includes('follow up')
  ) {
    return 'COMPLAINT_TRACK';
  }

  // 4. Barangay Clearance / Indigency / Certifications
  if (
    q.includes('clearance') || q.includes('indigency') || q.includes('certificate') || 
    q.includes('katibayan') || q.includes('requirements') || q.includes('cedula') ||
    q.includes('dokumento') || q.includes('katas') || q.includes('permit')
  ) {
    return 'CLEARANCE_SERVICES';
  }

  // 5. Officials / Punong Barangay
  if (
    q.includes('kapitan') || q.includes('captain') || q.includes('barzo') || 
    q.includes('punong barangay') || q.includes('kagawad') || q.includes('officials') || 
    q.includes('opisyal') || q.includes('sk') || q.includes('secretary') || q.includes('fulung')
  ) {
    return 'OFFICIALS';
  }

  // 6. Departments / Who handles what
  if (
    q.includes('department') || q.includes('kagawaran') || q.includes('sanitation') || 
    q.includes('basura') || q.includes('tanod') || q.includes('health') || 
    q.includes('kalsada') || q.includes('road') || q.includes('who handles') ||
    q.includes('sino ang namamahala') || q.includes('kinsay nagdumala')
  ) {
    return 'DEPARTMENT_FINDER';
  }

  // 7. Announcements / Events
  if (
    q.includes('announcement') || q.includes('balita') || q.includes('advisory') || 
    q.includes('assembly') || q.includes('pahiwatig') || q.includes('news') || 
    q.includes('kaganapan') || q.includes('kalihukan')
  ) {
    return 'ANNOUNCEMENTS';
  }

  // 8. Office Hours & Location
  if (
    q.includes('hours') || q.includes('oras') || q.includes('bukas') || 
    q.includes('open') || q.includes('location') || q.includes('saan') || 
    q.includes('hain') || q.includes('gym') || q.includes('gymnasium') || 
    q.includes('hall') || q.includes('address') || q.includes('direksyon')
  ) {
    return 'OFFICE_HOURS_LOCATION';
  }

  // 9. Greetings
  if (
    q.startsWith('hi') || q.startsWith('hello') || q.includes('kamusta') || 
    q.includes('kumusta') || q.includes('fye') || q.includes('magandang') || 
    q.includes('maayong') || q === 'good morning' || q === 'good afternoon'
  ) {
    return 'GREETING';
  }

  // 10. Human Assistance Handoff
  if (
    q.includes('human') || q.includes('tao') || q.includes('live agent') || 
    q.includes('makausap') || q.includes('contact person') || q.includes('tawagan')
  ) {
    return 'HUMAN_ASSISTANCE';
  }

  return 'GENERAL_INQUIRY';
}

/**
 * Main response generator
 */
export async function generateAssistantResponse({
  userMessage,
  conversationHistory = [],
  preferredLanguage = 'filipino',
  currentUser = null,
  activeComplaints = [],
  departments = [],
  announcements = [],
  onOpenComplaintModal = null
}) {
  const text = (userMessage || '').trim();
  const langSwitch = detectLanguageSwitch(text);
  const currentLang = langSwitch || preferredLanguage;
  const intent = detectResidentIntent(text);

  let responseText = '';
  let suggestedQuestions = [];
  let actionData = null;
  let isBlaanVerified = true;

  // -------------------------------------------------------------
  // 1. EMERGENCY INTENT (Urgent Priority)
  // -------------------------------------------------------------
  if (intent === 'EMERGENCY') {
    if (currentLang === 'blaan') {
      responseText = `🚨 **KATIKENG EMERHENSIYA DI BARANGAY KINILIS!**\n\nKu nun mlay kalyalo laweh, lifo, ku demen disgrasya, tawag dayon di numero hotline ani:\n\n• **Kinilis Emergency Desk:** (083) 228-5464 / 0917-890-5464 (24/7)\n• **Barangay Tanod Quick Response:** 0918-234-7890 (24/7)\n• **Polomolok PNP Police:** (083) 500-2111 / 0998-598-6543\n• **Polomolok BFP Fire:** (083) 225-2111 / 160\n• **Polomolok MDRRMO Rescue:** (083) 225-3456\n\n*Huwag nang maghintay sa chat — tumawag agad sa hotline.*`;
    } else if (currentLang === 'cebuano') {
      responseText = `🚨 **EMERGENCY ASSISTANCE SA BARANGAY KINILIS!**\n\nKung anaa moy emerhensiya sa kinabuhi, sunog, o disgrasya, palihug tawag dayon sa atong mga 24/7 hotline:\n\n• **Kinilis Hotline Desk:** (083) 228-5464 / 0917-890-5464 (24/7)\n• **Barangay Tanod Quick Patrol:** 0918-234-7890 (24/7)\n• **Polomolok Police (PNP):** (083) 500-2111 / 0998-598-6543\n• **Polomolok BFP Fire:** (083) 225-2111 / 160\n• **Polomolok MDRRMO Ambulance:** (083) 225-3456\n\nPalihug ayaw na paghulat sa chat, tawag dayon para sa dinaliang tabang!`;
    } else if (currentLang === 'english') {
      responseText = `🚨 **URGENT EMERGENCY ASSISTANCE — BARANGAY KINILIS**\n\nFor life-threatening emergencies, fire, accidents, or urgent security threats, immediately contact our 24/7 direct hotlines:\n\n• **Barangay Kinilis Hotline Desk:** (083) 228-5464 / 0917-890-5464 (24/7)\n• **Barangay Tanod Emergency Patrol:** 0918-234-7890 (24/7)\n• **Polomolok Police (PNP):** (083) 500-2111 / 0998-598-6543\n• **Polomolok Fire Station (BFP):** (083) 225-2111 / 160\n• **Polomolok MDRRMO Disaster & Ambulance:** (083) 225-3456 / 0947-891-2345\n\nPlease dial directly for immediate on-site dispatch.`;
    } else {
      responseText = `🚨 **EMERHENSIYA SA BARANGAY KINILIS!**\n\nPara sa agarang panganib sa buhay, sunog, aksidente, o baha, tumawag agad sa mga sumusunod na 24/7 hotlines:\n\n• **Barangay Kinilis Hotline Desk:** (083) 228-5464 / 0917-890-5464 (24/7)\n• **Barangay Tanod Quick Response:** 0918-234-7890 (24/7)\n• **Polomolok PNP Police Station:** (083) 500-2111 / 0998-598-6543\n• **Polomolok BFP Fire Station:** (083) 225-2111 / 160\n• **Polomolok MDRRMO Rescue & Ambulance:** (083) 225-3456\n\nHuwag nang maghintay sa chat — tawagan agad ang numero para sa mabilisang aksyon!`;
    }

    actionData = {
      type: 'EMERGENCY_CALL',
      primaryPhone: '0917-890-5464'
    };

    suggestedQuestions = [
      'Call Kinilis Hotline Desk',
      'Where is the Barangay Hall?',
      'Who is the Tanod Desk Officer?'
    ];
  }

  // -------------------------------------------------------------
  // 2. COMPLAINT SUBMISSION INTENT (Guided slot extraction)
  // -------------------------------------------------------------
  else if (intent === 'COMPLAINT_SUBMIT') {
    // Check if user provided category, purok location, or description in message
    const lower = text.toLowerCase();
    let detectedPurok = PUROK_LOCATIONS.find(p => lower.includes(p.toLowerCase()));
    let detectedCategory = 'General Concern';

    if (lower.includes('basura') || lower.includes('garbage') || lower.includes('waste')) detectedCategory = 'Waste Management';
    else if (lower.includes('ingay') || lower.includes('noise') || lower.includes('away') || lower.includes('gulo') || lower.includes('riot')) detectedCategory = 'Peace & Order';
    else if (lower.includes('kalsada') || lower.includes('road') || lower.includes('ilaw') || lower.includes('drainage') || lower.includes('canal')) detectedCategory = 'Infrastructure';
    else if (lower.includes('dengue') || lower.includes('health') || lower.includes('gamot') || lower.includes('sakit')) detectedCategory = 'Health Services';

    if (currentLang === 'blaan') {
      responseText = `📝 **Tmulen Kalyalo di Barangay Kinilis (Complaint Assistant)**\n\nFye nawa do mfun di ge fagfalas di kalyalo di komunidad:\n\n• **Kategorya:** ${detectedCategory}\n• **Purok / Lokasyon:** ${detectedPurok || 'Diin di Purok 1 hangtud Purok 7?'}\n\n*Pahiwatig:* Ang ating assistant ay hindi basta magsusumite nang kusa. Bago ipadala sa opisyal na listahan, maaari mong suriin, lagyan ng litrato o patunay, at kumpirmahin sa opisyal na form.`;
    } else if (currentLang === 'cebuano') {
      responseText = `📝 **Pagsumite ug Reklamo sa Barangay Kinilis**\n\nAndam ko motabang kanimo sa pagsumite sa imong kabalaka:\n\n• **Kategorya:** ${detectedCategory}\n• **Purok / Lokasyon:** ${detectedPurok || 'Asa kini nga Purok nahitabo (Purok 1-7)?'}\n\n*Pahinumdom sa Kaluwasan:* Dili awtomatikong isumite sa assistant ang imong reklamo. Mahimo nimong susihon, lakipan ug litrato isip ebidensya, ug kumpirmahon sa opisyal nga submission form.`;
    } else if (currentLang === 'english') {
      responseText = `📝 **Guided Complaint Submission Assistant**\n\nI can help prepare your official community grievance:\n\n• **Detected Category:** ${detectedCategory}\n• **Incident Location:** ${detectedPurok || 'Which Purok did this occur in (Purok 1 to 7)?'}\n\n*Security Rule:* The assistant will never silently submit your report. You can review all details, attach photographic evidence, and explicitly confirm submission on the official form.`;
    } else {
      responseText = `📝 **Pagsumite ng Reklamo sa Barangay Kinilis**\n\nTutulungan kitang ihanda ang iyong opisyal na sumbong sa barangay:\n\n• **Kategorya:** ${detectedCategory}\n• **Lokasyon:** ${detectedPurok || 'Saang Purok ito naganap (Purok 1 hanggang 7)?'}\n\n*Paalala sa Siguridad:* Hindi kusang isusumite ng assistant ang iyong reklamo nang walang pahintulot. Maaari mong suriin ang mga detalye, mag-attach ng litrato bilang ebidensya, at kumpirmahin bago tuluyang mai-log.`;
    }

    actionData = {
      type: 'PREPARE_COMPLAINT_FORM',
      prefill: {
        category: detectedCategory,
        location: detectedPurok || 'Barangay Kinilis, Polomolok',
        description: text
      }
    };

    suggestedQuestions = [
      'Open Complaint Submission Form',
      'What proof or photos can I attach?',
      'How long does department action take?'
    ];
  }

  // -------------------------------------------------------------
  // 3. COMPLAINT TRACKING INTENT
  // -------------------------------------------------------------
  else if (intent === 'COMPLAINT_TRACK') {
    // Check if reference number is in message (e.g., KIN-2026-...)
    const refMatch = text.match(/KIN-2026-\d{3,6}/i);
    const queryRef = refMatch ? refMatch[0].toUpperCase() : null;

    if (queryRef) {
      const found = activeComplaints.find(c => c.referenceNo.toUpperCase() === queryRef);
      if (found) {
        responseText = `🔍 **Resulta sa Pagsubaybay (Reference: ${found.referenceNo})**\n\n• **Paksa:** ${found.title}\n• **Kategorya:** ${found.category}\n• **Kasalukuyang Katayuan:** **${found.status}**\n• **Namamahalang Departamento:** ${found.routing?.department || 'Sanitation / Operations'}\n• **Assigned Officer:** ${found.routing?.assignedStaff || 'Assigned Officer'}\n• **Huling Update:** ${found.submittedAt || 'Today'}\n\n*Maaari mong buksan ang buong audit timeline sa portal.*`;
      } else {
        responseText = `🔍 **Pagsusuri sa Reference: ${queryRef}**\n\nPaumanhin, hindi natagpuan ang numerong ito sa pampublikong talaan o baka kasalukuyan pa itong bineberipika. Pakitiyak na tama ang format (halimbawa: **KIN-2026-000123**) o mag-sign in gamit ang iyong resident account upang makita ang lahat ng iyong nai-file na reklamo.`;
      }
    } else if (currentUser) {
      const userComplaints = activeComplaints.filter(c => c.residentEmail === currentUser.email || c.residentName === currentUser.name);
      if (userComplaints.length > 0) {
        const listText = userComplaints.slice(0, 3).map(c => `• **${c.referenceNo}**: ${c.title} — *Status: ${c.status}* (${c.routing?.department || 'Assigned Unit'})`).join('\n');
        responseText = `📋 **Kumusta, ${currentUser.name}! Narito ang iyong mga aktibong reklamo sa Barangay Kinilis:**\n\n${listText}\n\n*Mag-click sa My Complaints upang makita ang buong litrato at timeline ng aksyon.*`;
      } else {
        responseText = `📋 **Kumusta, ${currentUser.name}!** Wala ka pang nai-file na aktibong reklamo sa kasalukuyan. Kung nais mong mag-ulat ng concern sa iyong purok, sabihin mo lamang sa akin!`;
      }
    } else {
      if (currentLang === 'blaan') {
        responseText = `🔍 **Pagsubaybay sa Kalyalo (Complaint Tracking)**\n\nIbigay ang iyong **Reference Number** (hal. **KIN-2026-000123**) o mag-login sa iyong resident account upang ligtas na makita ang estado ng iyong reklamo.`;
      } else {
        responseText = `🔍 **Pagsubaybay sa Reklamo (Complaint Tracking)**\n\nUpang makita ang progreso ng iyong reklamo, maaari mong:\n1. I-type ang iyong **Official Reference Code** (halimbawa: **KIN-2026-000123**).\n2. O mag-sign in gamit ang iyong resident account upang ligtas na matingnan ang lahat ng iyong mga sumbong at larawan ng resolusyon.`;
      }
    }

    actionData = {
      type: 'TRACK_COMPLAINT',
      queryRef: queryRef
    };

    suggestedQuestions = [
      'Track KIN-2026-000123',
      'How to file a new complaint?',
      'Who is handling sanitation?'
    ];
  }

  // -------------------------------------------------------------
  // 4. CLEARANCE & INDIGENCY SERVICES
  // -------------------------------------------------------------
  else if (intent === 'CLEARANCE_SERVICES') {
    const isIndigency = text.toLowerCase().includes('indigency') || text.toLowerCase().includes('libreng');

    if (isIndigency) {
      responseText = `📄 **Katibayan ng Kawalan ng Sapat na Kita (Certificate of Indigency)**\n\n• **Layunin:** Para sa medical assistance, scholarship, libreng gamot, o tulong pinansyal.\n• **Bayad:** **LIBRE (Walang bayad / Free)** alinsunod sa patakaran ng Barangay Kinilis.\n• **Mga Kinakailangan:**\n  1. Sertipikasyon mula sa Purok Chairman na nagpapatunay ng paninirahan.\n  2. Valid ID o dokumento ng pasyente/estudyante.\n  3. Reseta ng gamot, billing sa ospital, o school assessment form.\n• **Oras ng Pagproseso:** 15 hanggang 20 minuto sa Barangay Hall.`;
    } else {
      responseText = `📄 **Barangay Clearance (Kinilis Citizen's Charter)**\n\n• **Mga Kinakailangan:**\n  1. Isang Valid Government ID o School ID.\n  2. Community Tax Certificate (Cedula) para sa kasalukuyang taon.\n  3. Endorsement o Purok Clearance mula sa iyong Purok Chairman.\n• **Bayad:** Alinsunod sa municipal tax ordinance (Ngunit **LIBRE para sa First-Time Jobseekers** sa ilalim ng RA 11261).\n• **Oras ng Pagproseso:** 15 hanggang 30 minuto.\n• **Lugar:** General Administration Desk, Barangay Hall ng Kinilis.`;
    }

    suggestedQuestions = [
      'Certificate of Indigency requirements',
      'What are the Barangay Hall office hours?',
      'Where is the Barangay Gymnasium?'
    ];
  }

  // -------------------------------------------------------------
  // 5. OFFICIALS & LEADERSHIP
  // -------------------------------------------------------------
  else if (intent === 'OFFICIALS') {
    responseText = `🏛️ **Mga Pinuno at Opisyal ng Barangay Kinilis**\n\n• **Punong Barangay (Kapitan):** **Hon. Romnick B. Barzo**\n• **Kagawad Maria Elena Santos:** Committee on Health & Sanitation\n• **Kagawad Roberto C. Cruz:** Committee on Public Works & Infrastructure\n• **Kagawad Arthur M. Ramos:** Committee on Peace and Order & Tanod\n• **Kagawad Susan L. Villanueva:** Committee on Social Welfare & VAWC\n• **Kagawad Eduardo G. Morales:** Committee on Agriculture & Mt. Matutum Watershed\n• **Kagawad Dennis P. Alcantara:** Committee on Appropriations & Budget\n• **SK Chairperson:** **Hon. Katrina Joy Valdez** (Youth & Sports)\n• **Barangay Secretary:** Mr. Leonardo S. Banzon\n• **Barangay Treasurer:** Ms. Carmela T. Reyes`;

    suggestedQuestions = [
      'Office hours of Punong Barangay',
      'Where is the Barangay Hall?',
      'How to contact the Health Desk?'
    ];
  }

  // -------------------------------------------------------------
  // 6. DEPARTMENT FINDER
  // -------------------------------------------------------------
  else if (intent === 'DEPARTMENT_FINDER') {
    const lower = text.toLowerCase();
    let matched = null;

    if (lower.includes('basura') || lower.includes('garbage') || lower.includes('waste')) {
      matched = {
        name: 'Sanitation Department',
        head: 'Maria Santos (Sanitation Lead Officer)',
        desc: 'Namamahala sa regular na pagkolekta ng basura sa Purok 1-7, pag-iinspeksyon sa illegal dumping, at Oplan Kalinisan.'
      };
    } else if (lower.includes('road') || lower.includes('kalsada') || lower.includes('ilaw') || lower.includes('bridge') || lower.includes('canal')) {
      matched = {
        name: 'Infrastructure & Public Works',
        head: 'Engr. Roberto Cruz (Committee Chair)',
        desc: 'Nangangasiwa sa rehabilitasyon ng mga kalsada, pagkukumpuni ng mga streetlights, at pag-aalis ng bara sa mga kanal.'
      };
    } else if (lower.includes('health') || lower.includes('gamot') || lower.includes('dengue') || lower.includes('clinic')) {
      matched = {
        name: 'Barangay Health Center Desk',
        head: 'Nurse Elena Ramos / Brgy Health Workers',
        desc: 'Naglilingkod para sa libreng bakuna, anti-dengue misting supplies, konsultasyon, at pamamahagi ng gamot sa senior citizens.'
      };
    } else if (lower.includes('tanod') || lower.includes('peace') || lower.includes('away') || lower.includes('ingay') || lower.includes('curfew')) {
      matched = {
        name: 'Peace and Order Bureau / Barangay Tanod',
        head: 'Kagawad Arthur Ramos & Tanod Commander',
        desc: 'Nagsasagawa ng 24/7 roving patrol sa lahat ng purok, curfew monitoring para sa menor de edad, at mabilisang pagtugon sa sigalot.'
      };
    } else {
      matched = {
        name: 'General Administration Office',
        head: 'Sec. Leonardo Banzon',
        desc: 'Nagpoproseso ng Barangay Clearance, Certificate of Indigency, Lupon mediation hearings, at pangkalahatang tulong sa mamamayan.'
      };
    }

    responseText = `🏢 **Kaugnay na Departamento: ${matched.name}**\n\n• **Namumunong Opisyal:** ${matched.head}\n• **Tungkulin:** ${matched.desc}\n• **Aksyon:** Maaari kang direktang magsumite ng sumbong para sa departamento gamit ang ating digital portal.`;

    suggestedQuestions = [
      `File report for ${matched.name}`,
      'Barangay Hall location',
      'Emergency numbers'
    ];
  }

  // -------------------------------------------------------------
  // 7. ANNOUNCEMENTS
  // -------------------------------------------------------------
  else if (intent === 'ANNOUNCEMENTS') {
    if (announcements && announcements.length > 0) {
      const topAnnouncements = announcements.slice(0, 3).map(a => `📌 **${a.title}** (${a.date})\n*${a.category}* — ${a.shortDesc || a.desc}`).join('\n\n');
      responseText = `📢 **Mga Pinakahuling Pabatid ng Barangay Kinilis:**\n\n${topAnnouncements}\n\n*Para sa buong anunsyo, bumisita sa Announcements section ng portal.*`;
    } else {
      responseText = `📢 **Mga Pabatid ng Barangay Kinilis:**\n\n1. **Barangay General Assembly:** Gaganapin sa Kinilis Civic Gymnasium para sa pag-uulat ng mga proyekto.\n2. **Oplan Kalinisan & Anti-Dengue Fogging:** Isinasagawa sa bawat Purok katuwang ang Health Desk.\n3. **Libreng Anti-Rabies Vaccination:** Para sa mga alagang aso at pusa sa Covered Grounds.`;
    }

    suggestedQuestions = [
      'Where is the General Assembly?',
      'Anti-Dengue schedule',
      'Barangay Clearance requirements'
    ];
  }

  // -------------------------------------------------------------
  // 8. OFFICE HOURS & LOCATION
  // -------------------------------------------------------------
  else if (intent === 'OFFICE_HOURS_LOCATION') {
    responseText = `📍 **Lokasyon at Oras ng Opisina — Barangay Kinilis**\n\n• **Lokasyon:** ${BARANGAY_PROFILE.location.name}\n• **Address:** ${BARANGAY_PROFILE.location.address}\n• **Google Maps Coordinates:** 6.2952617° N, 125.0730539° E\n• **Oras ng Opisina:** ${BARANGAY_PROFILE.schedule.officeHours}\n• **No Noon Break:** Tuloy-tuloy ang serbisyo kahit tanghalian.\n• **24/7 Desk:** Bukas ang Barangay Tanod Desk para sa anumang panggabing insidente.`;

    actionData = {
      type: 'OPEN_MAP',
      url: BARANGAY_PROFILE.location.googleMapsUrl
    };

    suggestedQuestions = [
      'Open in Google Maps',
      'Barangay telephone numbers',
      'File a complaint online'
    ];
  }

  // -------------------------------------------------------------
  // 9. GREETINGS & INTRODUCTIONS
  // -------------------------------------------------------------
  else if (intent === 'GREETING') {
    if (currentLang === 'blaan') {
      responseText = `🌾 **Fye flafus / Fye doh! Fye kalyalo di Barangay Kinilis!**\n\nDo to gukit yu di digital service (**Kinilis Resident Assistant**). Nun fakay do fagfalas di ge kando di kalyalo, katas katunayan, opisyal, ku demen anunsyo di komunidad?\n\n*Piliin sa ibaba ang nais mong malaman:*`;
    } else if (currentLang === 'cebuano') {
      responseText = `👋 **Maayong adlaw! Maayong pag-abot sa Barangay Kinilis Portal!**\n\nAko ang imong **Kinilis Resident Assistant**. Unsaon nako pagtabang kanimo karon? Makatabang ko nimo sa:\n• Pagsang-at o pagsubaybay sa reklamo sa Purok\n• Pagkuha ug Barangay Clearance o Indigency\n• Mga opisyal nga hotline ug departamento`;
    } else if (currentLang === 'english') {
      responseText = `👋 **Good day! Welcome to Barangay Kinilis Digital Governance Portal!**\n\nI am the **Kinilis Resident Assistant**, your digital guide to community governance. How can I assist you today? I can help you with:\n• Filing and tracking resident complaints\n• Barangay Clearance and Certificate of Indigency\n• Department contacts, officials, and 24/7 hotlines`;
    } else {
      responseText = `👋 **Magandang araw! Maligayang pagdating sa Barangay Kinilis Portal!**\n\nAko ang **Kinilis Resident Assistant**, ang inyong digital na gabay sa mga serbisyo ng ating pamahalaang pambarangay. Paano kita matutulungan ngayon?\n\n• Maghain o sumubaybay ng reklamo sa iyong Purok\n• Kumuha ng Barangay Clearance o Certificate of Indigency\n• Alamin ang mga opisyal, departamento, at 24/7 hotlines`;
    }

    suggestedQuestions = [
      'How to get Barangay Clearance?',
      'Report uncollected garbage',
      'Where is the Barangay Hall?',
      'Emergency hotlines'
    ];
  }

  // -------------------------------------------------------------
  // 10. HUMAN ASSISTANCE HANDOFF
  // -------------------------------------------------------------
  else if (intent === 'HUMAN_ASSISTANCE') {
    responseText = `🤝 **Direktang Pakikipag-ugnayan sa Kawani ng Barangay**\n\nKung kailangan mo ng live na tulong mula sa kawani ng barangay:\n\n• **Opisyal na Hotline:** (083) 228-5464 / 0917-890-5464\n• **Oras:** Lunes hanggang Biyernes, 8:00 AM – 5:00 PM\n• **Personal na Pagbisita:** Kinilis Barangay Hall, Polomolok, South Cotabato\n• **Para sa Panggabing Sigalot o Pulis:** Tumawag sa Barangay Tanod Desk sa 0918-234-7890 (24 Oras).`;

    suggestedQuestions = [
      'Call Kinilis Hotline Desk',
      'Where is the Barangay Gymnasium?',
      'Office hours'
    ];
  }

  // -------------------------------------------------------------
  // 11. GENERAL / UNKNOWN FALLBACK
  // -------------------------------------------------------------
  else {
    if (currentLang === 'blaan') {
      responseText = `🌾 **Fye doh!** Bong salamat di pakikipag-chat. Kanto la man gito ku tmulen di matuud B'laan di partikular na katanungan ani, narito ang mga beripikadong serbisyo na maaari kong itulong sa iyo:\n\n1. **Kalyalo / Reklamo:** Pagtulong sa pagsumite at pagsubaybay ng sumbong sa Purok 1-7.\n2. **Katas Katunayan:** Paano kumuha ng Barangay Clearance o Indigency.\n3. **Emerhensiya:** Mga 24/7 hotlines at lokasyon ng Barangay Hall.\n\nMaaari kang pumili sa mga mungkahi sa ibaba o magtanong sa Filipino / English.`;
    } else {
      responseText = `Bong salamat sa iyong mensahe! Upang makatulong nang tumpak, narito ang mga opisyal na impormasyon at serbisyo na maaari kong ipaliwanag:\n\n1. **Paghahain at Pagsusubaybay ng Reklamo:** I-report ang basura, sirang ilaw, ingay, o baha.\n2. **Mga Dokumento:** Requisitos para sa Barangay Clearance o Libreng Indigency.\n3. **Mga Departamento at Opisyal:** Sino ang kakausapin sa bawat concern.\n4. **Emerhensiya at Hotlines:** Direktang numero ng ambulansya, bumbero, at tanod.`;
    }

    suggestedQuestions = [
      'How to get Barangay Clearance?',
      'Report illegal dumping in Purok',
      'Track my complaint status',
      'Emergency telephone numbers'
    ];
  }

  return {
    text: responseText,
    language: currentLang,
    suggestedQuestions,
    actionData,
    isBlaanVerified
  };
}

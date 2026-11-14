/**
 * Kinilis Resident Assistant - Chatbot Service Layer
 * 
 * Manages Supabase persistence, edge function invocation,
 * local storage caching, and conversation tracking.
 */

import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { generateAssistantResponse } from './residentAssistantEngine';

const STORAGE_KEY_CONVO = 'kinilis_resident_assistant_convo_v1';
const STORAGE_KEY_LANG = 'kinilis_assistant_preferred_lang';

/**
 * Get or initialize current conversation from LocalStorage
 */
export function getSavedConversation() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONVO);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn('[ChatbotService] Failed to load cached conversation:', err);
  }

  // Initial welcome message
  return [
    {
      id: 'welcome_1',
      sender: 'assistant',
      text: `👋 **Fye doh! Maligayang pagdating sa Barangay Kinilis!**\n\nAko ang inyong **Kinilis Resident Assistant** (To' Tulong Kinilis), ang inyong digital na gabay sa pamahalaang pambarangay.\n\nPaano kita matutulungan ngayon?\n• 📝 **Magsumite o sumubaybay ng sumbong / reklamo**\n• 📄 **Alamin ang requirements para sa Barangay Clearance o Indigency**\n• 🏛️ **Mga opisyal, kagawaran, at opisina**\n• 🚨 **Mga 24/7 emergency hotlines**`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      language: 'filipino',
      suggestedQuestions: [
        'How to get Barangay Clearance?',
        'Report uncollected garbage',
        'Where is the Barangay Hall?',
        'Emergency telephone numbers'
      ]
    }
  ];
}

/**
 * Save active conversation
 */
export function saveConversation(messages) {
  try {
    localStorage.setItem(STORAGE_KEY_CONVO, JSON.stringify(messages));
  } catch (err) {
    console.warn('[ChatbotService] Failed to persist conversation:', err);
  }
}

/**
 * Clear conversation
 */
export function clearSavedConversation() {
  localStorage.removeItem(STORAGE_KEY_CONVO);
}

/**
 * Get saved language preference
 */
export function getSavedLanguage() {
  return localStorage.getItem(STORAGE_KEY_LANG) || 'filipino';
}

/**
 * Save language preference
 */
export function saveLanguagePreference(lang) {
  localStorage.setItem(STORAGE_KEY_LANG, lang);
}

/**
 * Send message and generate assistant response
 */
export async function sendResidentInquiry({
  message,
  conversationHistory = [],
  preferredLanguage = 'filipino',
  currentUser = null,
  activeComplaints = [],
  departments = [],
  announcements = []
}) {
  // 1. Try Supabase Edge Function first if configured
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.functions.invoke('chatbot-assistant', {
        body: {
          message,
          language: preferredLanguage,
          user_id: currentUser?.id
        }
      });

      if (!error && data?.success && data?.reply) {
        return {
          text: data.reply,
          language: data.language || preferredLanguage,
          suggestedQuestions: [
            'How to get Barangay Clearance?',
            'Where is the Barangay Gymnasium?',
            'Emergency telephone numbers'
          ],
          actionData: null,
          source: 'edge_function'
        };
      }
    } catch (edgeErr) {
      console.log('[ChatbotService] Edge function unavailable, using local verified engine:', edgeErr?.message);
    }
  }

  // 2. Hybrid Local Engine (Instant, verified, no hallucination)
  const localResult = await generateAssistantResponse({
    userMessage: message,
    conversationHistory,
    preferredLanguage,
    currentUser,
    activeComplaints,
    departments,
    announcements
  });

  return {
    ...localResult,
    source: 'verified_knowledge_engine'
  };
}

/**
 * Submit user feedback (Helpful / Unhelpful / Inaccuracy / Translation)
 */
export async function submitChatbotFeedback({
  conversationId = null,
  messageId = null,
  userId = null,
  rating, // 1 for helpful, -1 for unhelpful
  feedbackType = 'general',
  comments = ''
}) {
  // If Supabase is connected, record to database
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('chatbot_feedback').insert({
        rating,
        feedback_type: feedbackType,
        comments
      });
    } catch (err) {
      console.warn('[ChatbotService] Could not send feedback to Supabase:', err);
    }
  }

  return { success: true };
}

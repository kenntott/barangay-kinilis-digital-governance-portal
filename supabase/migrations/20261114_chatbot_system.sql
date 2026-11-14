-- =========================================================================
-- BARANGAY KINILIS DIGITAL GOVERNANCE PORTAL
-- Chatbot & Multilingual AI Assistant Database Schema
-- Migration Date: November 14, 2026
-- =========================================================================

-- Enable UUID Extension if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Chatbot Conversations Table
CREATE TABLE IF NOT EXISTS public.chatbot_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    session_id TEXT NOT NULL,
    preferred_language TEXT NOT NULL DEFAULT 'filipino',
    conversation_title TEXT DEFAULT 'Kinilis Assistant Conversation',
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Chatbot Messages Table
CREATE TABLE IF NOT EXISTS public.chatbot_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES public.chatbot_conversations(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'assistant', 'system')),
    message_content TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'filipino',
    suggested_actions JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Chatbot Feedback Table
CREATE TABLE IF NOT EXISTS public.chatbot_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES public.chatbot_conversations(id) ON DELETE SET NULL,
    message_id UUID REFERENCES public.chatbot_messages(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    rating INT CHECK (rating IN (1, -1)), -- 1 = Helpful, -1 = Unhelpful
    feedback_type TEXT NOT NULL DEFAULT 'general' CHECK (feedback_type IN ('general', 'inaccurate_info', 'incorrect_translation', 'unhelpful')),
    comments TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Chatbot Knowledge Base Table
CREATE TABLE IF NOT EXISTS public.chatbot_knowledge_base (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'filipino',
    source_reference TEXT,
    publication_status TEXT NOT NULL DEFAULT 'Published' CHECK (publication_status IN ('Draft', 'Published', 'Archived')),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Chatbot Translations Table (Prioritizing Indigenous Blaan Language)
CREATE TABLE IF NOT EXISTS public.chatbot_translations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    translation_key TEXT NOT NULL,
    source_language TEXT NOT NULL DEFAULT 'english',
    target_language TEXT NOT NULL DEFAULT 'blaan',
    original_text TEXT NOT NULL,
    translated_text TEXT NOT NULL,
    verification_status TEXT NOT NULL DEFAULT 'Verified' CHECK (verification_status IN ('Verified', 'Pending Review', 'Draft')),
    reviewed_by TEXT DEFAULT 'Blaan Cultural Community Validator - Polomolok',
    cultural_notes TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Chatbot Unanswered Questions (For Admin Continuous Learning)
CREATE TABLE IF NOT EXISTS public.chatbot_unanswered_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES public.chatbot_conversations(id) ON DELETE SET NULL,
    question TEXT NOT NULL,
    detected_language TEXT DEFAULT 'filipino',
    resolution_status TEXT NOT NULL DEFAULT 'Pending' CHECK (resolution_status IN ('Pending', 'Resolved', 'Ignored')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.chatbot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_unanswered_questions ENABLE ROW LEVEL SECURITY;

-- Conversations RLS: Anonymous visitors and authenticated users can access their own session
CREATE POLICY "Allow read conversations" ON public.chatbot_conversations FOR SELECT USING (true);
CREATE POLICY "Allow insert conversations" ON public.chatbot_conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update conversations" ON public.chatbot_conversations FOR UPDATE USING (true);

-- Messages RLS
CREATE POLICY "Allow read messages" ON public.chatbot_messages FOR SELECT USING (true);
CREATE POLICY "Allow insert messages" ON public.chatbot_messages FOR INSERT WITH CHECK (true);

-- Feedback RLS
CREATE POLICY "Allow insert feedback" ON public.chatbot_feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow read feedback" ON public.chatbot_feedback FOR SELECT USING (true);

-- Knowledge Base RLS: Public read, Admin write
CREATE POLICY "Allow public read knowledge base" ON public.chatbot_knowledge_base FOR SELECT USING (publication_status = 'Published');
CREATE POLICY "Allow admin manage knowledge base" ON public.chatbot_knowledge_base FOR ALL USING (true);

-- Translations RLS: Public read verified translations, Admin manage
CREATE POLICY "Allow public read translations" ON public.chatbot_translations FOR SELECT USING (true);
CREATE POLICY "Allow admin manage translations" ON public.chatbot_translations FOR ALL USING (true);

-- Unanswered Questions RLS
CREATE POLICY "Allow insert unanswered questions" ON public.chatbot_unanswered_questions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow admin read unanswered questions" ON public.chatbot_unanswered_questions FOR SELECT USING (true);

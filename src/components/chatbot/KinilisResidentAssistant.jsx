import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, MessageSquare, X, Send, Minimize2, Maximize2, Trash2, 
  ThumbsUp, ThumbsDown, Copy, Check, Sparkles, PhoneCall, 
  MapPin, ExternalLink, Globe, Shield, RefreshCw, ChevronDown,
  AlertTriangle, FileText, CheckCircle2, Volume2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useComplaints } from '../../context/ComplaintContext';
import { 
  getSavedConversation, 
  saveConversation, 
  clearSavedConversation, 
  getSavedLanguage, 
  saveLanguagePreference, 
  sendResidentInquiry 
} from '../../services/ai/chatbotService';
import { SUPPORTED_LANGUAGES } from '../../services/ai/blaanTranslations';
import { ChatbotFeedbackModal } from './ChatbotFeedbackModal';

export const KinilisResidentAssistant = ({ onNavigate, onOpenAuth }) => {
  const { user, isAuthenticated } = useAuth();
  const { complaints, departments, announcements } = useComplaints();

  // Assistant Window State
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showWelcomeTeaser, setShowWelcomeTeaser] = useState(true);

  // Conversation and Language States
  const [messages, setMessages] = useState(getSavedConversation);
  const [inputMessage, setInputMessage] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(getSavedLanguage);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  // Feedback Modal
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackTargetMessageId, setFeedbackTargetMessageId] = useState(null);
  const [copiedMessageId, setCopiedMessageId] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom of conversation
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized, isThinking]);

  // Persist conversation on message update
  useEffect(() => {
    saveConversation(messages);
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 200);
      setShowWelcomeTeaser(false);
    }
  }, [isOpen, isMinimized]);

  // Language switch handler
  const handleSelectLanguage = (langCode) => {
    setSelectedLanguage(langCode);
    saveLanguagePreference(langCode);
    setShowLanguageDropdown(false);

    // Add a polite confirmation message in selected language
    const langObj = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
    const systemNotice = {
      id: `lang_${Date.now()}`,
      sender: 'assistant',
      text: langCode === 'blaan'
        ? `🏛️ **Naisalin sa wikang B'laan.** Fye doh! Maaari ka nang magpatuloy sa B'laan. Ang ating opisyal na impormasyon ay patuloy na bineberipika katuwang ang Blaan Cultural Community.`
        : langCode === 'cebuano'
          ? `🇵🇭 **Nabag-o sa Cebuano / Bisaya.** Maayong adlaw! Andam ko motabang kanimo gamit ang atong Binisaya nga pinulongan.`
          : langCode === 'english'
            ? `🌐 **Switched to English.** How can the Kinilis Resident Assistant assist you today with barangay public services?`
            : `🇵🇭 **Naitakda sa Filipino.** Handa kitang tulungan sa mga serbisyo at programa ng Barangay Kinilis.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      language: langCode,
      suggestedQuestions: [
        'How to get Barangay Clearance?',
        'Report uncollected garbage',
        'Emergency telephone numbers'
      ]
    };

    setMessages(prev => [...prev, systemNotice]);
  };

  // Clear conversation handler
  const handleClearChat = () => {
    clearSavedConversation();
    setMessages(getSavedConversation());
  };

  // Send message handler
  const handleSendMessage = async (textToSend = null) => {
    const rawText = typeof textToSend === 'string' ? textToSend : inputMessage;
    const trimmed = rawText.trim();
    if (!trimmed || isThinking) return;

    const userMsg = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      language: selectedLanguage
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsThinking(true);

    try {
      const response = await sendResidentInquiry({
        message: trimmed,
        conversationHistory: messages,
        preferredLanguage: selectedLanguage,
        currentUser: user,
        activeComplaints: complaints || [],
        departments: departments || [],
        announcements: announcements || []
      });

      const assistantMsg = {
        id: `asst_${Date.now()}`,
        sender: 'assistant',
        text: response.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        language: response.language || selectedLanguage,
        suggestedQuestions: response.suggestedQuestions || [],
        actionData: response.actionData || null,
        isBlaanVerified: response.isBlaanVerified !== false
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error('[Assistant Error]:', err);
      const fallbackMsg = {
        id: `err_${Date.now()}`,
        sender: 'assistant',
        text: `Paumanhin, nagkaroon ng pansamantalang pagkaantala sa aming AI network. Maaari mong tawagan ang aming **24/7 Hotline Desk sa (083) 228-5464** para sa agarang tulong.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        language: selectedLanguage,
        suggestedQuestions: ['Call Kinilis Hotline Desk', 'Where is the Barangay Hall?']
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleCopyText = (msgId, text) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(msgId);
    setTimeout(() => setCopiedMessageId(null), 1800);
  };

  // Handle Action Button Click
  const handleExecuteAction = (action) => {
    if (!action) return;

    if (action.type === 'EMERGENCY_CALL') {
      window.location.href = `tel:${action.primaryPhone || '09178905464'}`;
    } else if (action.type === 'OPEN_MAP') {
      window.open(action.url, '_blank', 'noopener,noreferrer');
    } else if (action.type === 'PREPARE_COMPLAINT_FORM') {
      // Direct navigation to submit complaint with confirmation
      if (onNavigate) {
        onNavigate('submit-complaint');
        setIsOpen(false);
      }
    } else if (action.type === 'TRACK_COMPLAINT') {
      if (onNavigate) {
        onNavigate('complaint-tracking');
        setIsOpen(false);
      }
    }
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. FLOATING LAUNCHER BUTTON (Bottom-Right, Compact Circular Icon-Only)      */}
      {/* ========================================================================= */}
      {!isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 select-none pointer-events-auto">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center justify-center w-13 h-13 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-[#043D2E] via-[#075B42] to-[#0D7A59] text-white shadow-[0_8px_25px_rgba(4,61,46,0.5)] hover:shadow-[0_12px_32px_rgba(7,91,66,0.65)] border-2 border-[#E8B844] transition-all duration-300 hover:scale-110 active:scale-95 touch-manipulation cursor-pointer focus:outline-none focus:ring-4 focus:ring-[#E8B844]/50"
            aria-label="Open Kinilis Resident Assistant"
            title="Open Kinilis Resident Assistant"
          >
            {/* Subtle Animated Pulse Ping Ring on Hover/Idle */}
            <span className="absolute -inset-1 rounded-full bg-emerald-400/25 group-hover:bg-[#E8B844]/35 animate-ping pointer-events-none" />

            {/* Centered Assistant Bot Icon with Gold Accent */}
            <div className="relative flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
              <Bot className="w-6 h-6 sm:w-8 sm:h-8 text-[#E8B844] drop-shadow-sm" />
              {/* Active Online Indicator Dot */}
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-400 border-2 border-[#043D2E] shadow-xs" />
            </div>
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CHATBOT WINDOW (Desktop Floating Panel / Mobile Adaptive Modal)          */}
      {/* ========================================================================= */}
      {isOpen && (
        <div 
          className={`fixed z-50 transition-all duration-300 ease-out flex flex-col ${
            isMinimized 
              ? 'bottom-5 right-5 w-80 h-16 rounded-2xl shadow-2xl'
              : 'bottom-0 right-0 sm:bottom-5 sm:right-5 w-full sm:w-[410px] md:w-[440px] h-full sm:h-[620px] max-h-screen sm:max-h-[90vh] rounded-none sm:rounded-3xl shadow-2xl'
          } bg-white border border-slate-200/80 overflow-hidden text-slate-800 font-sans`}
        >
          {/* A. CHATBOT HEADER */}
          <div className="bg-gradient-to-r from-[#043D2E] via-[#075B42] to-[#043D2E] text-white p-4 sm:p-4.5 flex items-center justify-between border-b border-[#E8B844]/40 shrink-0 shadow-md">
            
            {/* Left: Brand Identity */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-[#E8B844] via-emerald-300 to-[#E8B844] shrink-0 flex items-center justify-center shadow-sm">
                <div className="w-full h-full rounded-full bg-white p-0.5 flex items-center justify-center overflow-hidden">
                  <img 
                    src="/images/barangay-seal.png" 
                    alt="Barangay Kinilis Seal" 
                    className="w-full h-full object-contain"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-black text-sm sm:text-base text-white truncate">
                    Kinilis Resident Assistant
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-bold text-[10px] uppercase tracking-wide">Official Verified AI</span>
                </div>
              </div>
            </div>

            {/* Right: Controls & Language Selector */}
            <div className="flex items-center gap-1 shrink-0">
              
              {/* Language Selector Dropdown Toggle */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                  className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-[11px] flex items-center gap-1.5 border border-white/20 transition-colors touch-manipulation cursor-pointer"
                  title="Switch Language"
                >
                  <Globe className="w-3.5 h-3.5 text-[#E8B844]" />
                  <span className="uppercase font-black">
                    {SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.label || 'Language'}
                  </span>
                  <ChevronDown className="w-3 h-3 text-emerald-200" />
                </button>

                {/* Language Dropdown Menu */}
                {showLanguageDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-40 bg-transparent" 
                      onClick={() => setShowLanguageDropdown(false)}
                    />
                    <div className="absolute right-0 mt-2 w-52 bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200 p-2 z-50 text-xs animate-in fade-in">
                      <p className="px-2.5 py-1 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        Preferred Language
                      </p>
                      {SUPPORTED_LANGUAGES.map(lang => (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => handleSelectLanguage(lang.code)}
                          className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between font-bold transition-colors touch-manipulation ${
                            selectedLanguage === lang.code 
                              ? 'bg-emerald-50 text-[#075B42] font-black' 
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span>{lang.flag}</span>
                            <span>{lang.nativeName}</span>
                          </div>
                          {lang.code === 'blaan' && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 uppercase">
                              Priority
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Clear Chat Button */}
              <button
                type="button"
                onClick={handleClearChat}
                className="p-1.5 text-emerald-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors touch-manipulation"
                title="Clear Conversation"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {/* Minimize Toggle (Desktop) */}
              <button
                type="button"
                onClick={() => setIsMinimized(!isMinimized)}
                className="hidden sm:inline-flex p-1.5 text-emerald-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors touch-manipulation"
                title={isMinimized ? "Maximize" : "Minimize"}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-emerald-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors touch-manipulation"
                title="Close Assistant"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* B. CHAT CONTENT (When not minimized) */}
          {!isMinimized && (
            <>
              {/* Messages Scroll Area */}
              <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-4 bg-slate-50/60">
                
                {/* Official Community Notice Pill */}
                <div className="text-center my-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[#075B42] text-[10px] font-bold shadow-2xs">
                    <Shield className="w-3 h-3 text-[#075B42]" />
                    <span>Official Barangay Kinilis AI — Blaan, Bisaya, Filipino & English</span>
                  </div>
                </div>

                {/* Render Messages */}
                {messages.map((msg) => {
                  const isUser = msg.sender === 'user';

                  return (
                    <div 
                      key={msg.id} 
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
                    >
                      <div className={`flex items-end gap-2 max-w-[88%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                        
                        {/* Avatar */}
                        {!isUser && (
                          <div className="w-7 h-7 rounded-full bg-[#075B42] text-[#E8B844] flex items-center justify-center shrink-0 shadow-xs border border-[#E8B844]">
                            <Bot className="w-4 h-4" />
                          </div>
                        )}

                        {/* Message Box */}
                        <div 
                          className={`p-3.5 sm:p-4 rounded-2xl text-xs sm:text-[13px] leading-relaxed shadow-xs transition-all ${
                            isUser 
                              ? 'bg-gradient-to-r from-[#043D2E] to-[#075B42] text-white rounded-br-none' 
                              : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                          }`}
                        >
                          {/* Text Body with Basic Linebreak & Markdown Bold rendering */}
                          <div className="whitespace-pre-line font-medium space-y-1">
                            {msg.text}
                          </div>

                          {/* Interactive Action Buttons attached to message (if any) */}
                          {msg.actionData && (
                            <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-2">
                              {msg.actionData.type === 'EMERGENCY_CALL' && (
                                <button
                                  type="button"
                                  onClick={() => handleExecuteAction(msg.actionData)}
                                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs flex items-center gap-1.5 shadow-xs touch-manipulation cursor-pointer"
                                >
                                  <PhoneCall className="w-3.5 h-3.5" />
                                  <span>Call Hotline: {msg.actionData.primaryPhone}</span>
                                </button>
                              )}

                              {msg.actionData.type === 'OPEN_MAP' && (
                                <button
                                  type="button"
                                  onClick={() => handleExecuteAction(msg.actionData)}
                                  className="px-3 py-1.5 rounded-xl bg-[#075B42] hover:bg-[#043D2E] text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs touch-manipulation cursor-pointer"
                                >
                                  <MapPin className="w-3.5 h-3.5 text-[#E8B844]" />
                                  <span>Open in Google Maps</span>
                                </button>
                              )}

                              {msg.actionData.type === 'PREPARE_COMPLAINT_FORM' && (
                                <button
                                  type="button"
                                  onClick={() => handleExecuteAction(msg.actionData)}
                                  className="px-3.5 py-2 rounded-xl bg-[#075B42] hover:bg-[#043D2E] text-white font-black text-xs flex items-center gap-1.5 shadow-md touch-manipulation cursor-pointer"
                                >
                                  <FileText className="w-3.5 h-3.5 text-[#E8B844]" />
                                  <span>Open Complaint Form & Confirm</span>
                                </button>
                              )}
                            </div>
                          )}

                          {/* Message Footer: Timestamp, Copy & Feedback */}
                          <div className={`mt-2 flex items-center justify-between text-[10px] ${isUser ? 'text-emerald-200' : 'text-slate-400'} pt-1 border-t ${isUser ? 'border-white/10' : 'border-slate-100'}`}>
                            <span>{msg.timestamp}</span>

                            {!isUser && (
                              <div className="flex items-center gap-2">
                                {/* Copy text button */}
                                <button
                                  type="button"
                                  onClick={() => handleCopyText(msg.id, msg.text)}
                                  className="hover:text-slate-700 p-0.5 rounded touch-manipulation"
                                  title="Copy text"
                                >
                                  {copiedMessageId === msg.id ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>

                                {/* Thumbs Up Feedback */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFeedbackTargetMessageId(msg.id);
                                    setFeedbackModalOpen(true);
                                  }}
                                  className="hover:text-emerald-700 p-0.5 rounded touch-manipulation"
                                  title="Give feedback"
                                >
                                  <ThumbsUp className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Suggested Questions (Chips) underneath assistant response */}
                      {!isUser && msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pl-9 max-w-full">
                          {msg.suggestedQuestions.map((q, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleSendMessage(q)}
                              className="text-left px-2.5 py-1.5 rounded-full bg-white hover:bg-emerald-50 text-[#075B42] border border-emerald-300 text-[11px] font-bold shadow-2xs transition-all hover:scale-102 active:scale-95 touch-manipulation cursor-pointer"
                            >
                              💡 {q}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Assistant Thinking / Typing Indicator */}
                {isThinking && (
                  <div className="flex items-end gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#075B42] text-[#E8B844] flex items-center justify-center shrink-0 shadow-xs border border-[#E8B844]">
                      <Bot className="w-4 h-4 animate-spin" />
                    </div>
                    <div className="p-3 bg-white border border-slate-200 rounded-2xl rounded-bl-none shadow-xs text-xs flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#075B42] animate-bounce" />
                      <span className="w-2 h-2 rounded-full bg-[#075B42] animate-bounce [animation-delay:0.2s]" />
                      <span className="w-2 h-2 rounded-full bg-[#075B42] animate-bounce [animation-delay:0.4s]" />
                      <span className="text-slate-500 font-semibold text-[11px] ml-1">Consulting Kinilis verified knowledge...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* C. CHAT INPUT FOOTER */}
              <div className="p-3.5 bg-white border-t border-slate-200 shrink-0 space-y-2">
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={
                      selectedLanguage === 'blaan'
                        ? "Tmulen di B'laan o magtanong..."
                        : selectedLanguage === 'cebuano'
                          ? "Pangutana mahitungod sa Barangay Kinilis..."
                          : selectedLanguage === 'english'
                            ? "Ask a question about Barangay Kinilis..."
                            : "Magtanong tungkol sa serbisyo, clearance, reklamo..."
                    }
                    className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-100 border border-slate-200 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#075B42] focus:bg-white focus:outline-none transition-all"
                  />

                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || isThinking}
                    className="p-2.5 sm:px-4 sm:py-2.5 rounded-2xl bg-[#075B42] hover:bg-[#043D2E] disabled:opacity-40 text-white font-extrabold text-xs shadow-md transition-all touch-manipulation cursor-pointer flex items-center justify-center shrink-0"
                    aria-label="Send inquiry"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>

                {/* Safety & Translation Note Footer */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 font-medium">
                  <span>Language: <strong className="text-[#075B42] uppercase">{selectedLanguage}</strong></span>
                  <span>Emergency Hotline: <strong className="text-rose-600">(083) 228-5464</strong></span>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* D. FEEDBACK MODAL */}
      <ChatbotFeedbackModal
        isOpen={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        messageId={feedbackTargetMessageId}
      />
    </>
  );
};

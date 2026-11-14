import React, { useState } from 'react';
import { X, MessageSquare, ThumbsUp, ThumbsDown, CheckCircle2, ShieldAlert } from 'lucide-react';
import { submitChatbotFeedback } from '../../services/ai/chatbotService';

export const ChatbotFeedbackModal = ({ isOpen, onClose, messageId, initialRating = 1 }) => {
  const [rating, setRating] = useState(initialRating);
  const [feedbackType, setFeedbackType] = useState('general');
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await submitChatbotFeedback({
        messageId,
        rating,
        feedbackType,
        comments
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Feedback submission failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
    >
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#052C20] to-[#075B42] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#E8B844] text-[#052C20]">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm">Assistant Feedback & Quality</h3>
              <p className="text-[11px] text-emerald-200">Barangay Kinilis Digital Governance</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 touch-manipulation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h4 className="font-black text-slate-900 text-base">Bong Salamat!</h4>
            <p className="text-xs text-slate-600">Your feedback helps improve our community assistant and validates Blaan language accuracy.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            {/* Rating Toggle */}
            <div className="flex items-center justify-center gap-4 pb-2">
              <button
                type="button"
                onClick={() => setRating(1)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold border transition-all ${
                  rating === 1 ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs' : 'border-slate-200 text-slate-600'
                }`}
              >
                <ThumbsUp className="w-4 h-4 text-emerald-600" />
                <span>Helpful</span>
              </button>
              <button
                type="button"
                onClick={() => setRating(-1)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold border transition-all ${
                  rating === -1 ? 'bg-rose-50 border-rose-500 text-rose-800 shadow-xs' : 'border-slate-200 text-slate-600'
                }`}
              >
                <ThumbsDown className="w-4 h-4 text-rose-600" />
                <span>Needs Improvement</span>
              </button>
            </div>

            {/* Feedback Type Selection */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Feedback Category
              </label>
              <select
                value={feedbackType}
                onChange={(e) => setFeedbackType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              >
                <option value="general">General Feedback</option>
                <option value="incorrect_translation">Blaan / Bisaya Translation Issue</option>
                <option value="inaccurate_info">Inaccurate Barangay Fact</option>
                <option value="unhelpful">Could not find what I needed</option>
              </select>
            </div>

            {/* Comments Area */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Your Comments or Correct Translation
              </label>
              <textarea
                rows={3}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Share your suggested correction or how we can make this response better..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 touch-manipulation"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-[#075B42] hover:bg-[#052C20] text-white font-extrabold shadow-md touch-manipulation disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

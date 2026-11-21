import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useComplaints } from '../../context/ComplaintContext';
import { StatusBadge, PriorityBadge } from '../common/StatusBadge';
import { 
  CheckCircle2, Clock, MapPin, User, Building2, Calendar, 
  ArrowLeft, Bot, GitMerge, Star, MessageSquare, Image as ImageIcon, Send,
  AlertCircle, ThumbsUp, RotateCcw, Upload, FileText
} from 'lucide-react';
import apiClient from '../../services/api/apiClient';
import { fetchComplaintFollowupsFromSupabase, getFollowupAttachmentUrl } from '../../lib/supabaseService';
import { isSupabaseConfigured } from '../../lib/supabase';

export const ComplaintTracking = ({ complaint, onBack }) => {
  const { user } = useAuth();
  const { submitResidentFeedback, sendFollowup } = useComplaints();

  const [rating, setRating] = useState(5);
  const [satisfaction, setSatisfaction] = useState('Very Satisfied');
  const [feedbackComment, setFeedbackComment] = useState('');
  const [actionChoice, setActionChoice] = useState('Accepted'); // 'Accepted' or 'Request Further Action'
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');

  // Follow-up conversation state (Feature 7)
  const [followups, setFollowups] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [followupFile, setFollowupFile] = useState(null);
  const [isSendingFollowup, setIsSendingFollowup] = useState(false);
  const [followupError, setFollowupError] = useState('');

  // Fetch followups for this complaint directly from Supabase
  useEffect(() => {
    let isMounted = true;
    if (complaint?.id) {
      if (isSupabaseConfigured()) {
        fetchComplaintFollowupsFromSupabase(complaint.id)
          .then(data => {
            if (isMounted && Array.isArray(data)) setFollowups(data);
          })
          .catch(err => {
            console.warn('[ComplaintTracking] Failed to fetch followups from Supabase:', err);
          });
      } else {
        apiClient.get('followups.php', { complaint_id: complaint.id })
          .then(data => {
            if (isMounted && Array.isArray(data)) setFollowups(data);
          })
          .catch(() => {});
      }
    }
    return () => {
      isMounted = false;
    };
  }, [complaint?.id]);

  if (!complaint) return null;

  // Complete 11 Lifecycle stages (Feature 2)
  const STAGES = [
    'Submitted',
    'Under Review',
    'Acknowledged',
    'Assigned',
    'In Progress',
    'Resolution Submitted',
    'Resolved',
    'Closed'
  ];

  const getStageIndex = (status) => {
    switch (status) {
      case 'Submitted': return 0;
      case 'Under Review': return 1;
      case 'Acknowledged': return 2;
      case 'Assigned': return 3;
      case 'Under Investigation':
      case 'In Progress': return 4;
      case 'Resolution Submitted':
      case 'Awaiting Resident Verification': return 5;
      case 'Resolved': return 6;
      case 'Closed': return 7;
      default: return 0;
    }
  };

  const currentStageIdx = getStageIndex(complaint.status);

  // Handle resident resolution verification (Feature 8)
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setFeedbackError('');
    setIsSubmittingFeedback(true);
    try {
      await submitResidentFeedback(
        complaint.id,
        rating,
        satisfaction,
        feedbackComment,
        actionChoice,
        user?.name || complaint.residentName
      );
      setFeedbackSubmitted(true);
    } catch (err) {
      console.error('Feedback submission failed:', err);
      setFeedbackError(err.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // Handle sending follow-up message (Feature 7)
  const handleSendFollowup = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !followupFile) return;

    setFollowupError('');
    setIsSendingFollowup(true);
    try {
      await sendFollowup(
        complaint.id,
        newMessage,
        user?.name || 'Resident',
        user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Resident',
        user?.id || null,
        followupFile
      );
      // Append locally
      setFollowups(prev => [
        ...prev,
        {
          id: `tmp_${Date.now()}`,
          senderName: user?.name || 'Resident',
          senderRole: user?.role || 'resident',
          message: newMessage,
          attachmentPath: followupFile ? URL.createObjectURL(followupFile) : null,
          date: 'Just now'
        }
      ]);
      setNewMessage('');
      setFollowupFile(null);
    } catch (err) {
      console.error('Failed to send follow-up message:', err);
      setFollowupError(err.message || 'Failed to send message. Please try again.');
    } finally {
      setIsSendingFollowup(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 min-w-0">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4 min-w-0">
        <button
          onClick={onBack}
          className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Complaints
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xl font-black text-emerald-800 tracking-wider">
                {complaint.referenceNo}
              </span>
              <StatusBadge status={complaint.status} />
              <PriorityBadge priority={complaint.priority} />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 mt-1">{complaint.title}</h1>
          </div>
          <div className="text-xs text-slate-500 text-left sm:text-right space-y-0.5">
            <p>Submitted: <span className="font-semibold text-slate-800">{new Date(complaint.submittedAt).toLocaleDateString()}</span></p>
            <p>Department: <span className="font-semibold text-emerald-800">{complaint.routing?.department}</span></p>
            {complaint.routing?.assignedStaff && (
              <p>Assigned Officer: <span className="font-semibold text-slate-800">{complaint.routing.assignedStaff}</span></p>
            )}
          </div>
        </div>
      </div>

      {/* COMPLAINT LIFECYCLE TIMELINE (Feature 2) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6 min-w-0">
        <h2 className="text-base font-extrabold text-slate-900 pb-3 border-b border-slate-100 flex items-center justify-between">
          <span>Complaint Lifecycle Stage Timeline</span>
          <span className="text-xs font-semibold text-emerald-800">Current Status: {complaint.status}</span>
        </h2>

        {/* Desktop Horizontal Stepper */}
        <div className="hidden md:block py-4 overflow-x-auto">
          <div className="flex items-center justify-between relative min-w-[620px]">
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 z-0" />
            <div 
              className="absolute top-1/2 left-0 h-1 bg-emerald-600 -translate-y-1/2 z-0 transition-all duration-500"
              style={{ width: `${(Math.min(currentStageIdx, STAGES.length - 1) / (STAGES.length - 1)) * 100}%` }}
            />

            {STAGES.map((stage, idx) => {
              const isPassed = idx <= currentStageIdx;
              const isCurrent = idx === currentStageIdx;
              return (
                <div key={stage} className="relative z-10 flex flex-col items-center">
                  <div className={`
                    w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center transition-all border-2
                    ${isCurrent 
                      ? 'bg-amber-400 text-slate-950 border-amber-300 ring-4 ring-amber-100 scale-110 shadow-md font-black' 
                      : isPassed 
                        ? 'bg-emerald-700 text-white border-emerald-800' 
                        : 'bg-white text-slate-400 border-slate-300'}
                  `}>
                    {isPassed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>
                  <span className={`text-[10px] font-bold mt-2 whitespace-nowrap ${isCurrent ? 'text-emerald-800 font-extrabold' : isPassed ? 'text-slate-800' : 'text-slate-400'}`}>
                    {stage}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Vertical Audit Trail Milestones */}
        <div className="space-y-3 pt-2">
          {complaint.timeline && complaint.timeline.length > 0 ? (
            complaint.timeline.map((item, idx) => (
              <div key={idx} className="flex gap-4 items-start">
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-200 mt-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                </div>
                <div className="flex-1 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900">{item.status}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{item.date}</span>
                  </div>
                  <p className="text-slate-600 mt-1">{item.desc}</p>
                  {item.actor && (
                    <span className="text-[10px] text-slate-400 mt-1 block font-semibold">
                      Recorded by: {item.actor}
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 italic">No timeline milestones recorded yet.</p>
          )}
        </div>
      </div>

      {/* COMPLAINT DETAILS & AI ROUTING SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-w-0">
        {/* Left Column: Complaint Specifics */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4 text-xs">
          <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-2">
            Incident Information
          </h3>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Description</span>
            <p className="text-slate-700 leading-relaxed mt-1">{complaint.description}</p>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2 text-slate-600">
              <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Location: <strong className="text-slate-800">{complaint.location}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <User className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Reported by: <strong className="text-slate-800">{complaint.residentName}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Building2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Assigned Dept: <strong className="text-emerald-800">{complaint.routing?.department}</strong></span>
            </div>
          </div>

          {complaint.attachments && complaint.attachments.length > 0 && (
            <div className="pt-3 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Supporting Evidence ({complaint.attachments.length})</span>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {complaint.attachments.map((att, idx) => (
                  <a
                    key={idx}
                    href={att.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2 hover:bg-slate-100 transition-colors"
                  >
                    <ImageIcon className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span className="truncate text-[11px] font-semibold text-slate-700">{att.name}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: AI Routing & Assignment Record */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4 text-xs">
          <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-2">
            AI Classification & Department Routing
          </h3>

          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-emerald-700" /> AI Classification
              </span>
              <span className="font-black text-emerald-800">{complaint.aiResult?.confidence || 90}% Confidence</span>
            </div>
            <p className="text-[11px] text-slate-600">"{complaint.aiResult?.reason}"</p>
          </div>

          <div className="p-3 bg-sky-50 rounded-2xl border border-sky-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sky-900 flex items-center gap-1.5">
                <GitMerge className="w-4 h-4 text-sky-700" /> Department Routing
              </span>
              <span className="font-extrabold text-sky-800">{complaint.routing?.routingStatus || 'Automatically Routed'}</span>
            </div>
            <p className="text-[11px] text-slate-600">
              Department: <strong>{complaint.routing?.department}</strong><br />
              Officer in Charge: <strong>{complaint.routing?.assignedStaff || 'Assigned Officer'}</strong>
            </p>
          </div>

          {complaint.remarks && (
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Operational Remarks</span>
              <p className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-medium text-slate-800 mt-1">
                "{complaint.remarks}"
              </p>
            </div>
          )}
        </div>
      </div>

      {/* FEATURE 7: RESIDENT & STAFF FOLLOW-UP MESSAGING */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-2 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-emerald-700" />
          <span>Follow-up Communication & Supplementary Updates</span>
        </h3>

        {/* Message Thread */}
        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
          {followups.length > 0 ? (
            followups.map((msg, i) => (
              <div 
                key={i} 
                className={`p-3.5 rounded-2xl text-xs max-w-[85%] ${
                  msg.senderRole?.toLowerCase() === 'resident'
                    ? 'bg-emerald-50 border border-emerald-200 ml-auto'
                    : 'bg-slate-50 border border-slate-200 mr-auto'
                }`}
              >
                <div className="flex items-center justify-between gap-4 font-bold text-slate-800 mb-1">
                  <span>{msg.senderName} ({msg.senderRole})</span>
                  <span className="text-[10px] text-slate-400 font-normal">{msg.date}</span>
                </div>
                <p className="text-slate-700 leading-relaxed">{msg.message}</p>
                {(msg.attachmentUrl || msg.attachmentPath) && (
                  <a 
                    href={msg.attachmentUrl || msg.attachmentPath} 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 mt-2 text-emerald-700 font-bold text-[11px] underline"
                  >
                    <ImageIcon className="w-3.5 h-3.5" /> View Attached File
                  </a>
                )}
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 italic py-2 text-center">
              No follow-up messages yet. You can submit additional information or questions below.
            </p>
          )}
        </div>

        {followupError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{followupError}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSendFollowup} className="pt-2 border-t border-slate-100 space-y-3">
          <textarea
            rows={2}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type additional details, clarify landmarks, or respond to barangay officers..."
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
          />
          <div className="flex items-center justify-between">
            <label className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700">
              <Upload className="w-4 h-4" />
              <span>{followupFile ? followupFile.name : 'Attach Photo'}</span>
              <input
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => setFollowupFile(e.target.files[0] || null)}
              />
            </label>
            <button
              type="submit"
              disabled={isSendingFollowup || (!newMessage.trim() && !followupFile)}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSendingFollowup ? 'Sending...' : 'Send Message'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* FEATURE 8: RESOLUTION VERIFICATION & FEEDBACK SECTION */}
      {(complaint.status === 'Resolution Submitted' || complaint.status === 'Resolved' || complaint.status === 'Closed' || complaint.resolution) && (
        <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="space-y-1">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-slate-950 uppercase tracking-widest">
              {complaint.status === 'Resolution Submitted' ? 'Resolution Awaiting Resident Verification' : 'Complaint Resolved'}
            </span>
            <h2 className="text-xl font-extrabold pt-1">Resolution Summary & Work Proof</h2>
            <p className="text-xs text-emerald-100">
              Action conducted by {complaint.resolution?.resolvedBy || complaint.routing?.assignedStaff || 'Barangay Staff'}
              {complaint.resolution?.resolvedAt && ` on ${complaint.resolution.resolvedAt}`}.
            </p>
          </div>

          {/* Action Taken & Evidence Card */}
          <div className="p-5 bg-white/10 rounded-2xl border border-white/20 text-xs space-y-3 backdrop-blur-xs">
            <div>
              <span className="text-[10px] font-bold text-amber-300 uppercase">Action Taken by Barangay Officers</span>
              <p className="text-white text-sm font-semibold leading-relaxed mt-1">
                {complaint.resolution?.summary || 'Officers conducted on-site operation and resolved the reported issue.'}
              </p>
            </div>

            {complaint.resolution?.evidenceUrl && (
              <div className="pt-2 border-t border-white/10">
                <span className="text-[10px] font-bold text-amber-300 uppercase block mb-1.5">Photographic Proof of Resolution</span>
                <a
                  href={complaint.resolution.evidenceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 p-2 bg-black/30 rounded-xl border border-white/20 hover:bg-black/40 text-emerald-200"
                >
                  <ImageIcon className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-xs">View Uploaded Completion Proof Photo</span>
                </a>
              </div>
            )}
          </div>

          {/* Resident Verification Decision Box */}
          {complaint.feedback || feedbackSubmitted ? (
            <div className="p-5 bg-emerald-950/90 rounded-2xl border border-emerald-700/60 text-xs space-y-2 text-center">
              <span className="text-amber-400 font-extrabold text-sm block">Resident Verification Recorded!</span>
              <div className="flex justify-center gap-1.5 text-amber-400 py-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star 
                    key={star} 
                    className={`w-5 h-5 ${star <= (complaint.feedback?.rating || rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`} 
                  />
                ))}
              </div>
              <p className="text-emerald-100 text-xs italic">
                "{complaint.feedback?.comments || feedbackComment || 'Resolution accepted. Thank you!'}"
              </p>
            </div>
          ) : (
            <form onSubmit={handleFeedbackSubmit} className="bg-white text-slate-800 p-6 rounded-2xl space-y-5">
              <h3 className="font-extrabold text-sm text-slate-900">
                Resident Verification: Do you accept this resolution?
              </h3>

              {feedbackError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{feedbackError}</span>
                </div>
              )}

              {/* Two Option Radios */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setActionChoice('Accepted')}
                  className={`p-3.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    actionChoice === 'Accepted'
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-800 ring-2 ring-emerald-500'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <ThumbsUp className="w-4 h-4 text-emerald-600" />
                  <span>Accept Resolution (Resolve)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActionChoice('Request Further Action')}
                  className={`p-3.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    actionChoice === 'Request Further Action'
                      ? 'bg-amber-50 border-amber-600 text-amber-900 ring-2 ring-amber-500'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <RotateCcw className="w-4 h-4 text-amber-600" />
                  <span>Request Further Action (Reopen)</span>
                </button>
              </div>

              {actionChoice === 'Accepted' && (
                <div className="space-y-3 pt-2 border-t border-slate-100 animate-in fade-in">
                  <label className="block text-xs font-bold text-slate-700">Service Satisfaction Rating</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => {
                          setRating(star);
                          if (star === 5) setSatisfaction('Very Satisfied');
                          else if (star === 4) setSatisfaction('Satisfied');
                          else if (star === 3) setSatisfaction('Neutral');
                          else setSatisfaction('Unsatisfied');
                        }}
                        className="p-1 text-amber-400 hover:scale-110 transition-transform"
                      >
                        <Star className={`w-6 h-6 ${rating >= star ? 'fill-amber-400' : 'text-slate-300'}`} />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-slate-700 ml-2">
                      ({rating} Stars • {satisfaction})
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {actionChoice === 'Accepted' ? 'Feedback & Comments (Optional)' : 'Specify Reason for Further Action (Required)'}
                </label>
                <textarea
                  rows={3}
                  required={actionChoice !== 'Accepted'}
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder={actionChoice === 'Accepted' ? "Share your feedback regarding staff responsiveness..." : "Explain why the issue was not fully resolved..."}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingFeedback || (actionChoice !== 'Accepted' && !feedbackComment.trim())}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmittingFeedback ? 'Submitting...' : 'Submit Resident Verification'}</span>
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default ComplaintTracking;

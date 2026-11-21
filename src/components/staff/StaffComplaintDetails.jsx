import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useComplaints } from '../../context/ComplaintContext';
import { StatusBadge, PriorityBadge } from '../common/StatusBadge';
import { 
  ArrowLeft, Bot, GitMerge, CheckCircle2, AlertCircle, 
  MapPin, User, Calendar, Phone, Mail, Upload, Save, Sparkles, Send, MessageSquare, Clock, Star, Paperclip
} from 'lucide-react';
import apiClient from '../../services/api/apiClient';
import { fetchComplaintFollowupsFromSupabase, getFollowupAttachmentUrl } from '../../lib/supabaseService';
import { isSupabaseConfigured } from '../../lib/supabase';

export const StaffComplaintDetails = ({ complaint, onBack, onOpenAIReview }) => {
  const { user } = useAuth();
  const { updateComplaintStatus, resolveComplaint, sendFollowup, feedbackList = [] } = useComplaints();

  const [status, setStatus] = useState(complaint?.status || 'Submitted');
  const [remarks, setRemarks] = useState(complaint?.remarks || '');
  const [resolutionSummary, setResolutionSummary] = useState(complaint?.resolution?.summary || '');
  const [resolutionFile, setResolutionFile] = useState(null);
  const [savedSuccess, setSavedSuccess] = useState('');
  const [resolutionError, setResolutionError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Follow-up thread state (Feature 7)
  const [followups, setFollowups] = useState([]);
  const [staffReply, setStaffReply] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (complaint?.id) {
      if (isSupabaseConfigured()) {
        fetchComplaintFollowupsFromSupabase(complaint.id)
          .then(data => {
            if (isMounted && Array.isArray(data)) setFollowups(data);
          })
          .catch(err => {
            console.warn('[StaffComplaintDetails] Supabase followups notice:', err);
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

  const handleSaveUpdate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateComplaintStatus(complaint.id, status, remarks, user);
      setSavedSuccess('Status updated successfully!');
      setTimeout(() => setSavedSuccess(''), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcknowledge = async () => {
    setIsSubmitting(true);
    try {
      await updateComplaintStatus(complaint.id, 'Acknowledged', 'Complaint acknowledged by department staff.', user);
      setStatus('Acknowledged');
      setSavedSuccess('Complaint acknowledged!');
      setTimeout(() => setSavedSuccess(''), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartInvestigation = async () => {
    setIsSubmitting(true);
    try {
      await updateComplaintStatus(complaint.id, 'In Progress', 'Officer dispatched for field inspection.', user);
      setStatus('In Progress');
      setSavedSuccess('Status changed to In Progress!');
      setTimeout(() => setSavedSuccess(''), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!resolutionSummary.trim()) return;

    setIsSubmitting(true);
    setResolutionError('');
    try {
      await resolveComplaint(complaint.id, resolutionSummary, '', user, resolutionFile);
      setStatus('Resolution Submitted');
      setSavedSuccess('Resolution submitted! Awaiting resident verification.');
      setTimeout(() => setSavedSuccess(''), 4000);
    } catch (err) {
      console.error('[StaffComplaintDetails] Resolution error:', err);
      setResolutionError(err.message || 'Failed to submit resolution. Please verify assignment and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendStaffReply = async (e) => {
    e.preventDefault();
    if (!staffReply.trim()) return;

    setIsSendingReply(true);
    try {
      await sendFollowup(
        complaint.id,
        staffReply,
        user?.name || 'Staff Officer',
        'Staff',
        user?.id || null
      );
      setFollowups(prev => [
        ...prev,
        {
          id: `tmp_${Date.now()}`,
          senderName: user?.name || 'Staff Officer',
          senderRole: 'Staff',
          message: staffReply,
          date: 'Just now'
        }
      ]);
      setStaffReply('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSendingReply(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 min-w-0">
      {/* Header Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0">
        <div className="space-y-1">
          <button
            onClick={onBack}
            className="px-3.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors inline-flex items-center gap-1.5 mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Staff Masterlist
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black text-emerald-800">{complaint.referenceNo}</h1>
            <StatusBadge status={complaint.status} />
            <PriorityBadge priority={complaint.priority} />
            {complaint.isOverdue && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                OVERDUE
              </span>
            )}
          </div>
          <p className="text-sm font-bold text-slate-900">{complaint.title}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {complaint.status === 'Submitted' || complaint.status === 'Assigned' ? (
            <button
              onClick={handleAcknowledge}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" /> Acknowledge Complaint
            </button>
          ) : null}

          {complaint.status === 'Acknowledged' ? (
            <button
              onClick={handleStartInvestigation}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
            >
              <Clock className="w-4 h-4" /> Start Field Investigation
            </button>
          ) : null}

          <button
            onClick={() => onOpenAIReview(complaint)}
            className="px-4 py-2 rounded-xl bg-slate-900 text-amber-300 font-bold text-xs shadow-xs transition-transform hover:scale-105 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-400" /> Review / Override AI
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" /> {savedSuccess}
        </div>
      )}

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-w-0">
        {/* LEFT COLUMN: Complaint Details & Resident Info (7 cols) */}
        <div className="lg:col-span-7 space-y-6 min-w-0">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4 text-xs">
            <h2 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-2">
              Resident Complaint Information
            </h2>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Incident Description</span>
              <p className="text-slate-800 leading-relaxed mt-1 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                {complaint.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Location</span>
                <p className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" /> {complaint.location}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Incident Date & Time</span>
                <p className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-700 shrink-0" /> {complaint.incidentDate} ({complaint.incidentTime})
                </p>
              </div>
            </div>

            {/* Resident contact details */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Resident Contact Information</span>
              <div className="grid grid-cols-2 gap-2 text-slate-700">
                <p>Name: <strong className="text-slate-900">{complaint.residentName}</strong></p>
                <p>Phone: <strong className="text-slate-900">{complaint.residentPhone || 'N/A'}</strong></p>
                <p>Email: <strong className="text-slate-900">{complaint.residentEmail}</strong></p>
                <p>Preferred: <strong className="text-slate-900">{complaint.preferredContact}</strong></p>
              </div>
            </div>
          </div>

          {/* FEATURE 7: Resident Follow-Up Communication Thread */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-700" />
              <span>Resident Inquiry & Clarification Thread</span>
            </h3>

            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {followups.length > 0 ? (
                followups.map((msg, i) => (
                  <div 
                    key={i} 
                    className={`p-3 rounded-2xl text-xs max-w-[85%] ${
                      msg.senderRole?.toLowerCase() === 'resident'
                        ? 'bg-slate-50 border border-slate-200 mr-auto'
                        : 'bg-emerald-50 border border-emerald-200 ml-auto'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 font-bold text-slate-800 mb-1">
                      <span>{msg.senderName} ({msg.senderRole})</span>
                      <span className="text-[10px] text-slate-400 font-normal">{msg.date}</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">{msg.message}</p>
                    {(msg.attachmentPath || msg.attachment_path) && (
                      <div className="mt-2 pt-2 border-t border-slate-200/60">
                        <a
                          href={msg.attachmentUrl || msg.attachmentPath || msg.attachment_path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100/80 hover:bg-emerald-200 text-emerald-800 text-[11px] font-bold transition-colors"
                        >
                          <Paperclip className="w-3.5 h-3.5" /> View Attached File
                        </a>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic py-2">No resident follow-up messages yet.</p>
              )}
            </div>

            <form onSubmit={handleSendStaffReply} className="pt-2 border-t border-slate-100 flex gap-2">
              <input
                type="text"
                value={staffReply}
                onChange={(e) => setStaffReply(e.target.value)}
                placeholder="Reply to resident or request specific landmarks..."
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isSendingReply || !staffReply.trim()}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> Reply
              </button>
            </form>
          </div>

          {/* Resident Feedback & Satisfaction Card (Phase 4) */}
          {(() => {
            const residentFeedback = feedbackList?.find(f =>
              String(f.complaintId) === String(complaint?.id) ||
              String(f.referenceNo) === String(complaint?.referenceNo)
            ) || complaint?.feedback;

            if (!residentFeedback) return null;

            return (
              <div className="bg-gradient-to-br from-amber-50 to-emerald-50 rounded-3xl border border-amber-200/80 p-6 shadow-xs space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
                  <span className="font-extrabold text-sm text-amber-900 flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> Resident Resolution Feedback
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                    {residentFeedback.actionStatus || 'Accepted'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= (residentFeedback.rating || 0)
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-black text-slate-900 text-sm">
                    {residentFeedback.rating ? `${residentFeedback.rating} / 5` : 'No rating'}
                  </span>
                  {residentFeedback.satisfactionLevel && (
                    <span className="text-slate-600 font-semibold text-xs">
                      • {residentFeedback.satisfactionLevel}
                    </span>
                  )}
                </div>
                {residentFeedback.comments && (
                  <div className="p-3 bg-white/80 rounded-xl border border-amber-200/50 text-slate-800 leading-relaxed italic">
                    "{residentFeedback.comments}"
                  </div>
                )}
                {residentFeedback.submittedAt && (
                  <p className="text-[10px] text-slate-400">
                    Submitted on {new Date(residentFeedback.submittedAt).toLocaleDateString()} at {new Date(residentFeedback.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            );
          })()}

          {/* FEATURE 8: Staff Resolution Submission */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4 text-xs">
            <h2 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-2">
              Operational Resolution Submission (Proof of Completion)
            </h2>

            <form onSubmit={handleResolveSubmit} className="space-y-4">
              {resolutionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{resolutionError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Actions Taken & Resolution Summary <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={resolutionSummary}
                  onChange={(e) => setResolutionSummary(e.target.value)}
                  placeholder="Detail operations conducted (e.g., cleared 2 tons of uncollected garbage along Purok 3; applied disinfectant spray)..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Photographic Proof of Work</label>
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-4 text-center bg-slate-50 hover:bg-slate-100 transition-colors relative cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setResolutionFile(e.target.files[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <Upload className="w-6 h-6 text-emerald-700 mx-auto mb-1" />
                  <p className="font-bold text-xs text-slate-800">
                    {resolutionFile ? resolutionFile.name : 'Click to upload completion photo proof'}
                  </p>
                  <p className="text-[10px] text-slate-400">JPG, PNG up to 5MB</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !resolutionSummary.trim()}
                className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> Submit Resolution for Resident Verification
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: AI & Status Processing (5 cols) */}
        <div className="lg:col-span-5 space-y-6 min-w-0">
          {/* AI Analysis Summary */}
          <div className="bg-gradient-to-br from-emerald-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-emerald-800/80 pb-3">
              <span className="font-extrabold text-sm text-amber-400 flex items-center gap-2">
                <Bot className="w-4 h-4" /> AI Engine Analysis
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-700 text-white">
                {complaint.aiResult?.confidence || 92}% Confidence
              </span>
            </div>

            <div className="space-y-2">
              <p className="text-emerald-200">Category: <strong className="text-white">{complaint.category}</strong></p>
              <p className="text-emerald-200">Assigned Dept: <strong className="text-white">{complaint.routing?.department}</strong></p>
              <p className="text-emerald-200">Officer in Charge: <strong className="text-white">{complaint.routing?.assignedStaff || 'Unassigned'}</strong></p>
            </div>

            <div className="p-3 bg-emerald-900/60 rounded-xl border border-emerald-700/60 text-emerald-100 leading-relaxed">
              "{complaint.aiResult?.reason}"
            </div>
          </div>

          {/* Status Update Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4 text-xs">
            <h2 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-2">
              Operational Status & Milestone Updates
            </h2>

            <form onSubmit={handleSaveUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Status Dropdown</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                >
                  <option value="Submitted">Submitted</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Acknowledged">Acknowledged</option>
                  <option value="Assigned">Assigned</option>
                  <option value="Under Investigation">Under Investigation</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolution Submitted">Resolution Submitted</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Progress Notes & Remarks</label>
                <textarea
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Operational notes appended to audit trail..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" /> Save Status Milestone
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffComplaintDetails;

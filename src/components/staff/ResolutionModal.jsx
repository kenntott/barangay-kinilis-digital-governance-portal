import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useComplaints } from '../../context/ComplaintContext';
import { CheckCircle2, Upload, X, Send, Image as ImageIcon } from 'lucide-react';

export const ResolutionModal = ({ complaint, onClose }) => {
  const { user } = useAuth();
  const { resolveComplaint } = useComplaints();

  const [summary, setSummary] = useState('');
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  if (!complaint) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!summary.trim()) return;

    setIsSubmitting(true);
    setSubmitError('');
    try {
      await resolveComplaint(
        complaint.id,
        summary,
        '',
        user,
        evidenceFile
      );
      onClose();
    } catch (err) {
      console.error('Failed to submit resolution:', err);
      setSubmitError(err.message || 'Failed to submit resolution. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
    >
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 to-emerald-950 text-white p-5 sm:p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-600 text-white font-black">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">Submit Work Resolution</h3>
              <p className="text-xs text-emerald-200">Reference: {complaint.referenceNo}</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-white rounded-xl touch-manipulation cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto overscroll-contain flex-1">
          {submitError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
              {submitError}
            </div>
          )}

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Incident</span>
            <p className="font-bold text-slate-800 text-xs mt-0.5">{complaint.title}</p>
            <span className="text-[11px] text-slate-500">{complaint.location} • {complaint.category}</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Detailed Action Taken / Resolution Summary <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Detail the operational steps performed on-site (e.g. Sanitation truck dispatched; Purok 3 main street cleared of 2 tons of uncollected garbage; anti-bacterial disinfectant applied)..."
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Upload Photographic Proof of Completion
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-4 text-center bg-slate-50 hover:bg-slate-100 transition-colors relative cursor-pointer touch-manipulation">
              <input
                type="file"
                accept="image/*,.pdf"
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                onChange={(e) => setEvidenceFile(e.target.files[0] || null)}
              />
              <Upload className="w-6 h-6 text-emerald-700 mx-auto mb-1" />
              <p className="font-bold text-xs text-slate-800">
                {evidenceFile ? evidenceFile.name : 'Select or drop on-site completion photo'}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Supports JPG, PNG, WebP up to 5MB</p>
            </div>
          </div>

          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-[11px]">
            <strong>Note on Accountability:</strong> Submitting resolution will advance status to <strong>Resolution Submitted</strong> and notify the reporting resident for formal verification.
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 min-h-[44px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs touch-manipulation cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !summary.trim()}
              className="px-5 py-2.5 min-h-[44px] rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs shadow-md flex items-center gap-1.5 touch-manipulation cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit Resolution'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useComplaints } from '../../context/ComplaintContext';
import { Bot, Sparkles, X, ShieldAlert, Check } from 'lucide-react';

export const AIReviewOverrideModal = ({ complaint, onClose }) => {
  const { user } = useAuth();
  const { overrideAIClassification, departments } = useComplaints();

  const [category, setCategory] = useState(complaint?.category || 'Waste Management');
  const [department, setDepartment] = useState(complaint?.routing?.department || 'Sanitation Department');
  const [priority, setPriority] = useState(complaint?.priority || 'Medium');
  const [overrideReason, setOverrideReason] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!complaint) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!overrideReason) return;
    overrideAIClassification(complaint.id, category, department, priority, overrideReason, user);
    setSubmitted(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
    >
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 to-emerald-950 text-white p-5 sm:p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-400 text-slate-950 font-black">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">AI Classification Review & Override</h3>
              <p className="text-xs text-amber-300">Reference: {complaint.referenceNo}</p>
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

        {/* Modal Content */}
        <div className="p-5 sm:p-6 space-y-6 text-xs max-h-[80vh] overflow-y-auto overscroll-contain flex-1">
          {/* Current AI Recommendation Card */}
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-700" /> Current AI Recommendation
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-700 text-white">
                {complaint.aiResult?.confidence || 92}% Confidence
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 font-semibold text-slate-800">
              <div>Category: <span className="text-emerald-800 font-bold">{complaint.aiResult?.category || complaint.category}</span></div>
              <div>Dept: <span className="text-sky-800 font-bold">{complaint.routing?.department}</span></div>
              <div>Priority: <span className="text-amber-800 font-bold">{complaint.priority}</span></div>
            </div>

            <p className="text-[11px] text-slate-600 pt-1">"{complaint.aiResult?.reason}"</p>
          </div>

          {submitted ? (
            <div className="p-6 bg-emerald-100 border border-emerald-300 rounded-2xl text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center mx-auto">
                <Check className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-emerald-900 text-sm">AI Override Applied & Logged!</h4>
              <p className="text-xs text-emerald-800">Audit trail log successfully updated.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="border-t border-slate-100 pt-4 space-y-4">
                <h4 className="font-extrabold text-slate-900 text-sm">Review & Override Controls</h4>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Modify Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-semibold bg-white"
                  >
                    <option value="Waste Management">Waste Management</option>
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="Peace & Order">Peace & Order</option>
                    <option value="Health Services">Health Services</option>
                    <option value="Social Welfare">Social Welfare</option>
                    <option value="Barangay Administration">Barangay Administration</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Reassign Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-semibold bg-white"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Modify Priority Level</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-semibold bg-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Override Reason <span className="text-rose-500">* (Required for Audit Trail)</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Provide justification for overriding AI recommendation..."
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 min-h-[44px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold touch-manipulation cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!overrideReason}
                  className="px-6 py-2.5 min-h-[44px] rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-extrabold shadow-md transition-all touch-manipulation cursor-pointer"
                >
                  Apply AI Override & Log
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

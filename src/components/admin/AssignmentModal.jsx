import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useComplaints } from '../../context/ComplaintContext';
import { Building2, User, X, Check, ShieldAlert, AlertTriangle, UserCheck } from 'lucide-react';

export const AssignmentModal = ({ complaint, onClose }) => {
  const { user } = useAuth();
  const { departments, staffList, reassignComplaint } = useComplaints();

  // Filter to active departments only
  const activeDepartments = departments.filter(d => (d.status || 'Active') === 'Active');

  // Determine initial department ensuring it's an active department if possible
  const initialDept = complaint?.routing?.department && activeDepartments.some(d => d.name === complaint.routing.department)
    ? complaint.routing.department
    : (activeDepartments[0]?.name || complaint?.routing?.department || 'Barangay Administrative Office');

  const [selectedDept, setSelectedDept] = useState(initialDept);
  const [selectedOfficer, setSelectedOfficer] = useState(complaint?.routing?.assignedStaff || '');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!complaint) return null;

  // Enforce staff eligibility: must belong to the selected department AND be Active
  const eligibleStaff = staffList.filter(s => 
    s.department === selectedDept && (s.status || 'Active') === 'Active'
  );

  // Check if currently assigned officer is inactive or from different department
  const currentOfficerProfile = staffList.find(s => s.name === complaint?.routing?.assignedStaff);
  const isCurrentOfficerInvalid = currentOfficerProfile && (
    currentOfficerProfile.status === 'Inactive' || 
    (currentOfficerProfile.department && currentOfficerProfile.department !== selectedDept)
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedDept) {
      setErrorMessage('Please select an active department.');
      return;
    }

    setIsSubmitting(true);
    try {
      await reassignComplaint(
        complaint.id,
        selectedDept,
        selectedOfficer || 'Department Desk Officer',
        notes,
        user
      );
      onClose();
    } catch (err) {
      console.error('Failed to reassign:', err);
      setErrorMessage(err.message || 'Failed to update assignment. Please try again.');
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
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-emerald-950 text-white p-5 sm:p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-600 text-white font-black">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">Department & Officer Assignment</h3>
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

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto overscroll-contain flex-1">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isCurrentOfficerInvalid && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-medium flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
              <span>Current officer ({complaint?.routing?.assignedStaff}) is inactive or transferred. Please assign an active officer.</span>
            </div>
          )}

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Complaint Title</span>
            <p className="font-bold text-slate-800 text-xs mt-0.5">{complaint.title}</p>
            <span className="text-[11px] text-slate-500">{complaint.location} • Category: {complaint.category}</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Responsible Department <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setSelectedOfficer('');
              }}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-semibold bg-white text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            >
              {activeDepartments.length > 0 ? (
                activeDepartments.map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))
              ) : (
                departments.map(d => (
                  <option key={d.id} value={d.name}>{d.name} ({d.status || 'Active'})</option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Assigned Officer / Staff Member <span className="text-slate-400 font-normal">(Active personnel only)</span>
            </label>
            <select
              value={selectedOfficer}
              onChange={(e) => setSelectedOfficer(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-semibold bg-white text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            >
              <option value="">Select Eligible Active Officer</option>
              {eligibleStaff.map(s => (
                <option key={s.id} value={s.name}>
                  {s.name} ({s.position || s.role || 'Staff'})
                </option>
              ))}
              <option value="Department Desk Officer">Department Desk Officer (Default)</option>
            </select>

            {eligibleStaff.length === 0 && (
              <p className="mt-1.5 text-[11px] text-amber-700 font-medium flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                No active personnel currently assigned to {selectedDept}. Assignment will route to Department Desk Officer.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Assignment Notes & Instructions
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Dispatched for on-site inspection by 2:00 PM today..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
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
              disabled={isSubmitting || !selectedDept}
              className="px-5 py-2.5 min-h-[44px] rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs shadow-md flex items-center gap-1.5 touch-manipulation cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving Assignment...' : 'Confirm Assignment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

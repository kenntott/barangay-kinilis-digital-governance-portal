import React, { useState, useEffect } from 'react';
import { useComplaints } from '../../context/ComplaintContext';
import { 
  Sliders, Save, Plus, Trash2, Bot, GitMerge, CheckCircle2, ArrowRight, 
  Sparkles, Layers, ShieldCheck, Tag, RefreshCw, ChevronRight, HelpCircle, Check, AlertTriangle, ToggleLeft, ToggleRight
} from 'lucide-react';
import { AdminPageHeader } from '../common/AdminPageHeader';

export const CategoryRoutingConfig = () => {
  const { categoryRoutingRules, updateRoutingRules, departments, complaints, updateComplaint } = useComplaints();
  const [rules, setRules] = useState(categoryRoutingRules);
  const [savedMsg, setSavedMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('pipeline'); // 'pipeline' or 'rules'

  // Synchronize state when backend rules load
  useEffect(() => {
    if (Array.isArray(categoryRoutingRules) && categoryRoutingRules.length > 0) {
      setRules(categoryRoutingRules);
    }
  }, [categoryRoutingRules]);

  // Filter pending complaints that need AI review or confirmation
  const pendingAiComplaints = complaints.filter(c => c.status === 'Pending' || c.aiResult?.confidence < 85);

  const handleRuleChange = (index, field, value) => {
    const updated = [...rules];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setRules(updated);
  };

  const handleToggleRuleStatus = (index) => {
    const updated = [...rules];
    const current = updated[index].isActive !== false;
    updated[index] = {
      ...updated[index],
      isActive: !current
    };
    setRules(updated);
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setErrorMsg(null);
    try {
      await updateRoutingRules(rules);
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 3500);
    } catch (err) {
      console.error('Failed to update routing rules:', err);
      setErrorMsg(err.message || 'Failed to update routing rules.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddRule = () => {
    setRules(prev => [
      ...prev,
      {
        category: `Custom Category ${prev.length + 1}`,
        department: departments[0]?.name || 'Barangay Administrative Office',
        defaultPriority: 'Medium',
        keywords: ['issue', 'concern'],
        assignedStaff: 'Department Desk Officer',
        isActive: true
      }
    ]);
  };

  const handleRemoveRule = (index) => {
    setRules(prev => prev.filter((_, i) => i !== index));
  };

  const handleApproveRouting = (complaintId, targetDept) => {
    updateComplaint(complaintId, {
      department: targetDept,
      status: 'In Progress',
      updatedAt: new Date().toISOString()
    });
  };

  const headerActions = (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={handleAddRule}
        className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center gap-1.5 border border-slate-200 cursor-pointer"
      >
        <Plus className="w-4 h-4" /> Add Mapping Rule
      </button>
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
      >
        <Save className="w-4 h-4" /> {isSaving ? 'Saving Engine...' : 'Save Rule Engine'}
      </button>
    </div>
  );

  return (
    <div className="space-y-8 pb-16 min-w-0">
      {/* Header */}
      <AdminPageHeader
        title="AI Category & Automatic Department Routing Pipeline"
        description="Configure automated NLP keyword triggers, department target mappings, and priority routing rules without altering source code."
        badgeText="AI Rule Engine v2.4"
        actionButton={headerActions}
      />

      {savedMsg && (
        <div className="p-4 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-700" /> Dynamic AI Category & Department Mapping Rules updated successfully in Supabase!
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 shadow-xs">
          <AlertTriangle className="w-4 h-4 text-rose-600" /> {errorMsg}
        </div>
      )}

      {/* VISUAL AUTOMATIC ROUTING PIPELINE STEPPER */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <GitMerge className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">Live AI Routing Pipeline Architecture</h3>
              <p className="text-xs text-slate-400">Automated end-to-end processing pipeline for resident grievances</p>
            </div>
          </div>
          <span className="self-start sm:self-auto text-[11px] font-black px-3 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
            Latency: &lt; 0.4s / Request
          </span>
        </div>

        {/* Stepper Flow Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
          {/* Step 1 */}
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-2 relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Step 01</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <p className="text-xs font-bold text-white">Resident Complaint</p>
            <p className="text-[11px] text-slate-400 leading-tight">Grievance submitted via portal with description & photos.</p>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-emerald-500/40 space-y-2 relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">Step 02</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <p className="text-xs font-bold text-amber-300">AI Keyword Engine</p>
            <p className="text-[11px] text-slate-400 leading-tight">NLP extracts keywords, urgency signals & sentiment score.</p>
          </div>

          {/* Step 3 */}
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-2 relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Step 03</span>
              <Tag className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className="text-xs font-bold text-white">Category Mapping</p>
            <p className="text-[11px] text-slate-400 leading-tight">Matches trigger keywords to configured category rules.</p>
          </div>

          {/* Step 4 */}
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-2 relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Step 04</span>
              <Layers className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <p className="text-xs font-bold text-white">Target Department</p>
            <p className="text-[11px] text-slate-400 leading-tight">Dispatches complaint to Sanitation, Health, or Peace & Order.</p>
          </div>

          {/* Step 5 */}
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-2 relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Step 05</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className="text-xs font-bold text-emerald-300">Staff Notification</p>
            <p className="text-[11px] text-slate-400 leading-tight">Auto-assigns default staff desk & alerts mobile/email.</p>
          </div>
        </div>
      </div>

      {/* PENDING AI ROUTING REVIEW QUEUE */}
      {pendingAiComplaints.length > 0 && (
        <div className="bg-white p-6 rounded-3xl border border-amber-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-amber-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Pending AI Classification Review Queue ({pendingAiComplaints.length})</h3>
                <p className="text-xs text-slate-500">Recent complaints awaiting department verification or manual override</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {pendingAiComplaints.slice(0, 3).map((comp) => (
              <div key={comp.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-500">{comp.ticketNumber || `#${comp.id.substring(0,6)}`}</span>
                    <span className="text-xs font-extrabold text-slate-900">{comp.title}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      AI Suggested: {comp.category || 'Environmental'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-1">{comp.description}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <select
                    defaultValue={comp.department || departments[0]?.name}
                    id={`dept-select-${comp.id}`}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      const selectEl = document.getElementById(`dept-select-${comp.id}`);
                      handleApproveRouting(comp.id, selectEl.value);
                    }}
                    className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" /> Approve Routing
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DYNAMIC RULES TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">Active AI Category & Keyword Mapping Rules</h3>
            <p className="text-xs text-slate-500">Edit triggers to immediately update system-wide routing behavior</p>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            {rules.filter(r => r.isActive !== false).length} of {rules.length} Rules Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[760px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
                <th className="py-3 px-4">Complaint Category</th>
                <th className="py-3 px-4">Mapped Department Target</th>
                <th className="py-3 px-4">Default Priority</th>
                <th className="py-3 px-4">Assigned Default Staff</th>
                <th className="py-3 px-4">Trigger Keywords</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rules.map((rule, idx) => (
                <tr key={idx} className={`hover:bg-slate-50/80 transition-colors ${rule.isActive === false ? 'opacity-60 bg-slate-50/50' : ''}`}>
                  <td className="py-3.5 px-4 font-extrabold text-slate-900">
                    <input
                      type="text"
                      value={rule.category}
                      onChange={(e) => handleRuleChange(idx, 'category', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold text-xs"
                    />
                  </td>

                  <td className="py-3.5 px-4">
                    <select
                      value={rule.department}
                      onChange={(e) => handleRuleChange(idx, 'department', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-semibold text-xs bg-white"
                    >
                      {departments.map(d => (
                        <option key={d.id} value={d.name}>{d.name} {d.status === 'Inactive' ? '(Inactive)' : ''}</option>
                      ))}
                    </select>
                  </td>

                  <td className="py-3.5 px-4">
                    <select
                      value={rule.defaultPriority}
                      onChange={(e) => handleRuleChange(idx, 'defaultPriority', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-semibold text-xs bg-white"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </td>

                  <td className="py-3.5 px-4">
                    <input
                      type="text"
                      value={rule.assignedStaff || ''}
                      onChange={(e) => handleRuleChange(idx, 'assignedStaff', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-medium text-xs"
                      placeholder="Department Desk Officer"
                    />
                  </td>

                  <td className="py-3.5 px-4">
                    <input
                      type="text"
                      value={Array.isArray(rule.keywords) ? rule.keywords.join(', ') : (rule.keywords || '')}
                      onChange={(e) => handleRuleChange(idx, 'keywords', e.target.value.split(',').map(s => s.trim()))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-mono"
                      placeholder="comma, separated, keywords"
                    />
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleRuleStatus(idx)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                        rule.isActive !== false 
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                    >
                      {rule.isActive !== false ? 'Active' : 'Inactive'}
                    </button>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemoveRule(idx)}
                      title="Delete Rule"
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


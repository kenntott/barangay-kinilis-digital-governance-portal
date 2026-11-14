import React, { useState } from 'react';
import { useComplaints } from '../../context/ComplaintContext';
import { FileText, Search, Shield, Filter } from 'lucide-react';
import { AdminPageHeader } from '../common/AdminPageHeader';

export const AuditLogPage = () => {
  const { auditLogs } = useComplaints();
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = auditLogs.filter(log => 
    log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.entity.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const searchAction = (
    <div className="relative w-full sm:w-64">
      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        placeholder="Search audit trail..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-600 bg-slate-50 font-medium"
      />
    </div>
  );

  return (
    <div className="space-y-8 pb-16 min-w-0">
      <AdminPageHeader
        title="System Audit Trail Log"
        description="Immutable record of all administrative actions, AI overrides, status changes, and user activities for transparency and compliance"
        badgeText="Security Audit"
        actionButton={searchAction}
      />

      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-md overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">User</th>
              <th className="py-3 px-4">Action</th>
              <th className="py-3 px-4">Module</th>
              <th className="py-3 px-4">Entity Ref</th>
              <th className="py-3 px-4">Old Value</th>
              <th className="py-3 px-4">New Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {filtered.map(log => (
              <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">{log.timestamp}</td>
                <td className="py-3 px-4 font-bold text-slate-900">{log.user}</td>
                <td className="py-3 px-4 font-bold text-emerald-800">{log.action}</td>
                <td className="py-3 px-4 text-slate-600">{log.module}</td>
                <td className="py-3 px-4 font-extrabold text-sky-800">{log.entity}</td>
                <td className="py-3 px-4 text-slate-400 max-w-xs truncate">{log.oldValue}</td>
                <td className="py-3 px-4 text-slate-800 max-w-xs truncate font-semibold">{log.newValue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

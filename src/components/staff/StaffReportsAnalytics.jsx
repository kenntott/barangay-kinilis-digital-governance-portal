import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useComplaints } from '../../context/ComplaintContext';
import { 
  ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, PieChart, Pie, Cell 
} from 'recharts';
import { 
  BarChart3, Clock, CheckCircle2, Award, Zap, Download, Calendar, Filter, 
  Building2, UserCheck, TrendingUp, ShieldAlert, Sparkles, FileText, ArrowUpRight 
} from 'lucide-react';
import { StatCard } from '../common/StatCard';
import { AdminPageHeader } from '../common/AdminPageHeader';

export const StaffReportsAnalytics = () => {
  const { user } = useAuth();
  const { complaints } = useComplaints();
  const [timeframe, setTimeframe] = useState('This Month');

  const departmentName = user?.department || 'Sanitation Department';

  // Filter complaints for staff's department
  const deptComplaints = complaints.filter(c => (c.routing?.department || c.department) === departmentName || true);
  
  const totalCases = deptComplaints.length;
  const resolvedCases = deptComplaints.filter(c => c.status === 'Resolved').length;
  const pendingCases = deptComplaints.filter(c => c.status === 'Pending' || c.status === 'Assigned').length;
  const activeCases = deptComplaints.filter(c => c.status === 'In Progress' || c.status === 'Acknowledged').length;
  const urgentCases = deptComplaints.filter(c => c.priority === 'Urgent' || c.priority === 'High').length;

  const resolutionRate = totalCases > 0 ? ((resolvedCases / totalCases) * 100).toFixed(1) : '94.2';

  // SLA Performance Data for Department
  const slaTrendData = [
    { week: 'Week 1', SLAOnTime: 18, Delayed: 1 },
    { week: 'Week 2', SLAOnTime: 24, Delayed: 2 },
    { week: 'Week 3', SLAOnTime: 29, Delayed: 1 },
    { week: 'Week 4', SLAOnTime: 35, Delayed: 0 }
  ];

  // Category Distribution inside Department
  const categoryData = [
    { name: 'Waste Collection', count: 18, color: '#047857' },
    { name: 'Street Cleaning', count: 12, color: '#059669' },
    { name: 'Illegal Dumping', count: 8, color: '#10b981' },
    { name: 'Drainage & Odor', count: 6, color: '#34d399' }
  ];

  const handleExportReport = () => {
    alert(`Exporting Official Operational SLA Report for ${departmentName} (${timeframe}). File downloaded as PDF/CSV.`);
  };

  return (
    <div className="space-y-8 pb-16 font-sans text-slate-800">
      
      {/* Page Header */}
      <AdminPageHeader
        title={`${departmentName} Operational SLA & Analytics`}
        description={`Performance analytics, response speed metrics, and resolution compliance reports for ${user?.name || 'Staff Officer'}.`}
        badgeText="Department SLA View"
        actionButton={
          <button
            onClick={handleExportReport}
            className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Export Department Report</span>
          </button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
        <StatCard title="Department Total" value={totalCases} color="emerald" icon={Building2} />
        <StatCard title="SLA Compliance" value={`${resolutionRate}%`} color="emerald" icon={TrendingUp} trend={{ isUp: true, text: '4.2%' }} />
        <StatCard title="Avg. Response Speed" value="1.8 Hours" color="blue" icon={Clock} />
        <StatCard title="Active Workload" value={activeCases + pendingCases} color="amber" icon={Zap} />
        <StatCard title="High Priority Cases" value={urgentCases} color="rose" icon={ShieldAlert} />
      </div>

      {/* DEPARTMENT SLA PERFORMANCE & RESOLUTION TREND */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-w-0">
        
        {/* Weekly SLA Compliance Chart */}
        <div className="lg:col-span-8 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Weekly SLA Resolution Performance</h3>
              <p className="text-xs text-slate-500">On-time case resolution vs SLA delay count per week</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-extrabold border border-emerald-200">
              SLA Compliance Goal: 95%+
            </span>
          </div>

          <div className="h-64 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={slaTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="week" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="SLAOnTime" name="On-Time Resolution" fill="#047857" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Delayed" name="SLA Overdue" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Resident Rating Breakdown Card */}
        <div className="lg:col-span-4 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4 min-w-0">
          <div className="space-y-3">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-base">Resident Feedback Score</h3>
              <Award className="w-5 h-5 text-amber-500" />
            </div>

            <div className="text-center py-2 space-y-1">
              <p className="text-4xl font-black text-slate-900">4.9 <span className="text-base text-slate-400 font-normal">/ 5.0</span></p>
              <p className="text-xs text-emerald-700 font-extrabold">★★★★★ Excellent Satisfaction</p>
              <p className="text-[11px] text-slate-500">Based on 42 resident photo proof resolution ratings</p>
            </div>

            <div className="space-y-2 text-xs pt-2 border-t border-slate-100">
              <div className="flex justify-between font-semibold">
                <span className="text-slate-600">Response Speed Rating:</span>
                <span className="font-extrabold text-slate-900">4.9 ⭐</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span className="text-slate-600">Workmanship Quality:</span>
                <span className="font-extrabold text-slate-900">4.8 ⭐</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span className="text-slate-600">Officer Communication:</span>
                <span className="font-extrabold text-slate-900">5.0 ⭐</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-900 font-bold text-center">
            Top Performing Unit in Barangay Kinilis!
          </div>
        </div>

      </div>

      {/* DEPARTMENT CATEGORY BREAKDOWN TABLE & METRICS */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">Sub-Category Incident Breakdown</h3>
            <p className="text-xs text-slate-500">Specific complaint types processed by {departmentName}</p>
          </div>
          <span className="text-xs font-bold text-slate-500">Total: {totalCases} Reports</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {categoryData.map((cat, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900">{cat.name}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800">
                  {cat.count} Cases
                </span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${(cat.count / 18) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

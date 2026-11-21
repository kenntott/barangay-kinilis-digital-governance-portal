import React, { useState, useMemo } from 'react';
import { useComplaints } from '../../context/ComplaintContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Star, MessageSquare, ShieldCheck, AlertCircle, CheckCircle2, 
  Search, Filter, RefreshCw, Eye, MessageCircle, ArrowUpRight,
  TrendingUp, ThumbsUp, HelpCircle, Clock, ChevronRight
} from 'lucide-react';
import { AdminPageHeader } from '../common/AdminPageHeader';

export const FeedbackManagement = ({ onViewDetails }) => {
  const { user } = useAuth();
  const { feedbackList = [], complaints = [], departments = [], fetchFeedback } = useComplaints();

  const isStaff = user?.role === 'staff';
  const staffDept = user?.department || '';

  const [activeView, setActiveView] = useState('feedback'); // 'feedback' | 'communications'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRating, setSelectedRating] = useState('all'); // 'all', '5', '4', '3', 'low'
  const [selectedDept, setSelectedDept] = useState(isStaff && staffDept ? staffDept : 'all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (typeof fetchFeedback === 'function') {
        await fetchFeedback();
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Metrics computation
  const metrics = useMemo(() => {
    const total = feedbackList.length;
    if (total === 0) {
      return {
        total: 0,
        averageRating: '0.0',
        positiveRate: '0%',
        fiveStars: 0,
        lowRatings: 0
      };
    }

    const sumRating = feedbackList.reduce((acc, f) => acc + (Number(f.rating) || 0), 0);
    const avg = (sumRating / total).toFixed(1);
    const positive = feedbackList.filter(f => (Number(f.rating) || 0) >= 4).length;
    const positivePct = Math.round((positive / total) * 100);
    const fiveStars = feedbackList.filter(f => Number(f.rating) === 5).length;
    const lowRatings = feedbackList.filter(f => (Number(f.rating) || 0) <= 2).length;

    return {
      total,
      averageRating: avg,
      positiveRate: `${positivePct}%`,
      fiveStars,
      lowRatings
    };
  }, [feedbackList]);

  // Complaints with communication activity and unanswered followups
  const communicationRecords = useMemo(() => {
    return complaints.filter(c => {
      // Find complaints that have followups or timeline activity
      const hasFollowups = (c.timeline && c.timeline.length > 0) || (c.followups && c.followups.length > 0);
      return hasFollowups;
    }).map(c => {
      // Check if last event or followup was resident inquiry
      const followups = c.followups || [];
      const lastMsg = followups[followups.length - 1];
      const hasUnansweredResident = lastMsg && lastMsg.senderRole?.toLowerCase() === 'resident';

      return {
        ...c,
        followupCount: followups.length,
        hasUnansweredResident,
        lastFollowup: lastMsg
      };
    });
  }, [complaints]);

  const unansweredCount = useMemo(() => {
    return communicationRecords.filter(c => c.hasUnansweredResident).length;
  }, [communicationRecords]);

  // Filter feedback
  const filteredFeedback = useMemo(() => {
    return feedbackList.filter(item => {
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const ref = (item.referenceNo || '').toLowerCase();
        const title = (item.complaintTitle || '').toLowerCase();
        const resident = (item.residentName || '').toLowerCase();
        const comments = (item.comments || '').toLowerCase();
        if (!ref.includes(q) && !title.includes(q) && !resident.includes(q) && !comments.includes(q)) {
          return false;
        }
      }

      // Rating filter
      if (selectedRating !== 'all') {
        const r = Number(item.rating) || 0;
        if (selectedRating === '5' && r !== 5) return false;
        if (selectedRating === '4' && r !== 4) return false;
        if (selectedRating === '3' && r !== 3) return false;
        if (selectedRating === 'low' && r > 2) return false;
      }

      // Department filter (Staff restricted to their assigned department)
      const effectiveDept = isStaff && staffDept ? staffDept : selectedDept;
      if (effectiveDept !== 'all') {
        const dept = item.department || '';
        const matchingComplaint = complaints.find(c => 
          String(c.id) === String(item.complaintId) || 
          String(c.referenceNo) === String(item.referenceNo)
        );
        const compDept = matchingComplaint?.routing?.department || matchingComplaint?.department || '';
        if (dept !== effectiveDept && compDept !== effectiveDept) {
          return false;
        }
      }

      // Status filter
      if (selectedStatus !== 'all') {
        if ((item.actionStatus || 'Accepted').toLowerCase() !== selectedStatus.toLowerCase()) {
          return false;
        }
      }

      return true;
    });
  }, [feedbackList, searchQuery, selectedRating, selectedDept, selectedStatus, complaints, isStaff, staffDept]);

  // Filter communications
  const filteredCommunications = useMemo(() => {
    return communicationRecords.filter(c => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const ref = (c.referenceNo || '').toLowerCase();
        const title = (c.title || '').toLowerCase();
        const resident = (c.residentName || '').toLowerCase();
        if (!ref.includes(q) && !title.includes(q) && !resident.includes(q)) {
          return false;
        }
      }
      const effectiveDept = isStaff && staffDept ? staffDept : selectedDept;
      if (effectiveDept !== 'all') {
        const d = c.routing?.department || c.department || '';
        if (d !== effectiveDept) return false;
      }
      return true;
    });
  }, [communicationRecords, searchQuery, selectedDept, isStaff, staffDept]);

  return (
    <div className="space-y-8 pb-16 font-sans text-slate-800">
      {/* Page Header */}
      <AdminPageHeader
        title="Resident Feedback & Communication Monitoring"
        description="Comprehensive review of post-resolution resident satisfaction ratings, citizen feedback, and active inquiry threads."
        badgeText="Citizen Engagement"
        actionButton={
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh Records</span>
            </button>
          </div>
        }
      />

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Average Rating Card */}
        <div className="bg-gradient-to-br from-emerald-900 to-slate-900 text-white rounded-3xl p-5 shadow-lg border border-emerald-800/60 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-emerald-300">Citizen Satisfaction Score</span>
            <div className="p-2 bg-emerald-800/80 rounded-xl text-amber-300">
              <Star className="w-4 h-4 fill-amber-300" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight">{metrics.averageRating}</span>
            <span className="text-xs font-semibold text-emerald-200">/ 5.0</span>
          </div>
          <p className="text-[11px] text-emerald-200/80 mt-2 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3.5 h-3.5 text-amber-300" />
            <span>{metrics.fiveStars} perfect 5-star ratings recorded</span>
          </p>
        </div>

        {/* Total Feedback Card */}
        <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/80">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">Total Feedback Received</span>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-700">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{metrics.total}</span>
            <span className="text-xs font-semibold text-slate-400">submissions</span>
          </div>
          <p className="text-[11px] text-emerald-700 mt-2 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Supabase-verified resident submissions</span>
          </p>
        </div>

        {/* Positive Rate Card */}
        <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/80">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">Positive Resolution Rate</span>
            <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
              <ThumbsUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{metrics.positiveRate}</span>
            <span className="text-xs font-semibold text-slate-400">favorable (4-5 ★)</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-medium">
            High community satisfaction metric
          </p>
        </div>

        {/* Unanswered Inquiries Alert Card */}
        <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/80">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">Pending Resident Inquiries</span>
            <div className={`p-2 rounded-xl ${unansweredCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-600'}`}>
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{unansweredCount}</span>
            <span className="text-xs font-semibold text-slate-400">awaiting reply</span>
          </div>
          <p className={`text-[11px] mt-2 font-bold flex items-center gap-1 ${unansweredCount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
            <Clock className="w-3.5 h-3.5" />
            <span>{unansweredCount > 0 ? 'Action required in communication thread' : 'All citizen inquiries answered'}</span>
          </p>
        </div>
      </div>

      {/* NAVIGATION TABS: Feedback List vs Communication Records */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView('feedback')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 ${
              activeView === 'feedback'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Star className="w-4 h-4" />
            <span>Citizen Feedback & Ratings ({feedbackList.length})</span>
          </button>

          <button
            onClick={() => setActiveView('communications')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 ${
              activeView === 'communications'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>Inquiry & Communication Threads</span>
            {unansweredCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white">
                {unansweredCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROLS */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reference #, resident name, or review keywords..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
          />
        </div>

        {/* Select Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {activeView === 'feedback' && (
            <select
              value={selectedRating}
              onChange={(e) => setSelectedRating(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 font-bold bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            >
              <option value="all">All Ratings (★)</option>
              <option value="5">5 Stars (Very Satisfied)</option>
              <option value="4">4 Stars (Satisfied)</option>
              <option value="3">3 Stars (Neutral)</option>
              <option value="low">1-2 Stars (Dissatisfied)</option>
            </select>
          )}

          {isStaff && staffDept ? (
            <select
              disabled
              value={staffDept}
              className="px-3 py-2 rounded-xl border border-slate-200 font-bold bg-slate-100 text-slate-700 cursor-not-allowed text-xs"
            >
              <option value={staffDept}>{staffDept} (Department Locked)</option>
            </select>
          ) : (
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 font-bold bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id || d.name} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          )}

          {activeView === 'feedback' && (
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 font-bold bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            >
              <option value="all">All Action Status</option>
              <option value="Accepted">Accepted</option>
              <option value="Under Review">Under Review</option>
              <option value="Escalated">Escalated</option>
            </select>
          )}
        </div>
      </div>

      {/* VIEW 1: FEEDBACK LIST */}
      {activeView === 'feedback' && (
        <div className="space-y-4">
          {filteredFeedback.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <Star className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm">No Resident Feedback Found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {feedbackList.length === 0
                  ? 'No post-resolution feedback entries have been submitted by residents yet.'
                  : 'No feedback entries match your active search and filter filters.'}
              </p>
            </div>
          ) : (
            filteredFeedback.map((item) => {
              const matchingComplaint = complaints.find(c => 
                String(c.id) === String(item.complaintId) || 
                String(c.referenceNo) === String(item.referenceNo)
              );

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs hover:border-emerald-300 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 shrink-0">
                        <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-xs text-emerald-800 tracking-wider">
                            {item.referenceNo || 'N/A'}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            {item.category || matchingComplaint?.category || 'General'}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {item.actionStatus || 'Accepted'}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-slate-900 text-sm mt-0.5">
                          {item.complaintTitle || matchingComplaint?.title || 'Resolved Barangay Service'}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-right">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= (Number(item.rating) || 0)
                                ? 'text-amber-500 fill-amber-500'
                                : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-black text-xs text-slate-800 ml-1">
                        {item.rating} / 5
                      </span>
                    </div>
                  </div>

                  {/* Feedback Comments */}
                  <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-100 text-xs text-slate-700 leading-relaxed italic">
                    "{item.comments || 'No written testimonial provided.'}"
                  </div>

                  {/* Footer details */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-[11px] text-slate-500">
                    <div className="flex items-center gap-3">
                      <span>Resident: <strong className="text-slate-700">{item.residentName || 'Barangay Resident'}</strong></span>
                      {item.satisfactionLevel && (
                        <span>• Level: <strong className="text-emerald-700">{item.satisfactionLevel}</strong></span>
                      )}
                      {item.submittedAt && (
                        <span>• Submitted: <strong>{new Date(item.submittedAt).toLocaleDateString()}</strong></span>
                      )}
                    </div>

                    {matchingComplaint && typeof onViewDetails === 'function' && (
                      <button
                        onClick={() => onViewDetails(matchingComplaint)}
                        className="font-extrabold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 text-xs"
                      >
                        <span>View Full Case File</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* VIEW 2: COMMUNICATION & INQUIRY THREADS */}
      {activeView === 'communications' && (
        <div className="space-y-4">
          {filteredCommunications.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm">No Active Communication Records</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                All complaint communication threads are up to date.
              </p>
            </div>
          ) : (
            filteredCommunications.map((comp) => (
              <div
                key={comp.id}
                className={`p-5 rounded-3xl border transition-all space-y-3 shadow-xs ${
                  comp.hasUnansweredResident
                    ? 'bg-white border-rose-300 ring-2 ring-rose-500/10'
                    : 'bg-white border-slate-200/90'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-2xl shrink-0 ${
                      comp.hasUnansweredResident ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs text-emerald-800 tracking-wider">
                          {comp.referenceNo}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {comp.routing?.department || comp.category || 'General'}
                        </span>
                        {comp.hasUnansweredResident && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                            AWAITING STAFF REPLY
                          </span>
                        )}
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-sm mt-0.5">
                        {comp.title}
                      </h4>
                    </div>
                  </div>

                  <span className="text-[11px] text-slate-400 font-bold">
                    Resident: {comp.residentName}
                  </span>
                </div>

                {/* Latest communication snippet */}
                {comp.lastFollowup ? (
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1">
                      <span>Latest message from {comp.lastFollowup.senderName} ({comp.lastFollowup.senderRole}):</span>
                      <span className="text-slate-400 font-normal">{comp.lastFollowup.date || 'Recent'}</span>
                    </div>
                    <p className="text-slate-600 line-clamp-2">{comp.lastFollowup.message}</p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    Complaint registered on {comp.submittedAt ? new Date(comp.submittedAt).toLocaleDateString() : 'N/A'}. Timeline updates available in details.
                  </p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-500">
                    Department: <strong className="text-slate-800">{comp.routing?.department || 'Unassigned'}</strong>
                  </span>

                  {typeof onViewDetails === 'function' && (
                    <button
                      onClick={() => onViewDetails(comp)}
                      className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs shadow-xs transition-all flex items-center gap-1.5"
                    >
                      <span>Open Thread & Reply</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default FeedbackManagement;

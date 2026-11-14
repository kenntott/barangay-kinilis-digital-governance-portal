import React, { useState } from 'react';
import { 
  Bot, BookOpen, Languages, MessageSquare, Settings, Plus, 
  Search, CheckCircle2, Clock, AlertTriangle, Shield, Trash2, 
  Edit3, ExternalLink, ThumbsUp, ThumbsDown, Sparkles 
} from 'lucide-react';
import { AdminPageHeader } from '../../../components/common/AdminPageHeader';
import { BLAAN_DICTIONARY } from '../../../services/ai/blaanTranslations';
import { BARANGAY_PROFILE, CITIZEN_CHARTER_SERVICES } from '../../../services/ai/barangayKnowledgeBase';

export const ChatbotManagement = () => {
  const [activeSubTab, setActiveSubTab] = useState('translations'); // 'translations', 'knowledge', 'feedback', 'settings'
  
  // Blaan & Multilingual Translations State
  const [translationsList, setTranslationsList] = useState(BLAAN_DICTIONARY);
  const [translationSearch, setTranslationSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Knowledge Base State
  const [knowledgeList, setKnowledgeList] = useState([
    {
      id: 'kb_1',
      title: 'Barangay Clearance Issuance Procedure',
      category: 'Citizen Charter',
      content: 'Requirements: Valid Government/School ID, Community Tax Certificate (Cedula), Purok Clearance. Processing time: 15-30 minutes. Free for First-Time Jobseekers.',
      status: 'Published'
    },
    {
      id: 'kb_2',
      title: 'Certificate of Indigency Guidelines',
      category: 'Social Welfare',
      content: '100% Free of charge for qualified indigent residents needing medical, educational, or legal aid assistance.',
      status: 'Published'
    },
    {
      id: 'kb_3',
      title: 'Kinilis Civic Gymnasium & Office Location',
      category: 'Public Facilities',
      content: 'Located at Barangay Kinilis, Polomolok, South Cotabato (Lat: 6.2952617, Long: 125.0730539). Open Mon-Fri 8am-5pm with continuous noon service.',
      status: 'Published'
    },
    {
      id: 'kb_4',
      title: 'Sanitation & Solid Waste Schedule',
      category: 'Environment',
      content: 'Weekly Purok collection schedule managed by Sanitation Lead Officer Maria Santos. Clean-up drives synchronized with Health Desk anti-dengue misting.',
      status: 'Published'
    }
  ]);

  // Settings State
  const [isBotEnabled, setIsBotEnabled] = useState(true);
  const [welcomeText, setWelcomeText] = useState('Fye doh! Welcome to Barangay Kinilis! I am your Kinilis Resident Assistant.');
  const [defaultLang, setDefaultLang] = useState('filipino');

  // Filtered translations
  const filteredTranslations = translationsList.filter(t => {
    const matchesSearch = 
      t.en.toLowerCase().includes(translationSearch.toLowerCase()) ||
      t.fil.toLowerCase().includes(translationSearch.toLowerCase()) ||
      t.blaan.toLowerCase().includes(translationSearch.toLowerCase()) ||
      t.key.toLowerCase().includes(translationSearch.toLowerCase());
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleToggleStatus = (key) => {
    setTranslationsList(prev => prev.map(item => {
      if (item.key === key) {
        const nextStatus = item.status === 'Verified' ? 'Pending Review' : 'Verified';
        return { ...item, status: nextStatus };
      }
      return item;
    }));
  };

  return (
    <div className="space-y-6 pb-16 font-sans text-slate-800">
      
      {/* Page Header */}
      <AdminPageHeader
        title="Kinilis Resident Assistant Management"
        description="Oversee the multilingual AI assistant, validate indigenous Blaan translations, maintain verified knowledge items, and review resident feedback."
        badgeText="AI Digital Governance"
      />

      {/* Primary Sub-navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveSubTab('translations')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all touch-manipulation cursor-pointer ${
            activeSubTab === 'translations' 
              ? 'bg-[#075B42] text-white shadow-md' 
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Languages className="w-4 h-4" />
          <span>Blaan & Multilingual Translations</span>
          <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
            {translationsList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('knowledge')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all touch-manipulation cursor-pointer ${
            activeSubTab === 'knowledge' 
              ? 'bg-[#075B42] text-white shadow-md' 
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Verified Knowledge Base</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('feedback')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all touch-manipulation cursor-pointer ${
            activeSubTab === 'feedback' 
              ? 'bg-[#075B42] text-white shadow-md' 
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Quality Analytics & Feedback</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('settings')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all touch-manipulation cursor-pointer ${
            activeSubTab === 'settings' 
              ? 'bg-[#075B42] text-white shadow-md' 
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Assistant Settings</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: BLAAN & MULTILINGUAL TRANSLATION MANAGEMENT                        */}
      {/* ========================================================================= */}
      {activeSubTab === 'translations' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 text-base">Indigenous Blaan Translation Repository</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 uppercase">
                  Cultural Validation Rule
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                All Blaan responses are strictly validated against community reviewers. Unverified entries default to honest disclaimers.
              </p>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
              <div className="relative w-48 sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search translations..."
                  value={translationSearch}
                  onChange={(e) => setTranslationSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-emerald-600 bg-slate-50"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-extrabold bg-slate-50 text-slate-700"
              >
                <option value="All">All Statuses</option>
                <option value="Verified">Verified Only</option>
                <option value="Pending Review">Pending Review</option>
                <option value="Draft">Draft</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-extrabold border-b border-slate-200 uppercase tracking-wider">
                  <th className="py-3 px-4">Key / Category</th>
                  <th className="py-3 px-4">Blaan Translation</th>
                  <th className="py-3 px-4">Filipino & English Reference</th>
                  <th className="py-3 px-4">Validator</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredTranslations.map((item) => (
                  <tr key={item.key} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono text-slate-800 font-bold block">{item.key}</span>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">{item.category}</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-[#075B42]">
                      {item.blaan}
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <p className="text-slate-800 font-semibold">{item.fil}</p>
                      <p className="text-slate-500 text-[11px]">{item.en}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {item.reviewer || 'Community Council'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        item.status === 'Verified'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}>
                        {item.status === 'Verified' ? <CheckCircle2 className="w-3 h-3 text-emerald-700" /> : <Clock className="w-3 h-3 text-amber-700" />}
                        <span>{item.status}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(item.key)}
                        className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors touch-manipulation"
                      >
                        Toggle Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: VERIFIED KNOWLEDGE BASE                                            */}
      {/* ========================================================================= */}
      {activeSubTab === 'knowledge' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-black text-slate-900 text-base">Official Knowledge Store</h3>
              <p className="text-xs text-slate-500 mt-1">
                Factual barangay data used as the primary ground-truth by the conversational assistant.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {knowledgeList.map(kb => (
              <div key={kb.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 uppercase">
                    {kb.category}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700">{kb.status}</span>
                </div>
                <h4 className="font-extrabold text-sm text-slate-900">{kb.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{kb.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: QUALITY ANALYTICS & FEEDBACK                                       */}
      {/* ========================================================================= */}
      {activeSubTab === 'feedback' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <p className="text-xs text-slate-500 font-bold uppercase">Total Inquiries</p>
              <h4 className="text-2xl font-black text-slate-900 mt-1">248</h4>
              <p className="text-[11px] text-emerald-700 mt-1">↑ 18% this month</p>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <p className="text-xs text-slate-500 font-bold uppercase">Positive Feedback</p>
              <h4 className="text-2xl font-black text-emerald-700 mt-1">94.2%</h4>
              <p className="text-[11px] text-slate-500 mt-1">Helpful rating</p>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <p className="text-xs text-slate-500 font-bold uppercase">Blaan Verified Usage</p>
              <h4 className="text-2xl font-black text-amber-700 mt-1">42 queries</h4>
              <p className="text-[11px] text-slate-500 mt-1">Indigenous language mode</p>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <p className="text-xs text-slate-500 font-bold uppercase">Reported Corrections</p>
              <h4 className="text-2xl font-black text-rose-700 mt-1">1 review</h4>
              <p className="text-[11px] text-slate-500 mt-1">Purok schedule suggestion</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
            <h3 className="font-black text-sm text-slate-900">Most Frequently Asked Inquiries</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-800">1. How to get Barangay Clearance & Cedula</span>
                <span className="text-slate-500 font-semibold">82 requests</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-800">2. Free Certificate of Indigency requirements</span>
                <span className="text-slate-500 font-semibold">54 requests</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-800">3. Report uncollected Purok garbage & dumping</span>
                <span className="text-slate-500 font-semibold">41 requests</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-800">4. Emergency numbers & Tanod security patrol</span>
                <span className="text-slate-500 font-semibold">39 requests</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: CHATBOT CONFIGURATION                                              */}
      {/* ========================================================================= */}
      {activeSubTab === 'settings' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6 max-w-2xl">
          <h3 className="font-black text-base text-slate-900">Assistant Configuration</h3>
          
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <p className="font-bold text-slate-800">Chatbot Availability</p>
                <p className="text-slate-500 text-[11px]">Display floating launcher on public landing page and resident portal.</p>
              </div>
              <input
                type="checkbox"
                checked={isBotEnabled}
                onChange={(e) => setIsBotEnabled(e.target.checked)}
                className="w-5 h-5 accent-[#075B42] rounded cursor-pointer"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Default Primary Language
              </label>
              <select
                value={defaultLang}
                onChange={(e) => setDefaultLang(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              >
                <option value="filipino">Filipino (Tagalog)</option>
                <option value="blaan">B'laan (Indigenous)</option>
                <option value="cebuano">Cebuano (Bisaya)</option>
                <option value="english">English</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Default Welcome Greeting Message
              </label>
              <textarea
                rows={3}
                value={welcomeText}
                onChange={(e) => setWelcomeText(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={() => alert('Settings updated successfully!')}
              className="px-5 py-2.5 rounded-xl bg-[#075B42] hover:bg-[#052C20] text-white font-extrabold shadow-md transition-all touch-manipulation cursor-pointer"
            >
              Save Configuration
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default ChatbotManagement;

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useComplaints } from '../../context/ComplaintContext';
import { 
  Check, ArrowRight, ArrowLeft, Upload, Trash2, Bot, GitMerge, 
  CheckCircle2, Sparkles, AlertCircle, FileText, Image as ImageIcon, MapPin
} from 'lucide-react';
import { PriorityBadge } from '../common/StatusBadge';

export const ComplaintSubmissionWizard = ({ onNavigate, onViewDetails }) => {
  const { user } = useAuth();
  const { submitComplaint, checkDuplicates } = useComplaints();

  const [currentStep, setCurrentStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [submissionError, setSubmissionError] = useState('');
  const [submittedComplaint, setSubmittedComplaint] = useState(null);
  const [duplicateCandidates, setDuplicateCandidates] = useState([]);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [duplicateCheckError, setDuplicateCheckError] = useState('');

  // Form State - uses actual authenticated user profile or empty string (zero fake defaults)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Waste Management',
    location: user?.purok || '',
    incidentDate: new Date().toISOString().split('T')[0],
    incidentTime: '10:00 AM',
    phone: user?.contact || '',
    email: user?.email || '',
    contactName: user?.name || '',
    preferredContact: 'Phone',
    attachments: [],
    rawFiles: []
  });

  // Check for duplicates when title or description updates
  useEffect(() => {
    if (formData.title.length > 8 || formData.description.length > 15) {
      const timer = setTimeout(async () => {
        setCheckingDuplicates(true);
        setDuplicateCheckError('');
        try {
          const dupes = await checkDuplicates(formData.title, formData.description, formData.location, formData.category);
          setDuplicateCandidates(dupes);
        } catch (e) {
          console.warn('[Duplicate Check Notice]:', e.message);
          setDuplicateCheckError('Could not verify duplicate reports at this moment.');
          setDuplicateCandidates([]);
        } finally {
          setCheckingDuplicates(false);
        }
      }, 600);
      return () => clearTimeout(timer);
    } else {
      setDuplicateCandidates([]);
      setDuplicateCheckError('');
    }
  }, [formData.title, formData.description, formData.location, formData.category]);

  // File uploader with real file storage
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newAttachments = files.map(f => ({
        name: f.name,
        size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
        url: URL.createObjectURL(f)
      }));
      setFormData(prev => ({ 
        ...prev, 
        attachments: [...prev.attachments, ...newAttachments],
        rawFiles: [...(prev.rawFiles || []), ...files]
      }));
    }
  };

  const removeAttachment = (index) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
      rawFiles: (prev.rawFiles || []).filter((_, i) => i !== index)
    }));
  };

  const handleNext = async () => {
    setSubmissionError('');

    // Step 1 Validation
    if (currentStep === 1) {
      if (!formData.title || formData.title.trim().length < 5) {
        setSubmissionError('Please provide a complaint title with at least 5 characters.');
        return;
      }
      if (!formData.description || formData.description.trim().length < 10) {
        setSubmissionError('Please provide a detailed description with at least 10 characters.');
        return;
      }
    }

    // Step 3 Validation
    if (currentStep === 3) {
      const complainantName = (user?.name || formData.contactName || '').trim();
      const complainantEmail = (user?.email || formData.email || '').trim();
      if (!complainantName) {
        setSubmissionError('Please provide your full name as the complainant.');
        return;
      }
      if (!complainantEmail || !complainantEmail.includes('@')) {
        setSubmissionError('Please provide a valid email address for tracking notifications.');
        return;
      }
    }

    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    } else if (currentStep === 4) {
      // Execute submission with AI classification animation
      setIsAnalyzing(true);
      try {
        const created = await submitComplaint(formData, user);
        if (created && created.referenceNo) {
          setSubmittedComplaint(created);
          setCurrentStep(5);
        } else {
          setSubmissionError('Could not finalize complaint submission. Please try again.');
        }
      } catch (err) {
        console.error('Submission failed:', err);
        setSubmissionError(err.message || 'Submission failed. Please check your network and try again.');
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Wizard Header */}
      <div className="text-center space-y-2">
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 uppercase tracking-widest">
          Brgy. Kinilis Public Service
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Submit a Community Complaint
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
          Complete the 5-step form below. Our AI classifier will automatically analyze your report and route it to the responsible department.
        </p>
      </div>

      {/* Step Indicator Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="grid grid-cols-5 gap-2 text-center">
          {[
            { num: 1, label: 'Information' },
            { num: 2, label: 'Evidence' },
            { num: 3, label: 'Contact' },
            { num: 4, label: 'Review' },
            { num: 5, label: 'Success' }
          ].map(step => (
            <div key={step.num} className="flex flex-col items-center">
              <div className={`
                w-8 h-8 rounded-full font-extrabold text-xs flex items-center justify-center transition-all
                ${currentStep > step.num 
                  ? 'bg-emerald-700 text-white' 
                  : currentStep === step.num 
                    ? 'bg-amber-400 text-slate-950 font-black ring-4 ring-amber-100' 
                    : 'bg-slate-100 text-slate-400'}
              `}>
                {currentStep > step.num ? <Check className="w-4 h-4" /> : step.num}
              </div>
              <span className={`text-[10px] mt-1 font-semibold hidden sm:block ${currentStep === step.num ? 'text-emerald-800' : 'text-slate-400'}`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* AI Analyzing Loader Overlay */}
      {isAnalyzing && (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-6 shadow-xl animate-in fade-in">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto animate-spin">
            <Bot className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">Analyzing Your Complaint...</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Our AI is analyzing your complaint text, calculating confidence scores, and automatically routing to the appropriate Barangay Kinilis department.
            </p>
          </div>
          <div className="w-48 h-2 bg-slate-100 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-emerald-600 rounded-full animate-pulse w-3/4" />
          </div>
        </div>
      )}

      {/* Wizard Form Card */}
      {!isAnalyzing && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-md">
          {/* STEP 1: INFORMATION */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-base font-extrabold text-slate-900 pb-3 border-b border-slate-100">
                1. Complaint Information
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Complaint Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Brief title (e.g., Uncollected garbage along Purok 3 main street)"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Detailed Description <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe what happened, specific landmarks, severity, and any immediate hazards..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                {/* FEATURE 3: Smart Duplicate Complaint Detection Indicator */}
                {duplicateCandidates.length > 0 && (
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-300 space-y-2 animate-in fade-in">
                    <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Potential Similar Existing Reports Detected ({duplicateCandidates.length})</span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      Our intelligent assistant found existing active community reports matching your location and description. Please review to avoid submitting redundant requests:
                    </p>
                    <div className="space-y-1.5 pt-1">
                      {duplicateCandidates.map((dupe, i) => (
                        <div key={i} className="p-2.5 bg-white/90 rounded-xl border border-amber-200 text-xs flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-900">{dupe.reference_no}</span>: <span className="text-slate-700">{dupe.title}</span>
                            <span className="block text-[10px] text-slate-500">{dupe.location} • Status: <span className="font-semibold text-emerald-800">{dupe.status}</span></span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-200 text-amber-900">
                            {dupe.match_score}% Match
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Preferred Category (AI will verify)
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none font-semibold bg-white"
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
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Location / Purok <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Purok 3, Main Street, Brgy. Kinilis"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Incident Date</label>
                    <input
                      type="date"
                      value={formData.incidentDate}
                      onChange={(e) => setFormData({ ...formData, incidentDate: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Incident Time</label>
                    <input
                      type="text"
                      placeholder="e.g. 10:30 AM"
                      value={formData.incidentTime}
                      onChange={(e) => setFormData({ ...formData, incidentTime: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: SUPPORTING EVIDENCE */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-base font-extrabold text-slate-900 pb-3 border-b border-slate-100">
                2. Supporting Evidence
              </h2>

              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center bg-slate-50 hover:bg-slate-100/80 transition-colors cursor-pointer relative">
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <Upload className="w-10 h-10 text-emerald-700 mx-auto mb-3" />
                <p className="font-bold text-xs text-slate-800">Click or drag & drop files to upload evidence</p>
                <p className="text-[11px] text-slate-400 mt-1">Supports JPG, PNG, PDF documents up to 10MB each</p>
              </div>

              {/* Uploaded files preview */}
              {formData.attachments.length > 0 && (
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-bold text-slate-700">Uploaded Attachments ({formData.attachments.length})</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {formData.attachments.map((att, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <ImageIcon className="w-5 h-5 text-emerald-700 shrink-0" />
                          <div className="truncate">
                            <p className="text-xs font-semibold text-slate-800 truncate">{att.name}</p>
                            <p className="text-[10px] text-slate-400">{att.size}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(idx)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: CONTACT INFORMATION */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-base font-extrabold text-slate-900 pb-3 border-b border-slate-100">
                3. Contact Information
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Complainant Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your full name"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 0917-000-0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Preferred Contact Method</label>
                  <div className="flex gap-4 pt-1">
                    {['Phone', 'SMS', 'Email'].map(method => (
                      <label key={method} className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                        <input
                          type="radio"
                          name="preferredContact"
                          value={method}
                          checked={formData.preferredContact === method}
                          onChange={(e) => setFormData({ ...formData, preferredContact: e.target.value })}
                          className="accent-emerald-700"
                        />
                        {method}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW SUMMARY */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-base font-extrabold text-slate-900 pb-3 border-b border-slate-100">
                4. Review Complaint Summary
              </h2>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Complaint Title</span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{formData.title}</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Description</span>
                  <p className="text-slate-700 leading-relaxed mt-0.5">{formData.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Category</span>
                    <p className="font-semibold text-emerald-800">{formData.category}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Location</span>
                    <p className="font-semibold text-slate-800">{formData.location}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Incident Time</span>
                    <p className="font-semibold text-slate-800">{formData.incidentDate} at {formData.incidentTime}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Contact</span>
                    <p className="font-semibold text-slate-800">{formData.phone} ({formData.preferredContact})</p>
                  </div>
                </div>

                {formData.attachments.length > 0 && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Attachments</span>
                    <p className="text-slate-700 mt-0.5">{formData.attachments.length} files attached</p>
                  </div>
                )}
              </div>

              {submissionError && (
                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-300 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-rose-900 leading-relaxed font-semibold">
                    <p className="font-bold text-rose-950">Submission Failed</p>
                    <p>{submissionError}</p>
                  </div>
                </div>
              )}

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-900 leading-relaxed">
                  Upon submission, the Barangay Kinilis AI classifier will instantly process your report, calculate confidence scores, and assign it to the correct department officer.
                </p>
              </div>
            </div>
          )}

          {/* STEP 5: SUBMISSION SUCCESS & AI RESULT */}
          {currentStep === 5 && submittedComplaint && (
            <div className="space-y-8 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  Status: Registered & AI Routed
                </span>
                <h2 className="text-2xl font-extrabold text-slate-900 mt-2">
                  Complaint Submitted Successfully!
                </h2>
                <p className="text-xs text-slate-500 mt-1">Save your official tracking reference number below:</p>
                <div className="inline-block mt-3 px-6 py-2.5 bg-slate-900 text-amber-300 font-extrabold text-xl rounded-2xl tracking-wider shadow-md">
                  {submittedComplaint.referenceNo}
                </div>
              </div>

              {/* Section 6 & 7 AI Classification & Routing Result Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                {/* Section 6 AI Classification Card */}
                <div className="p-5 bg-gradient-to-br from-emerald-50 to-white rounded-2xl border border-emerald-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 font-extrabold text-xs text-emerald-900">
                      <Bot className="w-4 h-4 text-emerald-700" /> AI Classification Result
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-700 text-white">
                      {submittedComplaint.aiResult.confidence}% Confidence
                    </span>
                  </div>

                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Detected Category</p>
                    <p className="font-extrabold text-sm text-slate-900">{submittedComplaint.aiResult.category}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Priority Level</p>
                      <PriorityBadge priority={submittedComplaint.aiResult.priority} />
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-emerald-100 leading-relaxed">
                    "{submittedComplaint.aiResult.reason}"
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {submittedComplaint.aiResult.keywords.map((kw, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        #{kw}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Section 7 Automatic Department Routing Card */}
                <div className="p-5 bg-gradient-to-br from-sky-50 to-white rounded-2xl border border-sky-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 font-extrabold text-xs text-sky-900">
                      <GitMerge className="w-4 h-4 text-sky-700" /> Automatic Department Routing
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
                      {submittedComplaint.routing.routingStatus}
                    </span>
                  </div>

                  {/* Flow Diagram */}
                  <div className="p-3 bg-white rounded-xl border border-sky-100 text-[11px] font-semibold text-slate-700 flex items-center justify-between">
                    <span>Complaint</span> →
                    <span>AI Engine</span> →
                    <span className="text-sky-800 font-bold">{submittedComplaint.routing.department}</span> →
                    <span className="text-emerald-800 font-bold">{submittedComplaint.routing.assignedStaff}</span>
                  </div>

                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Assigned Staff</p>
                    <p className="font-extrabold text-xs text-slate-900">{submittedComplaint.routing.assignedStaff}</p>
                  </div>

                  <p className="text-[11px] text-slate-500 italic">
                    AI recommendation is reviewed by authorized barangay personnel when necessary.
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                <button
                  onClick={() => onViewDetails(submittedComplaint)}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition-all"
                >
                  Track Complaint Progress
                </button>
                <button
                  onClick={() => onNavigate('resident-dashboard')}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          )}

          {/* Navigation Buttons (Steps 1 to 4) */}
          {currentStep < 5 && (
            <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-6">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
              ) : <div />}

              <button
                type="button"
                onClick={handleNext}
                disabled={currentStep === 1 && (!formData.title || !formData.description)}
                className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                {currentStep === 4 ? 'Confirm & Submit' : 'Next Step'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

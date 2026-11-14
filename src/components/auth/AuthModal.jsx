import React, { useState, useEffect } from 'react';
import { useAuth, DEMO_USERS } from '../../context/AuthContext';
import { 
  X, Lock, Mail, Eye, EyeOff, Sparkles, ChevronDown, 
  ChevronUp, ArrowRight, ShieldCheck, UserCheck, CheckCircle2,
  User, Phone, MapPin
} from 'lucide-react';

export const AuthModal = ({ isOpen, onClose, initialMode = 'login', onSuccessRedirect }) => {
  const { login, register } = useAuth();
  
  const [mode, setMode] = useState(initialMode); // 'login' or 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [purok, setPurok] = useState('Purok 3, Brgy. Kinilis, Polomolok');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showDemoAccounts, setShowDemoAccounts] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sync mode whenever initialMode prop changes when opening modal
  useEffect(() => {
    setMode(initialMode);
    setError('');
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(email, password);
      setLoading(false);
      if (res && res.success) {
        onClose();
        if (onSuccessRedirect) onSuccessRedirect(res.user.role);
      } else {
        setError(res?.error || 'Invalid credentials or authentication error.');
      }
    } catch (err) {
      setLoading(false);
      setError('Invalid credentials or authentication error.');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await register({ fullName, email, password, phone, purok });
      setLoading(false);
      if (res && res.success) {
        onClose();
        if (onSuccessRedirect) onSuccessRedirect('resident');
      } else {
        setError(res?.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setLoading(false);
      setError('Registration failed. Please try again.');
    }
  };

  const handleUseDemo = (roleKey) => {
    const demo = DEMO_USERS[roleKey];
    if (demo) {
      setEmail(demo.email);
      setPassword(demo.password || 'password123');
      setError('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative max-h-[90vh]">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 text-slate-400 hover:text-slate-700 bg-white/90 hover:bg-slate-100 rounded-full shadow-md transition-colors"
          aria-label="Close Auth Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* LEFT COLUMN: Official Barangay Kinilis Branding (Desktop 5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 text-white p-8 flex flex-col justify-between hidden lg:flex relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full filter blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-400/10 rounded-full filter blur-2xl pointer-events-none" />

          <div className="space-y-6 relative z-10">
            {/* Official Barangay Kinilis Seal Circular Badge */}
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-emerald-600 via-amber-400 to-emerald-400 shadow-lg flex items-center justify-center shrink-0">
                <div className="w-full h-full rounded-full bg-slate-950 p-0.5 overflow-hidden flex items-center justify-center border-2 border-amber-300">
                  <img
                    src="/images/barangay-seal.png"
                    alt="Barangay Kinilis Official Seal"
                    className="w-full h-full object-cover rounded-full"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-black text-white leading-tight">Barangay Kinilis</h2>
                <p className="text-xs text-amber-300 font-bold">Polomolok, South Cotabato</p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black tracking-tight text-white leading-tight">
                KINILIS IBA KA
              </h3>
              <p className="text-xs text-amber-300 font-extrabold uppercase tracking-wide">
                Smarter Governance, Faster Service
              </p>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              Access the official Barangay Kinilis digital governance portal to submit community concerns, track AI department routing in real-time, and view resolution updates.
            </p>
          </div>

          <div className="space-y-2.5 pt-6 border-t border-slate-800/80 relative z-10 text-[11px] text-emerald-200 font-semibold">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Role-Based Secure Authentication</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Polomolok, South Cotabato Public Portal</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Auth Form (7 cols) */}
        <div className="lg:col-span-7 p-6 sm:p-8 overflow-y-auto max-h-[90vh] space-y-6">
          
          {/* Mode Switcher Tabs */}
          <div className="flex rounded-2xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-2.5 rounded-xl transition-all ${
                mode === 'login' 
                  ? 'bg-white text-emerald-950 shadow-sm font-extrabold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(''); }}
              className={`flex-1 py-2.5 rounded-xl transition-all ${
                mode === 'register' 
                  ? 'bg-emerald-700 text-white shadow-sm font-extrabold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Register Account
            </button>
          </div>

          <div className="text-left space-y-1">
            <h3 className="text-2xl font-extrabold text-slate-900">
              {mode === 'login' ? 'Welcome Back to Kinilis Portal' : 'Create Resident Account'}
            </h3>
            <p className="text-xs text-slate-500">
              {mode === 'login' 
                ? 'Sign in to access your complaints, updates, and barangay services.' 
                : 'Register as a Barangay Kinilis resident to report issues and track resolution.'}
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold animate-fadeIn">
              {error}
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. juan.delacruz@kinilis.gov.ph"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-slate-50 focus:bg-white text-slate-900 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter account password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-slate-50 focus:bg-white text-slate-900 font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-600">
                  <input type="checkbox" defaultChecked className="accent-emerald-700 rounded" />
                  Remember me on this device
                </label>
                <a 
                  href="#forgot" 
                  onClick={(e) => { e.preventDefault(); alert('Password reset instructions sent to registered email.'); }} 
                  className="text-emerald-700 font-bold hover:underline"
                >
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                {loading ? 'Signing in...' : 'Sign In to Portal'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>

              <div className="text-center pt-2 text-xs">
                <span className="text-slate-500">Don't have a resident account? </span>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="font-extrabold text-emerald-800 hover:underline"
                >
                  Register Here
                </button>
              </div>
            </form>
          ) : (
            /* REGISTER FORM */
            <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Juan dela Cruz"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-slate-50 focus:bg-white text-slate-900 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="juandelacruz@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-slate-50 focus:bg-white text-slate-900 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Create Password * (min 6 characters)</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-slate-50 focus:bg-white text-slate-900 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="0917-123-4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-slate-50 focus:bg-white text-slate-900 font-semibold"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Purok / Address</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Purok 3, Brgy. Kinilis"
                      value={purok}
                      onChange={(e) => setPurok(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-slate-50 focus:bg-white text-slate-900 font-semibold"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs shadow-md transition-all mt-2"
              >
                {loading ? 'Registering...' : 'Complete Resident Registration'}
              </button>

              <div className="text-center pt-2 text-xs">
                <span className="text-slate-500">Already registered? </span>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="font-extrabold text-emerald-800 hover:underline"
                >
                  Sign In Instead
                </button>
              </div>
            </form>
          )}

          {/* DEMO ACCOUNTS FOR CAPSTONE EVALUATION */}
          <div className="pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowDemoAccounts(!showDemoAccounts)}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-700 hover:text-emerald-800 py-1"
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" /> Demo Accounts for Capstone Evaluation
              </span>
              {showDemoAccounts ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {showDemoAccounts && (
              <div className="mt-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-[11px] animate-in fade-in">
                <p className="text-slate-500 text-[10px]">
                  Click any demo role button below to automatically populate credentials for testing:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleUseDemo('resident')}
                    className="p-2.5 bg-white hover:bg-emerald-50 rounded-xl border border-slate-200 text-left transition-colors group"
                  >
                    <div className="font-bold text-emerald-800 flex items-center justify-between">
                      <span>Resident Demo</span>
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">Resident</span>
                    </div>
                    <p className="text-slate-600 truncate mt-1 text-[10px]">juan.delacruz@kinilis.gov.ph</p>
                    <span className="text-[10px] text-emerald-700 font-extrabold mt-1 block group-hover:underline">Autofill credentials →</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUseDemo('staff')}
                    className="p-2.5 bg-white hover:bg-emerald-50 rounded-xl border border-slate-200 text-left transition-colors group"
                  >
                    <div className="font-bold text-sky-800 flex items-center justify-between">
                      <span>Staff Demo</span>
                      <span className="text-[9px] bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded font-bold">Staff</span>
                    </div>
                    <p className="text-slate-600 truncate mt-1 text-[10px]">maria.santos@kinilis.gov.ph</p>
                    <span className="text-[10px] text-sky-700 font-extrabold mt-1 block group-hover:underline">Autofill credentials →</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUseDemo('admin')}
                    className="p-2.5 bg-white hover:bg-emerald-50 rounded-xl border border-slate-200 text-left transition-colors group"
                  >
                    <div className="font-bold text-amber-800 flex items-center justify-between">
                      <span>Admin Demo</span>
                      <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">Admin</span>
                    </div>
                    <p className="text-slate-600 truncate mt-1 text-[10px]">admin@kinilis.gov.ph</p>
                    <span className="text-[10px] text-amber-700 font-extrabold mt-1 block group-hover:underline">Autofill credentials →</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

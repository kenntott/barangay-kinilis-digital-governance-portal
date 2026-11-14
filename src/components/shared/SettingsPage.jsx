import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Bell, Lock, Sliders, CheckCircle2, Save, Smartphone } from 'lucide-react';
import { AdminPageHeader } from '../common/AdminPageHeader';
import { InstallAppButton } from '../common/InstallAppButton';

export const SettingsPage = () => {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('account');
  const [savedMsg, setSavedMsg] = useState('');

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsAlerts: true,
    urgentAlerts: true,
    weeklyReport: false
  });

  const [passwordState, setPasswordState] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setSavedMsg('Settings updated successfully!');
    setTimeout(() => setSavedMsg(''), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 min-w-0">
      {/* Header */}
      <AdminPageHeader
        title="Portal & Account Settings"
        description="Manage your user profile preferences, security settings, and system notification alerts"
        badgeText="Account Management"
      />

      {savedMsg && (
        <div className="p-4 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700" /> {savedMsg}
        </div>
      )}

      {/* PWA Mobile App Installation Card */}
      <InstallAppButton variant="card" label="Install Kinilis Iba Ka App" />

      {/* Tabs */}
      <div className="flex bg-slate-200/70 p-1 rounded-2xl text-xs font-bold w-fit gap-1">
        {[
          { id: 'account', label: 'Account Profile', icon: User },
          { id: 'notifications', label: 'Notifications', icon: Bell },
          { id: 'security', label: 'Security & Password', icon: Lock }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                isActive ? 'bg-emerald-700 text-white shadow-xs font-extrabold' : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Account Settings Form */}
      {activeSubTab === 'account' && (
        <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md space-y-4 text-xs">
          <h2 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-2">Profile Details</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                defaultValue={user?.name}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-semibold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                readOnly
                defaultValue={user?.email}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 font-semibold cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
              <input
                type="text"
                defaultValue={user?.contact || '0917-123-4567'}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Purok / Address</label>
              <input
                type="text"
                defaultValue={user?.purok || 'Brgy. Kinilis, Polomolok'}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold shadow-md flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Save Profile Changes
          </button>
        </form>
      )}

      {/* Notifications Settings */}
      {activeSubTab === 'notifications' && (
        <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md space-y-4 text-xs">
          <h2 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-2">Alert Preferences</h2>
          
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
              <div>
                <p className="font-bold text-slate-900">Email Notifications</p>
                <p className="text-slate-500 text-[11px]">Receive complaint status updates via email</p>
              </div>
              <input
                type="checkbox"
                checked={notifications.emailAlerts}
                onChange={(e) => setNotifications({ ...notifications, emailAlerts: e.target.checked })}
                className="w-4 h-4 accent-emerald-700"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
              <div>
                <p className="font-bold text-slate-900">SMS Alerts</p>
                <p className="text-slate-500 text-[11px]">Receive mobile text alerts for urgent updates</p>
              </div>
              <input
                type="checkbox"
                checked={notifications.smsAlerts}
                onChange={(e) => setNotifications({ ...notifications, smsAlerts: e.target.checked })}
                className="w-4 h-4 accent-emerald-700"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
              <div>
                <p className="font-bold text-slate-900">Urgent High-Priority Notifications</p>
                <p className="text-slate-500 text-[11px]">Receive immediate notifications for high priority complaints</p>
              </div>
              <input
                type="checkbox"
                checked={notifications.urgentAlerts}
                onChange={(e) => setNotifications({ ...notifications, urgentAlerts: e.target.checked })}
                className="w-4 h-4 accent-emerald-700"
              />
            </label>
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold shadow-md flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Save Notification Preferences
          </button>
        </form>
      )}

      {/* Security & Password Settings */}
      {activeSubTab === 'security' && (
        <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md space-y-4 text-xs">
          <h2 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-2">Change Account Password</h2>
          
          <div className="space-y-3 max-w-md">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Current Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={passwordState.currentPassword}
                onChange={(e) => setPasswordState({ ...passwordState, currentPassword: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">New Password</label>
              <input
                type="password"
                placeholder="At least 8 characters"
                value={passwordState.newPassword}
                onChange={(e) => setPasswordState({ ...passwordState, newPassword: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                placeholder="Re-enter new password"
                value={passwordState.confirmPassword}
                onChange={(e) => setPasswordState({ ...passwordState, confirmPassword: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold shadow-md flex items-center gap-2"
          >
            <Lock className="w-4 h-4" /> Update Password
          </button>
        </form>
      )}
    </div>
  );
};

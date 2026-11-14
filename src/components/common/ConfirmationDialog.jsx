import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export const ConfirmationDialog = ({ 
  isOpen, 
  title = 'Confirm Action', 
  message = 'Are you sure you want to proceed with this action?', 
  confirmText = 'Confirm', 
  cancelText = 'Cancel', 
  isDanger = true,
  onConfirm, 
  onClose 
}) => {
  if (!isOpen) return null;

  return (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
    >
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800">
        <div className="p-6 space-y-4 text-center">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto ${
            isDanger ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
          }`}>
            <AlertTriangle className="w-7 h-7" />
          </div>

          <div>
            <h3 className="font-extrabold text-base text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{message}</p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 min-h-[44px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors touch-manipulation cursor-pointer"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 py-3 min-h-[44px] rounded-xl font-extrabold text-xs shadow-md transition-colors touch-manipulation cursor-pointer ${
                isDanger 
                  ? 'bg-rose-600 hover:bg-rose-700 text-white' 
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

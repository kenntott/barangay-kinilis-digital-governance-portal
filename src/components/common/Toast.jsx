import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export const Toast = ({ message, type = 'success', onClose, duration = 4000 }) => {
  useEffect(() => {
    if (duration && onClose) {
      const timer = setTimeout(() => onClose(), duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!message) return null;

  const typeConfig = {
    success: { bg: 'bg-emerald-800 text-white border-emerald-600', icon: CheckCircle2 },
    error: { bg: 'bg-rose-800 text-white border-rose-600', icon: XCircle },
    warning: { bg: 'bg-amber-700 text-white border-amber-500', icon: AlertTriangle },
    info: { bg: 'bg-sky-800 text-white border-sky-600', icon: Info }
  };

  const config = typeConfig[type] || typeConfig.success;
  const Icon = config.icon;

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-4 max-w-sm">
      <div className={`p-4 rounded-2xl border shadow-2xl flex items-start gap-3 text-xs ${config.bg}`}>
        <Icon className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-extrabold capitalize">{type}</p>
          <p className="mt-0.5 leading-relaxed text-[11px] opacity-95">{message}</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 opacity-70 hover:opacity-100 transition-opacity">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

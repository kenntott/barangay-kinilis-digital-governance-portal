import React from 'react';

export const AdminPageHeader = ({ title, description, actionButton, badgeText }) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
          {badgeText && (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
              {badgeText}
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">{description}</p>
        )}
      </div>

      {actionButton && (
        <div className="shrink-0">
          {actionButton}
        </div>
      )}
    </div>
  );
};

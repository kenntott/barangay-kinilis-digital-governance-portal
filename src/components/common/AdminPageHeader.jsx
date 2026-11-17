import React from 'react';

export const AdminPageHeader = ({ 
  title, 
  description, 
  actionButton, 
  badgeText,
  breadcrumb 
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 border-l-4 border-l-[#075B42] p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
      <div className="space-y-1">
        {breadcrumb && (
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700">
            {breadcrumb}
          </p>
        )}
        <div className="flex items-center flex-wrap gap-2.5">
          <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
            {title}
          </h1>
          {badgeText && (
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-[#075B42] border border-emerald-300 shadow-2xs">
              {badgeText}
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-slate-600 mt-0.5 max-w-2xl leading-relaxed font-medium">
            {description}
          </p>
        )}
      </div>

      {actionButton && (
        <div className="shrink-0 self-start sm:self-auto flex items-center gap-2">
          {actionButton}
        </div>
      )}
    </div>
  );
};

export default AdminPageHeader;

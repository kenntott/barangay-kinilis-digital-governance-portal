import React from 'react';
import { Inbox, PlusCircle } from 'lucide-react';

export const EmptyState = ({ title = 'No complaints found', description = 'There are no records matching your current filter.', actionText, onAction }) => {
  return (
    <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 sm:p-12 text-center max-w-lg mx-auto my-6">
      <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
        <Inbox className="w-8 h-8" />
      </div>
      <h3 className="font-bold text-slate-800 text-lg">{title}</h3>
      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-md transition-all active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          {actionText}
        </button>
      )}
    </div>
  );
};

export const LoadingSkeleton = ({ rows = 4 }) => {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-20 bg-slate-200/70 rounded-2xl w-full" />
      ))}
    </div>
  );
};

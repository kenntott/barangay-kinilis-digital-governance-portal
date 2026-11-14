import React from 'react';

export const StatCard = ({ title, value, icon: Icon, color = 'emerald', trend, subtitle, onClick }) => {
  const colorMap = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200 icon-bg:bg-emerald-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-200 icon-bg:bg-amber-100',
    blue: 'bg-blue-50 text-blue-700 border-blue-200 icon-bg:bg-blue-100',
    rose: 'bg-rose-50 text-rose-700 border-rose-200 icon-bg:bg-rose-100',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200 icon-bg:bg-indigo-100',
    slate: 'bg-slate-50 text-slate-700 border-slate-200 icon-bg:bg-slate-100'
  };

  const badgeColor = colorMap[color] || colorMap.emerald;

  return (
    <div 
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
      className={`
        bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs 
        hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 
        ${onClick ? 'cursor-pointer touch-manipulation select-none active:scale-[0.98]' : ''}
      `}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{value}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
          {trend && (
            <span className={`inline-flex items-center gap-1 text-[11px] font-bold mt-2 px-2 py-0.5 rounded-full ${trend.isUp ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
              {trend.isUp ? '↑' : '↓'} {trend.text}
            </span>
          )}
        </div>
        {Icon && (
          <div className={`p-3.5 rounded-xl border ${badgeColor}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';

/**
 * PhilippineDateTime Component
 * Displays live Philippine Standard Time (PST) using Asia/Manila timezone
 * Complies with Philippine Standard Time Act (Republic Act No. 10535)
 */
export const PhilippineDateTime = ({ className = '', compact = false }) => {
  const [phTime, setPhTime] = useState(() => new Date());

  useEffect(() => {
    const timerId = setInterval(() => {
      setPhTime(new Date());
    }, 1000);

    return () => clearInterval(timerId);
  }, []);

  // Format Day of Week in Asia/Manila (e.g. "Sunday")
  const dayFormatter = new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila',
    weekday: 'long'
  });

  // Short day for responsive widths (e.g. "Sun")
  const shortDayFormatter = new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila',
    weekday: 'short'
  });

  // Format Date in Asia/Manila (e.g. "November 15, 2026")
  const fullDateFormatter = new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  // Compact Date (e.g. "Nov 15, 2026")
  const compactDateFormatter = new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Format Time in Asia/Manila with live seconds (e.g. "10:25:30 AM")
  const timeFormatter = new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  const dayName = dayFormatter.format(phTime);
  const shortDay = shortDayFormatter.format(phTime);
  const fullDate = fullDateFormatter.format(phTime);
  const compactDate = compactDateFormatter.format(phTime);
  const formattedTime = timeFormatter.format(phTime);

  return (
    <div 
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50/90 border border-emerald-200/80 text-xs shadow-2xs shrink-0 select-none ${className}`}
      title="Official Philippine Standard Time (PST - Asia/Manila)"
      aria-label="Philippine Standard Time"
    >
      {/* Calendar Icon + Date */}
      <div className="flex items-center gap-1.5 text-slate-700 font-bold">
        <Calendar className="w-3.5 h-3.5 text-[#075B42] shrink-0" />
        <span className="hidden xl:inline text-[11px] whitespace-nowrap">
          {dayName}, {fullDate}
        </span>
        <span className="xl:hidden text-[11px] whitespace-nowrap">
          {shortDay}, {compactDate}
        </span>
      </div>

      <span className="text-emerald-300 font-bold">•</span>

      {/* Clock Icon + Live Time + Timezone */}
      <div className="flex items-center gap-1.5 font-mono text-[#075B42] font-black">
        <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span className="text-[11px] tracking-tight whitespace-nowrap font-mono">{formattedTime}</span>
        <span 
          className="text-[9px] px-1 py-0.2 bg-emerald-200/70 rounded text-[#075B42] font-black tracking-wider uppercase"
          title="Philippine Standard Time (UTC+8)"
        >
          PST
        </span>
      </div>
    </div>
  );
};

export default PhilippineDateTime;

"use client";

import { useEffect, useState } from "react";
import { getMonthlySchedule } from "@/lib/actions";
import { WEEK_DAYS } from "@/lib/periods";
import type { ScheduleRow } from "./WeeklyTimetable";

type DayInfo = {
  date: string;
  weekday: string;
  isOverride: boolean;
  entries: ScheduleRow[];
};

function currentMonthStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function dateKey(month: string, day: number): string {
  const [, m] = month.split("-");
  return `${month}-${String(day).padStart(2, "0")}`;
}

// Monthly calendar (Sunday-Friday). Each date shows its routine: date-specific
// overrides when present, otherwise the repeating weekly pattern for that
// weekday. Read-only unless `onDateClick` is provided (admin editing).
export default function MonthlyTimetable({
  className,
  month: initialMonth,
  onDateClick,
  onMonthChange,
  reloadToken = 0,
}: {
  className: string;
  month?: string;
  onDateClick?: (info: { date: string; weekday: string; isOverride: boolean; entries: ScheduleRow[] }) => void;
  onMonthChange?: (month: string) => void;
  reloadToken?: number;
}) {
  const [month, setMonth] = useState(initialMonth || currentMonthStr());
  const [dates, setDates] = useState<DayInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    getMonthlySchedule(className, month).then((res: any) => {
      setLoading(false);
      if (res.success) setDates(res.dates);
      else setError(res.error || "Unable to load the monthly timetable.");
    });
  }, [className, month, reloadToken]);

  const [yearStr, monthStr] = month.split("-");
  const year = parseInt(yearStr, 10);
  const monthIdx = parseInt(monthStr, 10) - 1;
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
  const firstCol = new Date(year, monthIdx, 1).getDay(); // 0=Sun..6=Sat

  // Build Sunday-Friday week rows (Saturday = no school).
  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = [];
  if (firstCol < 6) {
    for (let c = 0; c < firstCol; c++) week.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const col = new Date(year, monthIdx, d).getDay();
    if (col === 6) continue;
    week.push(d);
    if (week.length === 6) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) weeks.push(week);

  const infoFor = (d: number) => dates.find((x) => x.date === dateKey(month, d));
  const todayStr = dateKey(currentMonthStr(), new Date().getDate());

  const renderSubjects = (entries: ScheduleRow[]) => {
    const classes = entries.filter((e) => e.type === "class");
    if (classes.length === 0) {
      return <span className="text-[10px] text-gray-300">Routine</span>;
    }
    const shown = classes.slice(0, 2);
    const rest = classes.length - shown.length;
    return (
      <div className="flex flex-col gap-0.5">
        {shown.map((c, i) => (
          <span key={i} className="text-[10px] font-semibold text-slate-700 truncate">
            {c.subject || "—"}
          </span>
        ))}
        {rest > 0 && <span className="text-[10px] text-gray-400">+{rest} more</span>}
      </div>
    );
  };

  const inputClass =
    "bg-white border border-slate-300 text-slate-800 text-xs font-bold rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-sky-500 shadow-sm cursor-pointer";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <input
          type="month"
          value={month}
          onChange={(e) => {
            setMonth(e.target.value);
            onMonthChange?.(e.target.value);
          }}
          className={inputClass}
        />
        <div className="flex items-center gap-3 text-[10px] text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Custom day
          </span>
          <span>·</span>
          <span>Saturday is off</span>
        </div>
      </div>

      {error && <p className="text-xs text-red-500 bg-red-50 p-2 rounded">{error}</p>}

      {loading ? (
        <p className="text-xs text-gray-400 py-4 text-center">Loading {month} timetable...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[11px] text-gray-500 uppercase">
                {WEEK_DAYS.map((d) => (
                  <th key={d.value} className="py-2 px-2 font-bold text-gray-400">
                    {d.label.slice(0, 3)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weeks.map((row, wi) => (
                <tr key={wi} className="border-t border-gray-100 align-top">
                  {row.map((d, ci) => {
                    if (d === null) {
                      return <td key={ci} className="py-2 px-2 border-l border-gray-50 bg-gray-50/50 min-w-[120px]" />;
                    }
                    const info = infoFor(d);
                    const isToday = dateKey(month, d) === todayStr;
                    return (
                      <td key={ci} className="py-2 px-2 border-l border-gray-100 min-w-[120px] align-top">
                        <div
                          onClick={onDateClick && info ? () => onDateClick(info) : undefined}
                          className={`rounded-xl p-2 ${
                            onDateClick ? "cursor-pointer hover:bg-sky-50 hover:ring-1 hover:ring-sky-200" : ""
                          } ${isToday ? "ring-2 ring-mahankalSky" : ""} ${
                            info?.isOverride ? "bg-amber-50" : "bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-xs font-bold ${isToday ? "text-mahankalSky" : "text-slate-500"}`}>
                              {d}
                            </span>
                            {info?.isOverride && <span className="text-[9px] font-bold text-amber-600">★ Custom</span>}
                          </div>
                          {info ? renderSubjects(info.entries) : <span className="text-[10px] text-gray-300">No routine</span>}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

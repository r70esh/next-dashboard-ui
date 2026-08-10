"use client";

import { WEEK_DAYS, buildDayLabels, getDefaultScheduleRows } from "@/lib/periods";

export type ScheduleRow = {
  _id?: string;
  class?: string;
  day: string;
  period: number;
  startTime: string;
  endTime: string;
  subject?: string;
  teacher?: string;
  room?: string;
  type?: string;
  notes?: string;
};

// Read-only weekly timetable. Renders one column per day (Sun-Fri) with every
// slot on the period grid. Used by students, parents, teachers and the admin
// "Weekly View" toggle.
export default function WeeklyTimetable({
  className,
  week,
  compact = false,
}: {
  className: string;
  week: Record<string, ScheduleRow[]>;
  compact?: boolean;
}) {
  const templateRows = getDefaultScheduleRows(className);
  const templateLabels = buildDayLabels(templateRows);

  // Union of period rows across all days + the default template, so an extra
  // period added by the admin still gets a column.
  const periods = Array.from(
    new Set([
      ...templateRows.map((r) => r.period),
      ...Object.values(week).flat().map((r) => r.period),
    ])
  ).sort((a, b) => a - b);

  const labelFor = (period: number) =>
    templateLabels[period] || `Period ${period}`;

  const slotFor = (day: string, period: number) =>
    (week[day] || []).find((r) => r.period === period);

  const renderCell = (day: string, period: number) => {
    const slot = slotFor(day, period);
    if (!slot) {
      return <div className={`text-[11px] text-gray-300 ${compact ? "" : "py-3"}`}>—</div>;
    }
    if (slot.type === "break" || slot.type === "lunch" || slot.type === "assembly") {
      const label =
        slot.type === "break"
          ? "Break"
          : slot.type === "lunch"
          ? "Lunch"
          : "Assembly";
      return (
        <div className="bg-amber-400 text-white rounded-lg px-2 py-2">
          <div className="text-[11px] font-bold">{label}</div>
          <div className="text-[10px] text-amber-50">
            {slot.startTime} - {slot.endTime}
          </div>
        </div>
      );
    }
    return (
      <div className={compact ? "" : "py-1"}>
        <div className={`font-bold text-slate-800 ${compact ? "text-xs" : "text-sm"}`}>
          {slot.subject || "—"}
        </div>
        <div className={`text-[11px] text-gray-400`}>
          {slot.startTime} - {slot.endTime}
        </div>
        {!compact && slot.teacher && (
          <div className="text-[11px] text-gray-500">{slot.teacher}</div>
        )}
        {!compact && slot.room && (
          <div className="text-[10px] text-gray-400">Room {slot.room}</div>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Desktop table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[11px] text-gray-500 uppercase">
              <th className="py-2 pr-3 font-bold text-gray-400 whitespace-nowrap">Period</th>
              {WEEK_DAYS.map((d) => (
                <th key={d.value} className="py-2 px-2 font-bold text-gray-500 border-l border-gray-100">
                  {d.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periods.map((period) => (
              <tr key={period} className="border-t border-gray-100 align-top">
                <td className="py-2 pr-3 text-[11px] font-bold text-gray-500 whitespace-nowrap">
                  {labelFor(period)}
                </td>
                {WEEK_DAYS.map((d) => (
                  <td key={d.value} className="py-2 px-2 border-l border-gray-100 min-w-[130px]">
                    {renderCell(d.value, period)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
        {WEEK_DAYS.map((d) => {
          const rows = [...(week[d.value] || [])].sort((a, b) => a.period - b.period);
          return (
            <div key={d.value} className="rounded-xl border border-gray-200 p-3">
              <div className="text-sm font-bold text-gray-700 mb-2">{d.label}</div>
              {rows.length === 0 ? (
                <div className="text-xs text-gray-400">Free / not scheduled</div>
              ) : (
                <div className="flex flex-col gap-2">
                  {rows.map((slot) => (
                    <div key={slot._id || `${d.value}-${slot.period}`} className="rounded-lg bg-gray-50 px-2 py-1.5">
                      <div className="text-[10px] text-gray-400">
                        {buildDayLabels(rows)[slot.period] || `Period ${slot.period}`} · {slot.startTime} - {slot.endTime}
                      </div>
                      {renderCell(d.value, slot.period)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

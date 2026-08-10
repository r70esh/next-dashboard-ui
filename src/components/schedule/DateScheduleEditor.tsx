"use client";

import { useState } from "react";
import { saveDateSchedule, resetDateSchedule } from "@/lib/actions";
import { buildDayLabels } from "@/lib/periods";
import type { ScheduleRow } from "./WeeklyTimetable";
import ScheduleEntryForm from "./ScheduleEntryForm";

const TYPE_BADGE: Record<string, string> = {
  class: "bg-sky-100 text-sky-700",
  break: "bg-amber-100 text-amber-700",
  lunch: "bg-orange-100 text-orange-700",
  assembly: "bg-purple-100 text-purple-700",
  other: "bg-gray-100 text-gray-600",
};

type FormState = { mode: "edit"; row: ScheduleRow } | { mode: "create"; period: number } | null;

// Editor for ONE specific date. Saving creates a date-specific override; the
// date can always be reset back to the repeating weekly routine.
export default function DateScheduleEditor({
  className,
  dateStr,
  initialEntries,
  isOverride,
  onClose,
  onChanged,
}: {
  className: string;
  dateStr: string;
  initialEntries: ScheduleRow[];
  isOverride: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [rows, setRows] = useState<ScheduleRow[]>(initialEntries);
  const [form, setForm] = useState<FormState>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [y, m, d] = dateStr.split("-").map(Number);
  const formattedDate = new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const dayLabels = buildDayLabels(rows);
  const nextPeriod = (rows.length > 0 ? Math.max(...rows.map((r) => r.period)) : 0) + 1;

  const handleFormSave = (row: ScheduleRow) => {
    setRows((prev) => {
      const exists = prev.some((r) => r._id && r._id === row._id);
      if (exists) return prev.map((r) => (r._id === row._id ? { ...r, ...row } : r));
      return [...prev.filter((r) => r.period !== row.period), row].sort((a, b) => a.period - b.period);
    });
    setForm(null);
  };

  const handleFormDelete = (row: ScheduleRow) => {
    setRows((prev) => prev.filter((r) => (row._id ? r._id !== row._id : r.period !== row.period)));
    setForm(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    const res = await saveDateSchedule(className, dateStr, rows);
    setSaving(false);
    if (res.success) {
      setMessage({ type: "success", text: "This date's routine saved as a custom day." });
      onChanged();
    } else {
      setMessage({ type: "error", text: res.error || "Failed to save." });
    }
  };

  const handleReset = async () => {
    if (!window.confirm("Reset this date to the weekly routine? Your custom changes for this date will be removed.")) {
      return;
    }
    setSaving(true);
    setMessage(null);
    const res = await resetDateSchedule(className, dateStr);
    setSaving(false);
    if (res.success) {
      setMessage({ type: "success", text: "This date now follows the weekly routine again." });
      onChanged();
    } else {
      setMessage({ type: "error", text: res.error || "Failed to reset." });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-3xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Edit {formattedDate}</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Class {className} · {isOverride ? "Custom day (overrides weekly routine)" : "Using the weekly routine — save to make this date custom."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {message && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold mb-4 border ${
              message.type === "success"
                ? "bg-green-100 text-green-800 border-green-300"
                : "bg-red-100 text-red-800 border-red-300"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setForm({ mode: "create", period: nextPeriod })}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-lg transition"
          >
            ＋ Add Slot
          </button>
        </div>

        {rows.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-400">
            No routine for this date yet. Add slots, or close to keep following the weekly routine.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[11px] text-gray-500 uppercase border-b border-gray-100">
                  <th className="py-2 pr-3 font-bold text-gray-400">Period</th>
                  <th className="py-2 pr-3 font-bold text-gray-400">Time</th>
                  <th className="py-2 pr-3 font-bold text-gray-400">Subject</th>
                  <th className="py-2 pr-3 font-bold text-gray-400">Teacher</th>
                  <th className="py-2 pr-3 font-bold text-gray-400">Room</th>
                  <th className="py-2 font-bold text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {[...rows]
                  .sort((a, b) => a.period - b.period)
                  .map((row) => (
                    <tr key={row._id || `${dateStr}-${row.period}`} className="border-b border-gray-100 last:border-0 hover:bg-slate-50/60">
                      <td className="py-2 pr-3 text-xs font-bold text-slate-700 whitespace-nowrap">
                        {dayLabels[row.period] || `Period ${row.period}`}
                      </td>
                      <td className="py-2 pr-3 text-xs text-gray-500 whitespace-nowrap">
                        {row.startTime} - {row.endTime}
                      </td>
                      <td className="py-2 pr-3 text-sm font-semibold text-slate-800">
                        {row.type === "class" ? row.subject || "—" : "—"}
                      </td>
                      <td className="py-2 pr-3 text-xs text-gray-500">{row.type === "class" ? row.teacher || "—" : "—"}</td>
                      <td className="py-2 pr-3 text-xs text-gray-500">{row.type === "class" ? row.room || "—" : "—"}</td>
                      <td className="py-2">
                        <div className="flex items-center gap-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TYPE_BADGE[row.type || "class"] || TYPE_BADGE.other}`}>
                            {(row.type || "class").toUpperCase()}
                          </span>
                          <button
                            type="button"
                            onClick={() => setForm({ mode: "edit", row })}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                            title="Edit slot"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFormDelete(row)}
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition"
                            title="Delete slot"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 mt-6">
          {isOverride ? (
            <button
              type="button"
              onClick={handleReset}
              disabled={saving}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition"
            >
              Reset to Weekly Routine
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-200 hover:bg-gray-300 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-lg transition"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || rows.length === 0}
              className="bg-mahankalSky hover:bg-sky-600 disabled:opacity-50 text-white text-xs font-bold px-5 py-2.5 rounded-lg transition"
            >
              {saving ? "Saving..." : isOverride ? "Save This Date" : "Make Custom & Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

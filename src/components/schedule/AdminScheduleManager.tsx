"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getScheduleForClassDay,
  getWeeklyScheduleForClass,
  bulkSaveSchedule,
  copyScheduleDay,
  copyScheduleWeek,
  copyScheduleToMonth,
} from "@/lib/actions";
import { WEEK_DAYS, DAY_LABELS, buildDayLabels, getDefaultScheduleRows, getPeriodCountForClass } from "@/lib/periods";
import { useRouter } from "next/navigation";
import WeeklyTimetable, { type ScheduleRow } from "./WeeklyTimetable";
import ScheduleEntryForm from "./ScheduleEntryForm";
import MonthlyTimetable from "./MonthlyTimetable";
import DateScheduleEditor from "./DateScheduleEditor";

const CLASS_OPTIONS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

const TYPE_BADGE: Record<string, string> = {
  class: "bg-sky-100 text-sky-700",
  break: "bg-amber-100 text-amber-700",
  lunch: "bg-orange-100 text-orange-700",
  assembly: "bg-purple-100 text-purple-700",
  other: "bg-gray-100 text-gray-600",
};

type FormState = { mode: "edit"; row: ScheduleRow } | { mode: "create"; period: number } | null;

// Admin class-routine editor: pick a class + day, edit slots on a grid, then
// bulk-save. Also supports copying a day/week to another class and a read-only
// weekly view.
export default function AdminScheduleManager() {
  const router = useRouter();
  const [selectedClass, setSelectedClass] = useState("1");
  const [selectedDay, setSelectedDay] = useState(WEEK_DAYS[0].value);
  const [rows, setRows] = useState<ScheduleRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [form, setForm] = useState<FormState>(null);

  const [weekData, setWeekData] = useState<Record<string, ScheduleRow[]>>({});
  const [loadingWeek, setLoadingWeek] = useState(false);

  const [view, setView] = useState<"day" | "week" | "month">("day");
  const [month, setMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [monthReload, setMonthReload] = useState(0);
  const [copyingMonth, setCopyingMonth] = useState(false);
  const [editingDate, setEditingDate] = useState<{
    date: string;
    weekday: string;
    isOverride: boolean;
    entries: ScheduleRow[];
  } | null>(null);

  const [toDay, setToDay] = useState(WEEK_DAYS[1].value);
  const [toClass, setToClass] = useState("2");

  const periodCount = getPeriodCountForClass(selectedClass);

  const loadDay = useCallback(async () => {
    if (!selectedClass || !selectedDay) return;
    setLoading(true);
    setMessage(null);
    const res = await getScheduleForClassDay(selectedClass, selectedDay);
    setLoading(false);
    if (res.success) {
      setRows(res.entries);
    } else {
      setMessage({ type: "error", text: res.error || "Failed to load the day's schedule." });
    }
  }, [selectedClass, selectedDay]);

  useEffect(() => {
    loadDay();
  }, [loadDay]);

  // Keep copy target day/class sane when the selection changes: default the
  // target to the *next* day/class so the copy buttons are immediately usable.
  useEffect(() => {
    const idx = WEEK_DAYS.findIndex((d) => d.value === selectedDay);
    setToDay(WEEK_DAYS[(idx + 1) % WEEK_DAYS.length].value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDay]);
  useEffect(() => {
    const idx = CLASS_OPTIONS.indexOf(selectedClass);
    setToClass(CLASS_OPTIONS[(idx + 1) % CLASS_OPTIONS.length]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass]);

  const openWeeklyView = async () => {
    setView("week");
    setLoadingWeek(true);
    const res = await getWeeklyScheduleForClass(selectedClass);
    setLoadingWeek(false);
    if (res.success) setWeekData(res.week);
    else setMessage({ type: "error", text: res.error || "Failed to load weekly schedule." });
  };

  const handleCopyToMonth = async () => {
    setCopyingMonth(true);
    setMessage(null);
    const res = await copyScheduleToMonth(selectedClass, month);
    setCopyingMonth(false);
    if (res.success) {
      setMessage({ type: "success", text: res.message || "Monthly routine created!" });
      setMonthReload((t) => t + 1);
    } else {
      setMessage({ type: "error", text: res.error || "Failed to copy to month." });
    }
  };

  const loadDefaultDay = () => {
    setMessage(null);
    setRows(getDefaultScheduleRows(selectedClass).map((r) => ({ ...r, day: selectedDay })));
  };

  const nextPeriod = (rows.length > 0 ? Math.max(...rows.map((r) => r.period)) : 0) + 1;

  const handleFormSave = (row: ScheduleRow) => {
    setRows((prev) => {
      const exists = prev.some((r) => r._id && r._id === row._id);
      if (exists) return prev.map((r) => (r._id === row._id ? { ...r, ...row } : r));
      // New slot: replace same-period slot if present, otherwise append.
      const withoutPeriod = prev.filter((r) => r.period !== row.period);
      return [...withoutPeriod, row].sort((a, b) => a.period - b.period);
    });
    setForm(null);
  };

  const handleFormDelete = (row: ScheduleRow) => {
    // Rows that exist in the DB are matched by _id; unsaved slots have no _id
    // yet, so fall back to the (unique) period position within the day.
    setRows((prev) => prev.filter((r) => (row._id ? r._id !== row._id : r.period !== row.period)));
    setForm(null);
  };

  const handleSave = async () => {
    if (rows.length === 0) {
      setMessage({ type: "error", text: "Nothing to save. Add slots first." });
      return;
    }
    setSaving(true);
    setMessage(null);
    const res = await bulkSaveSchedule(selectedClass, selectedDay, rows);
    setSaving(false);
    if (res.success) {
      setMessage({ type: "success", text: `Timetable for Class ${selectedClass} · ${DAY_LABELS[selectedDay]} saved!` });
      await loadDay();
      router.refresh();
    } else {
      setMessage({ type: "error", text: res.error || "Failed to save timetable." });
    }
  };

  const notify = (res: { success: boolean; error?: string }, okText: string) => {
    if (res.success) setMessage({ type: "success", text: okText });
    else setMessage({ type: "error", text: res.error || "Operation failed." });
  };

  const handleCopyDayToDay = async () => {
    if (toDay === selectedDay) {
      setMessage({ type: "error", text: "Choose a different target day to copy to." });
      return;
    }
    const res = await copyScheduleDay(selectedClass, selectedDay, selectedClass, toDay);
    notify(res, `Copied ${DAY_LABELS[selectedDay]} → ${DAY_LABELS[toDay]} for Class ${selectedClass}.`);
    if (res.success) loadDay();
  };

  const handleCopyDayToClass = async () => {
    if (toClass === selectedClass) {
      setMessage({ type: "error", text: "Choose a different target class to copy to." });
      return;
    }
    const res = await copyScheduleDay(selectedClass, selectedDay, toClass, toDay);
    notify(res, `Copied ${DAY_LABELS[selectedDay]} → Class ${toClass} ${DAY_LABELS[toDay]}.`);
  };

  const handleCopyWeekToClass = async () => {
    if (toClass === selectedClass) {
      setMessage({ type: "error", text: "Choose a different target class to copy the week to." });
      return;
    }
    const res = await copyScheduleWeek(selectedClass, toClass);
    notify(res, `Copied the whole week of Class ${selectedClass} → Class ${toClass}.`);
  };

  const dayLabels = buildDayLabels(rows);

  const renderActions = (row: ScheduleRow) => (
    <div className="flex items-center gap-1">
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
  );

  const selectClass =
    "bg-white border border-slate-300 text-slate-800 text-xs font-bold rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-sky-500 shadow-sm cursor-pointer";

  return (
    <div className="flex flex-col gap-4">
      {/* HEADER + SELECTORS */}
      <div className="bg-gradient-to-r from-sky-50 via-indigo-50 to-purple-50 p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
              <span>🗓️</span> Class Routine Manager
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Class {selectedClass} · {periodCount} periods/day · Edit slots then save the day.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase">Class</label>
              <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className={selectClass}>
                {CLASS_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    Class {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase">Day</label>
              <select value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)} className={selectClass}>
                {WEEK_DAYS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase">View</label>
              <div className="flex items-center rounded-xl overflow-hidden border border-slate-300 bg-white shadow-sm">
                {(["day", "week", "month"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => (v === "week" ? openWeeklyView() : setView(v))}
                    className={`text-xs font-bold px-3 py-2.5 transition capitalize ${
                      view === v ? "bg-sky-600 text-white" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {message && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs font-semibold border ${
              message.type === "success"
                ? "bg-green-100 text-green-800 border-green-300"
                : "bg-red-100 text-red-800 border-red-300"
            }`}
          >
            {message.text}
          </div>
        )}

        {view === "day" && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={loadDefaultDay}
              className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-sm"
            >
              ⚡ Load Default Day
            </button>
            <button
              type="button"
              onClick={() => setForm({ mode: "create", period: nextPeriod })}
              className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-sm"
            >
              ＋ Add Period Slot
            </button>
            <div className="flex-1" />
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || rows.length === 0}
              className="bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl transition shadow-md"
            >
              {saving ? "Saving..." : `💾 Save Class ${selectedClass} · ${DAY_LABELS[selectedDay]}`}
            </button>
          </div>
        )}
      </div>

      {/* COPY TOOLBAR (day editor) */}
      {view === "day" && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-600 uppercase">Copy {DAY_LABELS[selectedDay]} to Day</label>
            <select value={toDay} onChange={(e) => setToDay(e.target.value)} className={selectClass}>
              {WEEK_DAYS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-600 uppercase">Target Class</label>
            <select value={toClass} onChange={(e) => setToClass(e.target.value)} className={selectClass}>
              {CLASS_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  Class {c}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleCopyDayToDay}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-sm"
          >
            Copy Day → Day
          </button>
          <button
            type="button"
            onClick={handleCopyDayToClass}
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-sm"
          >
            Copy Day → Class
          </button>
          <button
            type="button"
            onClick={handleCopyWeekToClass}
            className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-sm"
          >
            Copy Week → Class
          </button>
          <span className="text-[10px] text-gray-400 ml-auto">
            Target day only applies to the first two buttons.
          </span>
        </div>
      )}

      {/* WEEKLY VIEW */}
      {view === "week" ? (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 text-sm">Class {selectedClass} · Weekly Timetable</h3>
            <button
              type="button"
              onClick={() => setView("day")}
              className="text-xs font-bold text-sky-600 hover:underline"
            >
              ← Back to Day Editor
            </button>
          </div>
          {loadingWeek ? (
            <p className="text-xs text-gray-400">Loading weekly timetable...</p>
          ) : (
            <WeeklyTimetable className={selectedClass} week={weekData} />
          )}
        </div>
      ) : view === "month" ? (
        /* MONTHLY VIEW */
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Class {selectedClass} · Monthly Routine</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Build the weekly routine once, then copy it to the whole month. Customized days are still editable.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMonthReload((t) => t + 1)}
                className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-sm"
              >
                ↻ Refresh
              </button>
              <button
                type="button"
                onClick={handleCopyToMonth}
                disabled={copyingMonth}
                className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition shadow-md"
              >
                {copyingMonth ? "Copying..." : `📅 Copy Weekly Routine → This Month`}
              </button>
            </div>
          </div>
          <MonthlyTimetable
            className={selectedClass}
            month={month}
            reloadToken={monthReload}
            onMonthChange={setMonth}
            onDateClick={(info) => setEditingDate(info)}
          />
        </div>
      ) : (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          {/* DAY GRID */}
          {loading ? (
            <p className="text-xs text-gray-400 py-6 text-center">Loading {DAY_LABELS[selectedDay]} schedule...</p>
          ) : rows.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-gray-500 mb-2">
                No schedule yet for Class {selectedClass} · {DAY_LABELS[selectedDay]}.
              </p>
              <p className="text-xs text-gray-400 mb-4">
                Start from the default period times or add slots one by one.
              </p>
              <button
                type="button"
                onClick={loadDefaultDay}
                className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow-sm"
              >
                ⚡ Load Default Day
              </button>
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
                    <th className="py-2 pr-3 font-bold text-gray-400">Type</th>
                    <th className="py-2 font-bold text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[...rows]
                    .sort((a, b) => a.period - b.period)
                    .map((row) => (
                      <tr
                        key={row._id || `${row.day}-${row.period}`}
                        className="border-b border-gray-100 last:border-0 hover:bg-slate-50/60"
                      >
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
                        <td className="py-2 pr-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TYPE_BADGE[row.type || "class"] || TYPE_BADGE.other}`}>
                            {(row.type || "class").toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2">{renderActions(row)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {form && (
        <ScheduleEntryForm
          className={selectedClass}
          dayLabel={DAY_LABELS[selectedDay]}
          initial={form.mode === "edit" ? form.row : null}
          nextPeriod={form.mode === "create" ? form.period : nextPeriod}
          onClose={() => setForm(null)}
          onSave={handleFormSave}
          onDelete={form.mode === "edit" ? () => handleFormDelete(form.row) : undefined}
        />
      )}

      {editingDate && (
        <DateScheduleEditor
          className={selectedClass}
          dateStr={editingDate.date}
          initialEntries={editingDate.entries}
          isOverride={editingDate.isOverride}
          onClose={() => setEditingDate(null)}
          onChanged={() => setMonthReload((t) => t + 1)}
        />
      )}
    </div>
  );
}

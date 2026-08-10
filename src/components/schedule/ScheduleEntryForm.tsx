"use client";

import { useEffect, useState } from "react";
import { getSubjectOptions, getTeacherOptions } from "@/lib/actions";
import type { ScheduleRow } from "./WeeklyTimetable";

const TYPES = [
  { value: "class", label: "Class" },
  { value: "break", label: "Break" },
  { value: "lunch", label: "Lunch" },
  { value: "assembly", label: "Assembly" },
  { value: "other", label: "Other" },
];

// Modal form for one timetable slot. Edits are kept in the manager's local
// grid state and persisted when the admin hits "Save Timetable".
export default function ScheduleEntryForm({
  className,
  dayLabel,
  initial,
  nextPeriod,
  onClose,
  onSave,
  onDelete,
}: {
  className: string;
  dayLabel: string;
  initial?: ScheduleRow | null;
  nextPeriod: number;
  onClose: () => void;
  onSave: (row: ScheduleRow) => void;
  onDelete?: () => void;
}) {
  const [type, setType] = useState(initial?.type || "class");
  const [period, setPeriod] = useState(String(initial?.period ?? nextPeriod));
  const [startTime, setStartTime] = useState(initial?.startTime || "");
  const [endTime, setEndTime] = useState(initial?.endTime || "");
  const [subject, setSubject] = useState(initial?.subject || "");
  const [teacher, setTeacher] = useState(initial?.teacher || "");
  const [room, setRoom] = useState(initial?.room || "");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [error, setError] = useState("");

  const [subjectOptions, setSubjectOptions] = useState<string[]>([]);
  const [teacherOptions, setTeacherOptions] = useState<string[]>([]);

  useEffect(() => {
    getSubjectOptions().then((res) => setSubjectOptions(res.subjects.map((s: any) => s.name)));
    getTeacherOptions().then((res) => setTeacherOptions(res.teachers.map((t: any) => t.name)));
  }, []);

  const handleSave = () => {
    if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
      setError("Start and end times must be in HH:MM format (e.g. 10:10).");
      return;
    }
    if (startTime >= endTime) {
      setError("End time must be after start time.");
      return;
    }
    const p = parseInt(period, 10);
    if (isNaN(p) || p < 1) {
      setError("Period must be a positive number.");
      return;
    }
    const isNonClass = type !== "class";
    onSave({
      _id: initial?._id,
      class: className,
      day: initial?.day || "",
      period: p,
      startTime,
      endTime,
      subject: isNonClass ? "" : subject.trim(),
      teacher: isNonClass ? "" : teacher.trim(),
      room: isNonClass ? "" : room.trim(),
      type,
      notes: notes.trim(),
    });
  };

  const inputClass =
    "bg-white border border-slate-300 text-slate-800 text-xs font-medium rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-mahankalSky w-full";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800">
            {initial ? "Edit Slot" : "Add Slot"}
            <span className="block text-xs font-medium text-gray-400 mt-0.5">
              Class {className} · {dayLabel}
            </span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl text-xs font-semibold mb-4 border border-red-300 bg-red-100 text-red-800">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-600 uppercase">Slot Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className={inputClass}>
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-600 uppercase">Period #</label>
            <input
              type="number"
              min={1}
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className={inputClass}
              disabled={!!initial}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-600 uppercase">Start Time</label>
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-600 uppercase">End Time</label>
            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputClass} />
          </div>

          {type === "class" && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase">Subject</label>
                <input
                  list="schedule-subjects"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Mathematics"
                />
                <datalist id="schedule-subjects">
                  {subjectOptions.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase">Teacher</label>
                <input
                  list="schedule-teachers"
                  value={teacher}
                  onChange={(e) => setTeacher(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Mr. John Doe"
                />
                <datalist id="schedule-teachers">
                  {teacherOptions.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </div>
              <div className="flex flex-col gap-1 col-span-2">
                <label className="text-[11px] font-bold text-slate-600 uppercase">Room</label>
                <input
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. 201"
                />
              </div>
            </>
          )}

          <div className="flex flex-col gap-1 col-span-2">
            <label className="text-[11px] font-bold text-slate-600 uppercase">
              Notes {type !== "class" ? "(required for breaks/assembly)" : "(optional)"}
            </label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={inputClass}
              placeholder={type === "break" ? "e.g. Short break" : "Any additional note"}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 mt-6">
          {onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition"
            >
              Delete
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
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="bg-mahankalSky hover:bg-sky-600 text-white text-xs font-bold px-5 py-2.5 rounded-lg transition"
            >
              Save Slot
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

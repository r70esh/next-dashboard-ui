"use client";

import { useEffect, useState } from "react";
import { getTeacherAssignedClasses, getWeeklyScheduleForClass } from "@/lib/actions";
import WeeklyTimetable from "./WeeklyTimetable";

const ALL_CLASSES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

// Teacher view: read-only weekly timetable, scoped to the teacher's assigned
// classes (falls back to all classes if none are assigned).
export default function TeacherScheduleViewer() {
  const [classes, setClasses] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [week, setWeek] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getTeacherAssignedClasses().then((res) => {
      if (res.success) {
        const list = res.classes.length > 0 ? res.classes : ALL_CLASSES;
        setClasses(list);
        setSelected(list[0] || "");
      } else {
        setError(res.error || "Unable to load your classes.");
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    getWeeklyScheduleForClass(selected).then((res) => {
      setWeek(res.week || {});
      setLoading(false);
    });
  }, [selected]);

  if (loading) return <p className="text-sm text-gray-500">Loading schedule...</p>;
  if (error) return <p className="text-sm text-gray-500">{error}</p>;

  return (
    <div className="bg-white p-4 rounded-xl">
      <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
        <h2 className="text-lg font-semibold">Weekly Timetable</h2>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="bg-white border border-slate-300 text-slate-800 text-xs font-bold rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-sky-500 shadow-sm cursor-pointer"
        >
          {classes.map((c) => (
            <option key={c} value={c}>
              Class {c}
            </option>
          ))}
        </select>
      </div>
      <WeeklyTimetable className={selected} week={week} />
    </div>
  );
}

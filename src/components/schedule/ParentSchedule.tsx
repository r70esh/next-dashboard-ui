"use client";

import { useEffect, useState } from "react";
import { getMyChildrenSchedules } from "@/lib/actions";
import WeeklyTimetable from "./WeeklyTimetable";
import MonthlyTimetable from "./MonthlyTimetable";

type ChildSchedule = {
  id: string;
  name: string;
  className: string;
  week: Record<string, any[]>;
};

const toggleBtn = (active: boolean) =>
  `text-xs font-bold px-3 py-1.5 transition ${active ? "bg-sky-600 text-white" : "text-slate-600 hover:bg-slate-50"}`;

// Parent view: child selector + read-only timetable (weekly or monthly).
export default function ParentSchedule() {
  const [children, setChildren] = useState<ChildSchedule[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState<"week" | "month">("week");

  useEffect(() => {
    getMyChildrenSchedules().then((res) => {
      setLoading(false);
      if (res.success) {
        setChildren(res.children);
        if (res.children.length > 0) setSelectedId(res.children[0].id);
      } else {
        setError(res.error || "Unable to load schedules.");
      }
    });
  }, []);

  if (loading) return <p className="text-sm text-gray-500">Loading schedules...</p>;
  if (error) return <p className="text-sm text-gray-500">{error}</p>;
  if (children.length === 0)
    return <p className="text-sm text-gray-500">No children linked to your account yet.</p>;

  const current = children.find((c) => c.id === selectedId) || children[0];

  return (
    <div className="bg-white p-4 rounded-xl">
      <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
        <h2 className="text-lg font-semibold">Class Timetable</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center rounded-lg overflow-hidden border border-slate-300 bg-white shadow-sm">
            <button type="button" onClick={() => setView("week")} className={toggleBtn(view === "week")}>
              Week
            </button>
            <button type="button" onClick={() => setView("month")} className={toggleBtn(view === "month")}>
              Month
            </button>
          </div>
          <select
            value={current.id}
            onChange={(e) => setSelectedId(e.target.value)}
            className="bg-white border border-slate-300 text-slate-800 text-xs font-bold rounded-lg p-2 outline-none focus:ring-2 focus:ring-sky-500 shadow-sm cursor-pointer"
          >
            {children.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — Class {c.className}
              </option>
            ))}
          </select>
        </div>
      </div>
      {view === "week" ? (
        <WeeklyTimetable className={current.className} week={current.week} />
      ) : (
        <MonthlyTimetable className={current.className} />
      )}
    </div>
  );
}

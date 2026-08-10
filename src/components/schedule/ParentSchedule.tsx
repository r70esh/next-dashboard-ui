"use client";

import { useEffect, useState } from "react";
import { getMyChildrenSchedules } from "@/lib/actions";
import WeeklyTimetable from "./WeeklyTimetable";

type ChildSchedule = {
  id: string;
  name: string;
  className: string;
  week: Record<string, any[]>;
};

// Parent view: child selector + read-only weekly timetable per child.
export default function ParentSchedule() {
  const [children, setChildren] = useState<ChildSchedule[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        <select
          value={current.id}
          onChange={(e) => setSelectedId(e.target.value)}
          className="bg-white border border-slate-300 text-slate-800 text-xs font-bold rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-sky-500 shadow-sm cursor-pointer"
        >
          {children.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} — Class {c.className}
            </option>
          ))}
        </select>
      </div>
      <WeeklyTimetable className={current.className} week={current.week} />
    </div>
  );
}

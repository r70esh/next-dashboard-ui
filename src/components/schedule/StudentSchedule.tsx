"use client";

import { useEffect, useState } from "react";
import { getMyClassSchedule } from "@/lib/actions";
import WeeklyTimetable from "./WeeklyTimetable";
import MonthlyTimetable from "./MonthlyTimetable";

const toggleBtn = (active: boolean) =>
  `text-xs font-bold px-3 py-1.5 transition ${active ? "bg-sky-600 text-white" : "text-slate-600 hover:bg-slate-50"}`;

// Student view: shows their own class timetable automatically (weekly or monthly).
export default function StudentSchedule() {
  const [data, setData] = useState<{ className: string; week: Record<string, any[]> } | null>(null);
  const [error, setError] = useState("");
  const [view, setView] = useState<"week" | "month">("week");

  useEffect(() => {
    getMyClassSchedule().then((res) => {
      if (res.success && res.className) {
        setData({ className: res.className, week: res.week });
      } else {
        setError(res.error || "Unable to load your schedule.");
      }
    });
  }, []);

  if (error) return <p className="text-sm text-gray-500">{error}</p>;
  if (!data) return <p className="text-sm text-gray-500">Loading your schedule...</p>;

  return (
    <div className="bg-white p-4 rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Class {data.className} Timetable</h2>
        <div className="flex items-center rounded-lg overflow-hidden border border-slate-300 bg-white shadow-sm">
          <button type="button" onClick={() => setView("week")} className={toggleBtn(view === "week")}>
            Week
          </button>
          <button type="button" onClick={() => setView("month")} className={toggleBtn(view === "month")}>
            Month
          </button>
        </div>
      </div>
      {view === "week" ? (
        <WeeklyTimetable className={data.className} week={data.week} />
      ) : (
        <MonthlyTimetable className={data.className} />
      )}
    </div>
  );
}

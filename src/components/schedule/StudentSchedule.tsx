"use client";

import { useEffect, useState } from "react";
import { getMyClassSchedule } from "@/lib/actions";
import WeeklyTimetable from "./WeeklyTimetable";

// Student view: shows their own class timetable automatically.
export default function StudentSchedule() {
  const [data, setData] = useState<{ className: string; week: Record<string, any[]> } | null>(null);
  const [error, setError] = useState("");

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
      </div>
      <WeeklyTimetable className={data.className} week={data.week} />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { getPeriodAttendanceStats } from "@/lib/actions";
import AttendanceChartClient from "./AttendanceChartClient";

const CLASS_OPTIONS = ["", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const PERIOD_OPTIONS = ["", "1", "2", "3", "4", "5", "6", "7", "8"];

const AttendanceChart = () => {
  const [className, setClassName] = useState("1");
  const [period, setPeriod] = useState("1");
  const [data, setData] = useState<{ name: string; present: number; absent: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getPeriodAttendanceStats(className, period).then((res: any) => {
      if (cancelled) return;
      setData(res?.data || []);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [className, period]);

  return (
    <div className="bg-white rounded-lg p-4 h-full flex flex-col">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-lg font-semibold">Attendance (This Week)</h1>
        <div className="flex items-center gap-2">
          <select
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            className="border border-slate-300 text-slate-800 text-xs font-bold rounded-lg p-1.5 outline-none focus:ring-2 focus:ring-sky-500 shadow-sm cursor-pointer bg-white"
          >
            {CLASS_OPTIONS.map((c) => (
              <option key={c || "all"} value={c}>
                {c ? `Class ${c}` : "All Classes"}
              </option>
            ))}
          </select>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="border border-slate-300 text-slate-800 text-xs font-bold rounded-lg p-1.5 outline-none focus:ring-2 focus:ring-sky-500 shadow-sm cursor-pointer bg-white"
          >
            {PERIOD_OPTIONS.map((p) => (
              <option key={p || "all"} value={p}>
                {p ? `Period ${p}` : "All Periods"}
              </option>
            ))}
          </select>
        </div>
      </div>
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-xs font-bold text-slate-400">
          Loading attendance...
        </div>
      ) : (
        <div className="flex-1 min-h-0">
          <AttendanceChartClient data={data} />
        </div>
      )}
    </div>
  );
};

export default AttendanceChart;

"use client";

import { useState, useEffect, useCallback } from "react";
import { getClassStudentsAndAttendance, bulkSaveAttendance } from "@/lib/actions";
import { useRouter } from "next/navigation";

type StudentAttendanceItem = {
  id: string;
  studentId: string;
  name: string;
  email: string;
  class: string;
  status: "present" | "absent" | "late";
};

export default function ClassAttendanceManager({
  availableClasses = ["1","2","3","4","5","6","7","8","9","10","11","12"],
}: {
  availableClasses?: string[];
}) {
  const router = useRouter();
  const [selectedClass, setSelectedClass] = useState<string>(availableClasses[0] || "1A");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [students, setStudents] = useState<StudentAttendanceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchClassStudents = useCallback(async () => {
    if (!selectedClass) return;
    setLoading(true);
    setMessage(null);
    const res = await getClassStudentsAndAttendance(selectedClass, selectedDate);
    setLoading(false);
    if (res.success) {
      setStudents(res.students);
    } else {
      setMessage({ type: "error", text: res.error || "Failed to load class students." });
    }
  }, [selectedClass, selectedDate]);

  useEffect(() => {
    fetchClassStudents();
  }, [fetchClassStudents]);

  const handleStatusChange = (studentId: string, status: "present" | "absent" | "late") => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId || s.studentId === studentId ? { ...s, status } : s))
    );
  };

  const handleMarkAll = (status: "present" | "absent" | "late") => {
    setStudents((prev) => prev.map((s) => ({ ...s, status })));
  };

  const handleSave = async () => {
    if (!students || students.length === 0) {
      setMessage({ type: "error", text: "No students to save attendance for." });
      return;
    }
    setSaving(true);
    setMessage(null);

    const payload = students.map((s) => ({
      name: s.name,
      studentId: s.studentId,
      status: s.status,
    }));

    const res = await bulkSaveAttendance(selectedClass, selectedDate, payload);
    setSaving(false);

    if (res.success) {
      setMessage({
        type: "success",
        text: `Attendance for Class ${selectedClass} on ${selectedDate} saved successfully!`,
      });
      router.refresh();
    } else {
      setMessage({ type: "error", text: res.error || "Failed to save attendance." });
    }
  };

  return (
    <div className="bg-gradient-to-r from-sky-50 via-indigo-50 to-purple-50 p-6 rounded-2xl border border-slate-200 shadow-sm mb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <span>📋</span> Take Class Attendance
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Select a class and date to mark present/absent for all students in one click.
          </p>
        </div>

        {/* SELECTORS */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-600 uppercase">Select Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-white border border-slate-300 text-slate-800 text-xs font-bold rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-sky-500 shadow-sm cursor-pointer"
            >
              {availableClasses.map((c) => (
                <option key={c} value={c}>
                  Class {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-600 uppercase">Date</label>
            <div className="bg-slate-100 border border-slate-200 text-slate-500 text-xs font-bold rounded-xl p-2.5 shadow-sm cursor-not-allowed">
              {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} (Today)
            </div>
          </div>
        </div>
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

      {/* QUICK CONTROLS & STUDENT LIST */}
      {loading ? (
        <div className="p-8 text-center text-xs font-bold text-slate-500">
          Loading students for Class {selectedClass}...
        </div>
      ) : students.length === 0 ? (
        <div className="p-6 bg-white/70 rounded-xl text-center text-slate-500 text-xs font-medium border border-slate-200">
          No students found enrolled in <strong>Class {selectedClass}</strong>.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between bg-white/80 p-3 rounded-xl border border-slate-200 text-xs">
            <span className="font-bold text-slate-700">
              Total Students: <span className="text-sky-600">{students.length}</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleMarkAll("present")}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-3 py-1.5 rounded-lg transition text-[11px]"
              >
                ✓ Mark All Present
              </button>
              <button
                type="button"
                onClick={() => handleMarkAll("absent")}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold px-3 py-1.5 rounded-lg transition text-[11px]"
              >
                ✗ Mark All Absent
              </button>
            </div>
          </div>

          {/* STUDENTS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {students.map((student) => (
              <div
                key={student.id}
                className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-3"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-800">{student.name}</span>
                  <span className="text-[11px] text-slate-500">ID: {student.studentId}</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleStatusChange(student.id, "present")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      student.status === "present"
                        ? "bg-green-600 text-white shadow"
                        : "bg-slate-100 text-slate-600 hover:bg-green-100"
                    }`}
                  >
                    Present
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange(student.id, "absent")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      student.status === "absent"
                        ? "bg-red-600 text-white shadow"
                        : "bg-slate-100 text-slate-600 hover:bg-red-100"
                    }`}
                  >
                    Absent
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange(student.id, "late")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      student.status === "late"
                        ? "bg-amber-500 text-white shadow"
                        : "bg-slate-100 text-slate-600 hover:bg-amber-100"
                    }`}
                  >
                    Late
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* SAVE BUTTON */}
          <div className="flex justify-end mt-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-extrabold text-xs px-6 py-3 rounded-xl transition shadow-md flex items-center gap-2 cursor-pointer"
            >
              <span>💾</span>
              <span>{saving ? "Saving Attendance..." : `Save Attendance for Class ${selectedClass}`}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

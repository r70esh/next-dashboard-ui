// Server component - accepts pre-fetched performance data

type PerformanceData = {
  attendancePercent: number;
  attendanceTotal: number;
  assignmentPct: number | null;
  classTestPct: number | null;
  terminalPct: number | null;
  overall: number | null;
  grade: string;
  resultDetails: Array<{
    id: string;
    subject: string;
    type: string;
    score: number;
    maxScore: number;
    percent: number;
    date: string;
    teacher: string;
  }>;
  counts: {
    assignment: number;
    class_test: number;
    terminal_exam: number;
  };
};

const gradeColor = (g: string) => {
  if (g === "A+" || g === "A") return "text-green-600";
  if (g === "B+" || g === "B") return "text-sky-600";
  if (g === "C") return "text-amber-600";
  if (g === "D") return "text-orange-600";
  return "text-red-600";
};

const barColor = (pct: number | null) => {
  if (pct === null) return "bg-slate-200";
  if (pct >= 80) return "bg-green-500";
  if (pct >= 60) return "bg-sky-500";
  if (pct >= 40) return "bg-amber-500";
  return "bg-red-500";
};

const typeLabel: Record<string, string> = {
  assignment: "📝 Assignment",
  class_test: "📋 Class Test",
  terminal_exam: "🎓 Terminal Exam",
};

export default function StudentPerformanceCard({ perf }: { perf: PerformanceData }) {
  const overall = perf.overall;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5 text-white">
        <h2 className="text-lg font-extrabold">📊 Academic Performance</h2>
        <p className="text-xs opacity-80 mt-0.5">Attendance + Assignment + Class Test + Terminal Exam</p>
      </div>

      <div className="p-5 flex flex-col gap-5">
        {/* OVERALL SCORE */}
        <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overall Score</p>
            <h1 className={`text-5xl font-black mt-1 ${gradeColor(perf.grade)}`}>
              {overall !== null ? overall + "%" : "N/A"}
            </h1>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${gradeColor(perf.grade)} bg-opacity-10`}>
              Grade: {perf.grade}
            </span>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500 font-medium">Weight Formula</p>
            <div className="text-xs text-slate-600 mt-1 space-y-0.5">
              <p>📝 Assignment: 20%</p>
              <p>📋 Class Test: 30%</p>
              <p>🎓 Terminal: 50%</p>
            </div>
          </div>
        </div>

        {/* BREAKDOWN BARS */}
        <div className="flex flex-col gap-3">
          {/* Attendance */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-slate-600">🗓️ Attendance ({perf.attendanceTotal} days recorded)</span>
              <span className={perf.attendancePercent >= 75 ? "text-green-600" : "text-red-500"}>
                {perf.attendancePercent}%
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${perf.attendancePercent >= 75 ? "bg-green-500" : "bg-red-500"}`}
                style={{ width: `${perf.attendancePercent}%` }}
              />
            </div>
          </div>

          {/* Assignment */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-slate-600">📝 Assignments ({perf.counts.assignment} submitted)</span>
              <span>{perf.assignmentPct !== null ? perf.assignmentPct + "%" : "No data"}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${barColor(perf.assignmentPct)}`}
                style={{ width: `${perf.assignmentPct ?? 0}%` }}
              />
            </div>
          </div>

          {/* Class Test */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-slate-600">📋 Class Tests ({perf.counts.class_test} taken)</span>
              <span>{perf.classTestPct !== null ? perf.classTestPct + "%" : "No data"}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${barColor(perf.classTestPct)}`}
                style={{ width: `${perf.classTestPct ?? 0}%` }}
              />
            </div>
          </div>

          {/* Terminal Exam */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-slate-600">🎓 Terminal Exams ({perf.counts.terminal_exam} given)</span>
              <span>{perf.terminalPct !== null ? perf.terminalPct + "%" : "No data"}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${barColor(perf.terminalPct)}`}
                style={{ width: `${perf.terminalPct ?? 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* RESULT HISTORY TABLE */}
        {perf.resultDetails.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-slate-700 mb-2">📄 Result History</h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-left">
                    <th className="px-3 py-2 font-bold">Subject</th>
                    <th className="px-3 py-2 font-bold">Type</th>
                    <th className="px-3 py-2 font-bold">Score</th>
                    <th className="px-3 py-2 font-bold hidden md:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {perf.resultDetails.map((r) => (
                    <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-3 py-2 font-semibold text-slate-800">{r.subject}</td>
                      <td className="px-3 py-2">
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                          {typeLabel[r.type] || r.type}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`font-black ${r.percent >= 60 ? "text-green-600" : "text-red-500"}`}>
                          {r.score}/{r.maxScore}
                        </span>
                        <span className="text-slate-400 ml-1">({r.percent}%)</span>
                      </td>
                      <td className="px-3 py-2 text-slate-400 hidden md:table-cell">{r.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {perf.resultDetails.length === 0 && (
          <p className="text-center text-slate-400 text-xs py-4 bg-slate-50 rounded-xl">
            No results published yet by teachers.
          </p>
        )}
      </div>
    </div>
  );
}

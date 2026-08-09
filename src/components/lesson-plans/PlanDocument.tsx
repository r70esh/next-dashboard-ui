import {
  BookOpen,
  CalendarDays,
  Clock,
  Users,
  Target,
  Lightbulb,
  ClipboardList,
  PenLine,
  MessageSquareQuote,
} from "lucide-react";

const BS_MONTHS = ["बैशाख", "जेठ", "असार", "साउन", "भदौ", "असोज", "कात्तिक", "मंसिर", "पुष", "माघ", "फागुन", "चैत"];
const BS_LENGTHS = [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31];

function adToBs(dateStr: string) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return dateStr;
  const target = new Date(Date.UTC(y, m - 1, d));
  let ref = new Date(Date.UTC(y, 3, 14));
  let bsYear = y + 57;
  let days = Math.round((target.getTime() - ref.getTime()) / 86400000);
  if (days < 0) {
    bsYear = y + 56;
    ref = new Date(Date.UTC(y - 1, 3, 14));
    days = Math.round((target.getTime() - ref.getTime()) / 86400000);
  }
  let monthIdx = 0;
  while (days >= BS_LENGTHS[monthIdx] && monthIdx < 11) {
    days -= BS_LENGTHS[monthIdx];
    monthIdx++;
  }
  return `${bsYear}-${String(monthIdx + 1).padStart(2, "0")}-${String(days + 1).padStart(2, "0")} (${BS_MONTHS[monthIdx]})`;
}

export default function PlanDocument({ plan }: { plan: any }) {
  const objectives: any[] = Array.isArray(plan.objectives) ? plan.objectives.filter(Boolean) : [];
  const resources: any[] = Array.isArray(plan.resources) ? plan.resources.filter(Boolean) : [];
  const activities: any[] = Array.isArray(plan.activities) ? plan.activities.filter((a: any) => a.activity) : [];
  const assessments: any[] = Array.isArray(plan.assessments) ? plan.assessments.filter((a: any) => a.method || a.criteria) : [];

  return (
    <div className="lp-print rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 p-4">
        <h1 className="text-center text-xl font-extrabold text-slate-800">पाठ योजना</h1>
        <p className="mt-1 text-center text-xs text-slate-500">{plan.subject || "—"} · {plan.class ? (plan.class.startsWith("Class") ? plan.class : `Class ${plan.class}`) : "—"}</p>
      </div>

      <dl className="mt-5 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        <div className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-indigo-500" /><span className="font-semibold text-slate-500">विषय:</span><span className="font-bold text-slate-800">{plan.subject || "—"}</span></div>
        <div className="flex items-center gap-2"><Target className="h-4 w-4 text-indigo-500" /><span className="font-semibold text-slate-500">कक्षा:</span><span className="font-bold text-slate-800">{plan.class ? (plan.class.startsWith("Class") ? plan.class : `Class ${plan.class}`) : "—"}</span></div>
        <div className="flex items-center gap-2 sm:col-span-2"><BookOpen className="h-4 w-4 text-indigo-500" /><span className="font-semibold text-slate-500">पाठ:</span><span className="font-bold text-slate-800">{plan.topic || "—"}</span></div>
        <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-indigo-500" /><span className="font-semibold text-slate-500">मिति:</span><span className="font-bold text-slate-800">{adToBs(plan.date) || plan.date || "—"}</span></div>
        <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-indigo-500" /><span className="font-semibold text-slate-500">समय:</span><span className="font-bold text-slate-800">{plan.duration || 0} मिनेट</span></div>
        <div className="flex items-center gap-2"><Users className="h-4 w-4 text-indigo-500" /><span className="font-semibold text-slate-500">विद्यार्थी संख्या:</span><span className="font-bold text-slate-800">{plan.students || 0}</span></div>
      </dl>

      {objectives.length > 0 && (
        <section className="mt-6">
          <h2 className="flex items-center gap-2 text-sm font-extrabold text-slate-700"><Target className="h-4 w-4 text-indigo-500" /> उद्देश्यहरू</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">{objectives.map((o, i) => <li key={i}>{o}</li>)}</ul>
        </section>
      )}

      {resources.length > 0 && (
        <section className="mt-6">
          <h2 className="flex items-center gap-2 text-sm font-extrabold text-slate-700"><Lightbulb className="h-4 w-4 text-indigo-500" /> शिक्षण सामग्री</h2>
          <p className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">{resources.join(", ")}</p>
        </section>
      )}

      {activities.length > 0 && (
        <section className="mt-6">
          <h2 className="flex items-center gap-2 text-sm font-extrabold text-slate-700"><ClipboardList className="h-4 w-4 text-indigo-500" /> शिक्षण प्रक्रिया</h2>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-slate-600">
            {activities.map((a, i) => (
              <li key={i}><span className="font-bold text-slate-800">{a.time || 0} min</span> — {a.activity} <span className="text-indigo-600">({a.method || "—"})</span></li>
            ))}
          </ol>
        </section>
      )}

      {assessments.length > 0 && (
        <section className="mt-6">
          <h2 className="flex items-center gap-2 text-sm font-extrabold text-slate-700"><PenLine className="h-4 w-4 text-indigo-500" /> मूल्याङ्कन</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
            {assessments.map((a, i) => <li key={i}>{a.method || "—"}{a.criteria ? ` · Criteria: ${a.criteria}` : ""}</li>)}
          </ul>
        </section>
      )}

      {plan.reflection && (
        <section className="mt-6">
          <h2 className="flex items-center gap-2 text-sm font-extrabold text-slate-700"><MessageSquareQuote className="h-4 w-4 text-indigo-500" /> शिक्षकको टिप्पणी</h2>
          <p className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">{plan.reflection}</p>
        </section>
      )}

      <div className="mt-6 border-t border-slate-100 pt-3 text-[11px] text-slate-400">
        <p>Generated on: {new Date().toLocaleDateString()} · By: {plan.ownerName || "Teacher"}</p>
        {Array.isArray(plan.sharedWith) && plan.sharedWith.length > 0 && (
          <p className="mt-1">Shared with: {plan.sharedWith.join(", ")}</p>
        )}
      </div>
    </div>
  );
}

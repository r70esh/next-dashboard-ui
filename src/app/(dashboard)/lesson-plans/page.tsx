import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDB from "@/lib/db";
import { LessonPlan } from "@/lib/models";
import { filterAndSort } from "@/lib/tableUtils";
import TableToolbar from "@/components/TableToolbar";
import PlanActions from "@/components/lesson-plans/PlanActions";
import { Plus, FileText, CalendarDays } from "lucide-react";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function LessonPlansPage({
  searchParams,
}: {
  searchParams: { search?: string; filter?: string; sort?: string };
}) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role || "";
  const userId = (session?.user as any)?.id;

  await connectToDB();
  const raw = await LessonPlan.find({}).sort({ createdAt: -1 });
  const data = JSON.parse(JSON.stringify(raw)).map((p: any) => ({ ...p, id: p._id }));

  const search = searchParams.search || "";
  const filter = searchParams.filter || "";
  const sort = searchParams.sort || "";
  const sortDir = sort.endsWith(":desc") ? "desc" : "asc";
  const sortField = sort.split(":")[0] || "";

  const filteredData = filterAndSort(data, {
    search,
    filter,
    searchFields: ["topic", "subject", "grade", "ownerName"],
    filterField: (p) => p.subject,
    sortField: sortField || undefined,
    sortDir,
  });

  const subjectOptions = Array.from(
    new Set(data.map((p: any) => p.subject).filter(Boolean))
  ).map((s) => ({ value: String(s), label: String(s) }));

  return (
    <Suspense fallback={null}>
      <div className="m-4 mt-0 flex-1 p-0">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Lesson Plans</h1>
            <p className="text-xs text-slate-500">
              {role === "teacher"
                ? "Create your own lesson plans and browse others as reference."
                : "Browse all teachers' lesson plans."}
            </p>
          </div>
          {role === "teacher" && (
            <Link
              href="/lesson-plans/new"
              className="flex items-center gap-1.5 self-start rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" /> Create Lesson Plan
            </Link>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-2">
            <TableToolbar
              searchPlaceholder="Search lesson plans..."
              filterOptions={subjectOptions}
              filterPlaceholder="Subject"
              sortOptions={[
                { value: "topic:asc", label: "Topic (A-Z)" },
                { value: "topic:desc", label: "Topic (Z-A)" },
                { value: "date:asc", label: "Date (Oldest)" },
                { value: "date:desc", label: "Date (Newest)" },
              ]}
            />
          </div>

          {filteredData.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <FileText className="h-10 w-10 text-slate-300" />
              <p className="text-sm font-semibold text-slate-500">No lesson plans found.</p>
              {role === "teacher" && (
                <Link href="/lesson-plans/new" className="text-xs font-bold text-indigo-600 hover:underline">
                  Create your first lesson plan →
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-400">
                    <th className="py-2.5 pr-3 font-semibold">Topic</th>
                    <th className="py-2.5 pr-3 font-semibold">Subject</th>
                    <th className="py-2.5 pr-3 font-semibold">Grade</th>
                    <th className="py-2.5 pr-3 font-semibold">Teacher</th>
                    <th className="py-2.5 pr-3 font-semibold">Date</th>
                    <th className="py-2.5 pr-3 font-semibold">Status</th>
                    <th className="py-2.5 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((p: any) => (
                    <tr key={p.id} className="border-b border-slate-100 transition hover:bg-indigo-50/40">
                      <td className="py-3 pr-3">
                        <p className="font-bold text-slate-800">{p.topic || "Untitled"}</p>
                        <p className="flex items-center gap-1 text-[11px] text-slate-400">
                          <CalendarDays className="h-3 w-3" /> {p.date || "No date"}{" "}
                          · {p.duration || 0} min
                        </p>
                      </td>
                      <td className="py-3 pr-3">
                        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700">
                          {p.subject || "—"}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-xs text-slate-600">{p.grade || "—"}</td>
                      <td className="py-3 pr-3 text-xs text-slate-600">{p.ownerName || "—"}</td>
                      <td className="py-3 pr-3 text-xs text-slate-600">{p.date || "—"}</td>
                      <td className="py-3 pr-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                            p.status === "published"
                              ? "bg-green-50 text-green-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {p.status || "draft"}
                        </span>
                      </td>
                      <td className="py-3">
                        <PlanActions id={p.id} isOwner={role === "teacher" && p.ownerId === userId} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Suspense>
  );
}

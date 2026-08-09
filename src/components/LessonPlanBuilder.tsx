"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createLessonPlan,
  updateLessonPlan,
  duplicateLessonPlan,
  shareLessonPlan,
} from "@/lib/actions";
import {
  Plus,
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Copy,
  Share2,
  Printer,
  Wand2,
  Target,
  Clock,
  Users,
  GripVertical,
  Check,
  FileText,
  Link2,
  Upload,
  BookOpen,
  MessageSquareQuote,
  Lightbulb,
  PlayCircle,
  ClipboardList,
  PenLine,
} from "lucide-react";

/* ── Nepali calendar (approximate AD -> BS conversion) ───────────────────── */
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
  const day = days + 1;
  return `${bsYear}-${String(monthIdx + 1).padStart(2, "0")}-${String(day).padStart(2, "0")} (${BS_MONTHS[monthIdx]})`;
}

/* ── Templates ────────────────────────────────────────────────────────────── */
type Template = {
  key: string;
  title: string;
  subject: string;
  grade: string;
  class: string;
  duration: number;
  topics: string[];
};

const TEMPLATES: Template[] = [
  { key: "english", title: "English Lesson Plan", subject: "English", grade: "7", class: "7", duration: 45, topics: ["Narration", "Verb Tenses", "Reading Comprehension"] },
  { key: "math", title: "Mathematics Lesson Plan", subject: "Mathematics", grade: "8", class: "8", duration: 45, topics: ["Algebraic Equations", "Geometry Basics", "Set Theory"] },
  { key: "science", title: "Science Lesson Plan", subject: "Science", grade: "6", class: "6", duration: 45, topics: ["Photosynthesis", "Electricity", "States of Matter"] },
  { key: "nepali", title: "Nepali Lesson Plan", subject: "Nepali", grade: "8", class: "8", duration: 45, topics: ["हाम्रो भाषा, हाम्रो पहिचान", "व्याकरण: सङ्ख्या", "कविता वाचन"] },
  { key: "social", title: "Social Studies Lesson Plan", subject: "Social Studies", grade: "9", class: "9", duration: 45, topics: ["Nepal's Constitution", "Local Governance", "Map Reading"] },
];

/* ── AI helper generators (local, deterministic) ─────────────────────────── */
const SUBJECT_RESOURCES: Record<string, string[]> = {
  Nepali: ["पाठ्यपुस्तक", "बोर्ड", "चार्ट", "भिडियो", "मार्कर", "प्रोजेक्टर"],
  Mathematics: ["Textbook", "Whiteboard", "Worksheet", "Geometric Set", "Projector"],
  Science: ["Textbook", "Charts", "Lab Equipment", "Video", "Projector"],
  English: ["Textbook", "Whiteboard", "Audio Player", "Flashcards", "Projector"],
  "Social Studies": ["Textbook", "Maps", "Charts", "Video", "Projector"],
  default: ["Textbook", "Whiteboard", "Charts", "Markers", "Projector"],
};

const METHODS = ["Class Discussion", "Reading & Discussion", "Group Activity", "Demonstration", "Q&A", "Pair Work", "Lecture", "Problem Solving"];

function aiGenerate(input: { subject: string; topic: string; duration: number; style: string }) {
  const subject = input.subject || "Nepali";
  const topic = input.topic || "यस पाठको शीर्षक";
  const duration = input.duration || 45;
  const res = SUBJECT_RESOURCES[subject] || SUBJECT_RESOURCES.default;
  const isNep = subject.toLowerCase() === "nepali";

  const objectives = isNep
    ? [
        `${topic} को महत्व व्याख्या गर्न सक्नेछन्।`,
        "पाठका मुख्य बुँदाहरू पहिचान गर्न सक्नेछन्।",
        "आफ्नो विचार स्पष्ट रूपमा व्यक्त गर्न सक्नेछन्।",
      ]
    : [
        `Explain the importance of "${topic}".`,
        "Identify the key points of the lesson.",
        "Express ideas clearly in their own words.",
      ];

  const t1 = Math.max(5, Math.round(duration * 0.22));
  const t2 = Math.max(10, Math.round(duration * 0.45));
  const t3 = Math.max(5, Math.round(duration * 0.2));
  const t4 = Math.max(5, duration - t1 - t2 - t3);

  const activities = [
    { time: t1, activity: isNep ? "पाठको शीर्षक माथि छलफल र विद्यार्थीको पूर्व ज्ञान बुझ्ने" : "Discuss the topic title and assess prior knowledge", method: "Class Discussion" },
    { time: t2, activity: isNep ? "पाठ वाचन, अर्थ बुझ्ने र मुख्य बुँदाहरू छलफल गर्ने" : "Read the lesson, understand meaning, and discuss key points", method: "Reading & Discussion" },
    { time: t3, activity: isNep ? "समूहगत गतिविधि: मुख्य बुँदाहरू लेख्ने र प्रस्तुत गर्ने" : "Group activity: write and present the key points", method: "Group Activity" },
    { time: t4, activity: isNep ? "निष्कर्ष निकाल्ने र प्रश्नोत्तर" : "Conclusion and question-answer session", method: "Q&A" },
  ];

  return {
    objectives,
    resources: res,
    activities,
    assessments: [
      { method: "Oral Questions", tool: "Questionnaire", criteria: "Understanding, Participation" },
    ],
    reflection: isNep
      ? "विद्यार्थीहरूले सक्रिय रूपमा सहभागिता जनाएका छन्। कठिन भएका बुँदाहरू अर्को कक्षामा पुन: अभ्यास गराउनुपर्ने देखिएको छ।"
      : "Students participated actively. Difficult points should be revisited in the next class.",
  };
}

function improvePlan(prev: { objectives: string[]; reflection: string; assessments: any[] }) {
  return {
    objectives: [...(prev.objectives || []), "पाठसँग सम्बन्धित व्यावहारिक अभ्यास गरेर देखाउन सक्नेछन्।"],
    reflection: (prev.reflection || "") + " अर्को कक्षाको लागि विद्यार्थीको स्तर अनुसार थप अभ्यासहरू तयार गर्ने।",
    assessments: [
      ...(prev.assessments || []),
      { method: "Written Assignment", tool: "Worksheet", criteria: "Accuracy, Neatness" },
    ],
  };
}

/* ── UI primitives ────────────────────────────────────────────────────────── */
const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

const labelCls = "mb-1 block text-xs font-semibold text-slate-500";

function Section({
  icon,
  title,
  defaultOpen = true,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4"
      >
        <span className="flex items-center gap-3 text-sm font-bold text-slate-800">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            {icon}
          </span>
          {title}
        </span>
        {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove?: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
      {label}
      {onRemove && (
        <button type="button" onClick={onRemove} className="text-indigo-400 hover:text-red-500">
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}

/* ── Main component ───────────────────────────────────────────────────────── */
export default function LessonPlanBuilder({
  mode,
  planId,
  initial,
}: {
  mode: "create" | "edit";
  planId?: string;
  initial?: any;
}) {
  const router = useRouter();

  const [subject, setSubject] = useState<string>(initial?.subject || "");
  const [grade, setGrade] = useState<string>(initial?.class || initial?.grade || "");
  const [topic, setTopic] = useState<string>(initial?.topic || "");
  const [date, setDate] = useState<string>(initial?.date || "");
  const [duration, setDuration] = useState<number>(initial?.duration || 45);
  const [students, setStudents] = useState<number>(initial?.students || 0);
  const [objectives, setObjectives] = useState<string[]>(initial?.objectives || []);
  const [resources, setResources] = useState<string[]>(initial?.resources || []);
  const [resourceLinks, setResourceLinks] = useState<string[]>(initial?.resourceLinks || []);
  const [activities, setActivities] = useState<any[]>(initial?.activities || []);
  const [assessments, setAssessments] = useState<any[]>(initial?.assessments || []);
  const [reflection, setReflection] = useState(initial?.reflection || "");
  const [status, setStatus] = useState<"draft" | "published">(initial?.status || "draft");

  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState("");

  const [aiOpen, setAiOpen] = useState(false);
  const [aiSubject, setAiSubject] = useState("");
  const [aiGrade, setAiGrade] = useState("");
  const [aiTopic, setAiTopic] = useState("");
  const [aiDuration, setAiDuration] = useState(45);
  const [aiStyle, setAiStyle] = useState("Structured & Interactive");

  const [templateOpen, setTemplateOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareName, setShareName] = useState("");
  const [toast, setToast] = useState("");

  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const mounted = useRef(false);

  const payload = useMemo(
    () => ({
      subject,
      grade,
      class: grade,
      topic,
      date,
      duration,
      students,
      objectives,
      resources,
      resourceLinks,
      activities,
      assessments,
      reflection,
      status,
    }),
    [subject, grade, topic, date, duration, students, objectives, resources, resourceLinks, activities, assessments, reflection, status]
  );

  /* Autosave (edit mode) */
  useEffect(() => {
    if (mode !== "edit" || !planId) return;
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    setSaveMsg("saving");
    const t = setTimeout(async () => {
      const res = await updateLessonPlan(planId, payload);
      setSaveMsg(res.success ? "saved" : "idle");
      if (!res.success) setError(res.error || "Autosave failed.");
    }, 1200);
    return () => clearTimeout(t);
  }, [payload, mode, planId]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const showToast = (msg: string) => setToast(msg);

  const totalDuration = activities.reduce((s, a) => s + (Number(a.time) || 0), 0);

  const updateActivity = (idx: number, field: "time" | "activity" | "method", value: string | number) => {
    setActivities((prev) => prev.map((a, i) => (i === idx ? { ...a, [field]: field === "time" ? Number(value) || 0 : value } : a)));
  };

  const moveActivity = (idx: number, dir: -1 | 1) => {
    setActivities((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const handleDrop = (targetIdx: number) => {
    if (dragIdx === null || dragIdx === targetIdx) return;
    setActivities((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(targetIdx, 0, moved);
      return next;
    });
    setDragIdx(null);
  };

  const handleSubmit = async (publish: boolean) => {
    setError("");
    setSaving(true);
    const res = await createLessonPlan({ ...payload, status: publish ? "published" : "draft" });
    setSaving(false);
    if (res.success && res.id) {
      showToast(publish ? "Lesson plan published!" : "Draft saved!");
      router.push(`/lesson-plans/${res.id}`);
    } else {
      setError(res.error || "Something went wrong.");
    }
  };

  const handleDuplicate = async () => {
    if (!planId) return;
    const res = await duplicateLessonPlan(planId);
    if (res.success && res.id) {
      showToast("Lesson plan duplicated!");
      router.push(`/lesson-plans/${res.id}/edit`);
    } else {
      setError(res.error || "Could not duplicate.");
    }
  };

  const handleShare = async () => {
    if (!planId) return;
    const res = await shareLessonPlan(planId, shareName);
    if (res.success) {
      setShareOpen(false);
      setShareName("");
      showToast(`Shared with ${shareName}`);
    } else {
      setError(res.error || "Could not share.");
    }
  };

  const handlePrint = () => window.print();

  const applyAi = () => {
    const g = aiGenerate({ subject: aiSubject || subject, topic: aiTopic || topic, duration: aiDuration || duration, style: aiStyle });
    setSubject((s) => s || aiSubject);
    setGrade((g2) => g2 || aiGrade);
    setTopic((t) => t || aiTopic);
    setDuration((d) => aiDuration || d);
    setObjectives(g.objectives);
    setResources(g.resources);
    setActivities(g.activities);
    setAssessments(g.assessments);
    setReflection(g.reflection);
    setAiOpen(false);
    showToast("AI generated your lesson plan ✨");
  };

  const applyImprove = () => {
    const improved = improvePlan({ objectives, reflection, assessments });
    setObjectives(improved.objectives);
    setReflection(improved.reflection);
    setAssessments(improved.assessments);
    showToast("Lesson plan improved ✨");
  };

  const applyActivities = () => {
    const g = aiGenerate({ subject, topic, duration, style: aiStyle });
    setActivities(g.activities);
    setResources((r) => (r.length ? r : g.resources));
    showToast("Activities generated ✨");
  };

  const applyTemplate = (t: Template) => {
    setSubject(t.subject);
    setGrade(t.grade);
    setDuration(t.duration);
    setTopic(t.topics[0]);
    setTemplateOpen(false);
    showToast(`Template "${t.title}" applied`);
  };

  const quickActions = [
    { label: "Use Template", icon: <FileText className="h-4 w-4" />, onClick: () => setTemplateOpen(true) },
    { label: "Duplicate Plan", icon: <Copy className="h-4 w-4" />, onClick: handleDuplicate, disabled: mode !== "edit" },
    { label: "Share Plan", icon: <Share2 className="h-4 w-4" />, onClick: () => setShareOpen(true), disabled: mode !== "edit" },
    { label: "Download as PDF", icon: <Printer className="h-4 w-4" />, onClick: handlePrint },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .lp-print, .lp-print * { visibility: visible; }
          .lp-print { position: absolute; left: 0; top: 0; width: 100%; padding: 24px; }
        }
      `}</style>

      {/* Top bar */}
      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1 text-[11px] text-slate-400">
              Dashboard <span>/</span> Lesson Plans <span>/</span>
              <span className="font-semibold text-indigo-600">{mode === "create" ? "Create New" : "Edit"}</span>
            </p>
            <h1 className="truncate text-lg font-bold text-slate-800">
              {mode === "create" ? "Create Lesson Plan" : topic || "Edit Lesson Plan"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {mode === "edit" && (
              <span className="hidden items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 sm:flex">
                {saveMsg === "saving" ? "Saving..." : saveMsg === "saved" ? <><Check className="h-3 w-3 text-green-600" /> Saved</> : "Autosave on"}
              </span>
            )}
            <button
              onClick={() => handleSubmit(false)}
              disabled={saving}
              className="hidden items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 sm:flex"
            >
              Save Draft
            </button>
            <button
              onClick={() => handleSubmit(true)}
              disabled={saving}
              className="flex items-center gap-1 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {mode === "create" ? (saving ? "Creating..." : "Create Lesson Plan") : "Publish"}
            </button>
          </div>
        </div>
      </div>

      {/* AI banner */}
      <div className="mx-auto mt-4 max-w-7xl px-4">
        <div className="flex flex-col items-start gap-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-5 text-white shadow-lg sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold">AI Assistant</p>
              <p className="text-xs text-indigo-100">Generate a complete lesson plan in seconds, tuned for Nepali classrooms.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setAiOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-bold text-indigo-700 transition hover:bg-indigo-50"
            >
              <Sparkles className="h-3.5 w-3.5" /> Generate with AI
            </button>
            <button
              onClick={applyImprove}
              className="flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/25"
            >
              <Wand2 className="h-3.5 w-3.5" /> Improve My Plan
            </button>
            <button
              onClick={applyActivities}
              className="flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/25"
            >
              <PlayCircle className="h-3.5 w-3.5" /> Generate Activities
            </button>
          </div>
        </div>
      </div>

      {/* Error + toast */}
      {error && (
        <div className="mx-auto mt-3 max-w-7xl px-4">
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-600">{error}</div>
        </div>
      )}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-xl">
          <Check className="h-3.5 w-3.5 text-green-400" /> {toast}
        </div>
      )}

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-3">
        {/* MAIN FORM */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {quickActions.map((qa) => (
              <button
                key={qa.label}
                onClick={qa.onClick}
                disabled={qa.disabled}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 py-2.5 text-[11px] font-bold text-slate-600 shadow-sm transition hover:border-indigo-300 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {qa.icon} {qa.label}
              </button>
            ))}
          </div>

          {/* 1. Basic Information */}
          <Section icon={<BookOpen className="h-4 w-4" />} title="Basic Information">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Subject</label>
                <select value={subject} onChange={(e) => setSubject(e.target.value)} className={inputCls}>
                  <option value="">Select subject</option>
                  {["Nepali", "English", "Mathematics", "Science", "Social Studies", "Health & Physical", "Computer"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Class Level</label>
                <select value={grade} onChange={(e) => setGrade(e.target.value)} className={inputCls}>
                  <option value="">Select class</option>
                  {Array.from({ length: 12 }, (_, i) => ({
                    value: String(i + 1),
                    label: `Class ${i + 1}`
                  })).map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Topic / Lesson Title</label>
                <input value={topic} onChange={(e) => setTopic(e.target.value)} className={inputCls} placeholder="e.g. पाठ ९: हाम्रो भाषा, हाम्रो पहिचान" />
              </div>
              <div>
                <label className={labelCls}>Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Duration (min)</label>
                  <input type="number" min={1} value={duration} onChange={(e) => setDuration(Number(e.target.value) || 0)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Students</label>
                  <input type="number" min={0} value={students} onChange={(e) => setStudents(Number(e.target.value) || 0)} className={inputCls} />
                </div>
              </div>
            </div>
          </Section>

          {/* 2. Learning Objectives */}
          <Section icon={<Target className="h-4 w-4" />} title="Learning Objectives">
            <p className="mb-3 text-xs text-slate-500">By the end of this lesson, students will be able to:</p>
            <div className="flex flex-col gap-2">
              {objectives.map((obj, i) => (
                <div key={i} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <input type="checkbox" checked readOnly className="h-4 w-4 rounded accent-indigo-600" />
                  <input
                    value={obj}
                    onChange={(e) => setObjectives((prev) => prev.map((o, j) => (j === i ? e.target.value : o)))}
                    className="flex-1 bg-transparent text-sm text-slate-700 outline-none"
                  />
                  <button type="button" onClick={() => setObjectives((prev) => prev.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setObjectives((prev) => [...prev, ""])}
              className="mt-3 flex items-center gap-1.5 rounded-xl border border-dashed border-indigo-300 px-3 py-2 text-xs font-bold text-indigo-600 transition hover:bg-indigo-50"
            >
              <Plus className="h-3.5 w-3.5" /> Add Objective
            </button>
          </Section>

          {/* 3. Materials & Resources */}
          <Section icon={<Lightbulb className="h-4 w-4" />} title="Learning Materials & Resources">
            <div className="flex flex-wrap gap-2">
              {resources.map((r, i) => (
                <Chip key={i} label={r} onRemove={() => setResources((prev) => prev.filter((_, j) => j !== i))} />
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                value={resourceLinks[0] || ""}
                onChange={(e) => setResourceLinks([e.target.value])}
                className={inputCls}
                placeholder="Add YouTube / video / resource link"
              />
              <button
                type="button"
                onClick={() => {
                  const v = resourceLinks[0] || "";
                  if (v.trim()) {
                    const name = v.includes("youtube") ? "Video" : "Web link";
                    setResources((prev) => (prev.includes(name) ? prev : [...prev, name]));
                    setResourceLinks([""]);
                  }
                }}
                className="flex items-center gap-1 rounded-xl bg-indigo-600 px-3 text-xs font-bold text-white hover:bg-indigo-700"
              >
                <Link2 className="h-3.5 w-3.5" /> Add Link
              </button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <input
                value=""
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const v = (e.target as HTMLInputElement).value.trim();
                    if (v) setResources((prev) => [...prev, v]);
                    (e.target as HTMLInputElement).value = "";
                  }
                }}
                className={inputCls + " max-w-[220px]"}
                placeholder="Type a resource, press Enter"
              />
              <button type="button" className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
                <Upload className="h-3.5 w-3.5" /> Upload PDF / Image
              </button>
              <button type="button" className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
                <PlayCircle className="h-3.5 w-3.5" /> Attach Video
              </button>
            </div>
          </Section>

          {/* 4. Teaching Activities */}
          <Section icon={<ClipboardList className="h-4 w-4" />} title="Teaching Activities / Procedures">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-xs">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-slate-400">
                    <th className="py-2 pr-2">Time</th>
                    <th className="py-2 pr-2">Activity</th>
                    <th className="py-2 pr-2">Teaching Method</th>
                    <th className="py-2 pr-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((act, i) => (
                    <tr key={i} className="border-t border-slate-100" draggable onDragStart={() => setDragIdx(i)} onDragOver={(e) => e.preventDefault()} onDrop={() => handleDrop(i)}>
                      <td className="py-2 pr-2">
                        <input type="number" min={0} value={act.time} onChange={(e) => updateActivity(i, "time", e.target.value)} className={inputCls + " w-16"} />
                      </td>
                      <td className="py-2 pr-2">
                        <input value={act.activity} onChange={(e) => updateActivity(i, "activity", e.target.value)} className={inputCls} />
                      </td>
                      <td className="py-2 pr-2">
                        <select value={act.method} onChange={(e) => updateActivity(i, "method", e.target.value)} className={inputCls}>
                          <option value="">Method</option>
                          {METHODS.map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2">
                        <div className="flex items-center gap-1">
                          <GripVertical className="h-4 w-4 cursor-grab text-slate-300" />
                          <button type="button" onClick={() => moveActivity(i, -1)} className="rounded p-1 text-slate-400 hover:text-slate-700"><ChevronUp className="h-4 w-4" /></button>
                          <button type="button" onClick={() => moveActivity(i, 1)} className="rounded p-1 text-slate-400 hover:text-slate-700"><ChevronDown className="h-4 w-4" /></button>
                          <button type="button" onClick={() => setActivities((prev) => prev.filter((_, j) => j !== i))} className="rounded p-1 text-slate-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              onClick={() => setActivities((prev) => [...prev, { time: 5, activity: "", method: "" }])}
              className="mt-3 flex items-center gap-1.5 rounded-xl border border-dashed border-indigo-300 px-3 py-2 text-xs font-bold text-indigo-600 transition hover:bg-indigo-50"
            >
              <Plus className="h-3.5 w-3.5" /> Add Activity
            </button>
            <div className="mt-3 flex items-center gap-2 text-xs font-bold text-slate-600">
              <Clock className="h-4 w-4 text-indigo-500" /> Total: {totalDuration} / {duration} minutes
            </div>
          </Section>

          {/* 5. Assessment */}
          <Section icon={<PenLine className="h-4 w-4" />} title="Assessment / Evaluation">
            <div className="flex flex-col gap-3">
              {assessments.map((a, i) => (
                <div key={i} className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-3">
                  <input value={a.method} onChange={(e) => setAssessments((prev) => prev.map((x, j) => (j === i ? { ...x, method: e.target.value } : x)))} className={inputCls} placeholder="Method e.g. Oral Questions" />
                  <input value={a.tool} onChange={(e) => setAssessments((prev) => prev.map((x, j) => (j === i ? { ...x, tool: e.target.value } : x)))} className={inputCls} placeholder="Tool e.g. Questionnaire" />
                  <div className="flex gap-1">
                    <input value={a.criteria} onChange={(e) => setAssessments((prev) => prev.map((x, j) => (j === i ? { ...x, criteria: e.target.value } : x)))} className={inputCls} placeholder="Criteria" />
                    <button type="button" onClick={() => setAssessments((prev) => prev.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setAssessments((prev) => [...prev, { method: "", tool: "", criteria: "" }])}
              className="mt-3 flex items-center gap-1.5 rounded-xl border border-dashed border-indigo-300 px-3 py-2 text-xs font-bold text-indigo-600 transition hover:bg-indigo-50"
            >
              <Plus className="h-3.5 w-3.5" /> Add Assessment
            </button>
          </Section>

          {/* 6. Reflection */}
          <Section icon={<MessageSquareQuote className="h-4 w-4" />} title="Teacher Reflection / Remarks">
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              rows={4}
              className={inputCls}
              placeholder="विद्यार्थीहरूको सहभागिता, कठिनाइ तथा अर्को कक्षामा सुधार गर्नुपर्ने पक्षहरू लेख्नुहोस्..."
            />
          </Section>
        </div>

        {/* RIGHT: LIVE PREVIEW */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 flex flex-col gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <h2 className="text-sm font-bold text-slate-800">Lesson Plan Preview</h2>
                <button onClick={handlePrint} className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-indigo-700">
                  <Printer className="h-3.5 w-3.5" /> Print / PDF
                </button>
              </div>

              <div className="lp-print p-5">
                <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 p-4">
                  <h3 className="text-center text-lg font-extrabold text-slate-800">पाठ योजना</h3>
                  <p className="mt-1 text-center text-[11px] text-slate-500">{subject} · {grade ? (grade.startsWith("Class") ? grade : `Class ${grade}`) : "—"}</p>
                </div>

                <dl className="mt-4 space-y-1.5 text-xs">
                  <div className="flex justify-between gap-2"><dt className="font-semibold text-slate-500">विषय:</dt><dd className="text-right font-bold">{subject || "—"}</dd></div>
                  <div className="flex justify-between gap-2"><dt className="font-semibold text-slate-500">कक्षा:</dt><dd className="text-right font-bold">{grade ? (grade.startsWith("Class") ? grade : `Class ${grade}`) : "—"}</dd></div>
                  <div className="flex justify-between gap-2"><dt className="font-semibold text-slate-500">पाठ:</dt><dd className="text-right font-bold">{topic || "—"}</dd></div>
                  <div className="flex justify-between gap-2"><dt className="font-semibold text-slate-500">मिति:</dt><dd className="text-right font-bold">{adToBs(date) || date || "—"}</dd></div>
                  <div className="flex justify-between gap-2"><dt className="font-semibold text-slate-500">समय:</dt><dd className="text-right font-bold">{duration} मिनेट</dd></div>
                  <div className="flex justify-between gap-2"><dt className="font-semibold text-slate-500">विद्यार्थी संख्या:</dt><dd className="text-right font-bold">{students || 0}</dd></div>
                </dl>

                {objectives.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-xs font-extrabold text-slate-700">उद्देश्यहरू</h4>
                    <ul className="mt-1.5 list-disc space-y-1 pl-4 text-[11px] text-slate-600">
                      {objectives.filter(Boolean).map((o, i) => <li key={i}>{o}</li>)}
                    </ul>
                  </div>
                )}

                {resources.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-xs font-extrabold text-slate-700">शिक्षण सामग्री</h4>
                    <p className="mt-1 text-[11px] text-slate-600">{resources.join(", ")}</p>
                  </div>
                )}

                {activities.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-xs font-extrabold text-slate-700">शिक्षण प्रक्रिया</h4>
                    <ol className="mt-1.5 list-decimal space-y-1 pl-4 text-[11px] text-slate-600">
                      {activities.filter((a) => a.activity).map((a, i) => (
                        <li key={i}><span className="font-bold text-slate-700">{a.time || 0} min</span> — {a.activity} <span className="text-indigo-600">({a.method || "—"})</span></li>
                      ))}
                    </ol>
                  </div>
                )}

                {assessments.length > 0 && assessments.some((a) => a.method || a.criteria) && (
                  <div className="mt-4">
                    <h4 className="text-xs font-extrabold text-slate-700">मूल्याङ्कन</h4>
                    <ul className="mt-1.5 space-y-1 pl-4 text-[11px] text-slate-600">
                      {assessments.filter((a) => a.method || a.criteria).map((a, i) => (
                        <li key={i}>{a.method || "—"}{a.criteria ? ` · Criteria: ${a.criteria}` : ""}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {reflection && (
                  <div className="mt-4">
                    <h4 className="text-xs font-extrabold text-slate-700">शिक्षकको टिप्पणी</h4>
                    <p className="mt-1 text-[11px] text-slate-600">{reflection}</p>
                  </div>
                )}

                <div className="mt-5 border-t border-slate-100 pt-3 text-[10px] text-slate-400" suppressHydrationWarning>
                  Generated on: {new Date().toLocaleDateString()} · By: {initial?.ownerName || "Teacher"}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-indigo-50 to-violet-50 p-4 shadow-sm">
              <p className="flex items-center gap-1.5 text-xs font-bold text-indigo-700">
                <Lightbulb className="h-3.5 w-3.5" /> Teacher Tip
              </p>
              <p className="mt-1 text-[11px] text-slate-600">Use templates to save time and create effective lesson plans quickly. Drag activities to reorder the teaching procedure.</p>
            </div>
          </div>
        </div>
      </div>

      {/* AI MODAL */}
      {aiOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-base font-bold text-slate-800"><Sparkles className="h-4 w-4 text-indigo-600" /> Generate Lesson Plan with AI</h3>
              <button onClick={() => setAiOpen(false)} className="text-slate-400 hover:text-slate-700"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Subject</label>
                <select value={aiSubject} onChange={(e) => setAiSubject(e.target.value)} className={inputCls}>
                  <option value="">Select</option>
                  {["Nepali", "English", "Mathematics", "Science", "Social Studies", "Health & Physical", "Computer"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Class</label>
                <select value={aiGrade} onChange={(e) => setAiGrade(e.target.value)} className={inputCls}>
                  <option value="">Select</option>
                  {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((g) => (
                    <option key={g} value={g}>Class {g}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Topic</label>
                <input value={aiTopic} onChange={(e) => setAiTopic(e.target.value)} className={inputCls} placeholder="e.g. हाम्रो भाषा, हाम्रो पहिचान" />
              </div>
              <div>
                <label className={labelCls}>Duration (min)</label>
                <input type="number" value={aiDuration} onChange={(e) => setAiDuration(Number(e.target.value) || 45)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Teaching style</label>
                <select value={aiStyle} onChange={(e) => setAiStyle(e.target.value)} className={inputCls}>
                  {["Structured & Interactive", "Activity Based", "Lecture Driven", "Student Centered", "Inquiry Based"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setAiOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={applyAi} className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700">
                <Sparkles className="h-3.5 w-3.5" /> Generate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TEMPLATE MODAL */}
      {templateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800">Templates for You</h3>
              <button onClick={() => setTemplateOpen(false)} className="text-slate-400 hover:text-slate-700"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => applyTemplate(t)}
                  className="rounded-2xl border border-slate-200 p-4 text-left shadow-sm transition hover:border-indigo-300 hover:shadow-md"
                >
                  <p className="flex items-center gap-2 text-sm font-bold text-slate-800">
                    <FileText className="h-4 w-4 text-indigo-500" /> {t.title}
                  </p>
                  <p className="mt-2 text-[11px] text-slate-500">Class {t.class} · {t.duration} min</p>
                  <p className="mt-1 truncate text-[11px] text-indigo-600">{t.topics.join(" · ")}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SHARE MODAL */}
      {shareOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-base font-bold text-slate-800"><Share2 className="h-4 w-4 text-indigo-600" /> Share Plan</h3>
              <button onClick={() => setShareOpen(false)} className="text-slate-400 hover:text-slate-700"><X className="h-5 w-5" /></button>
            </div>
            <label className={labelCls + " mt-4"}>Share with another teacher (by name)</label>
            <input value={shareName} onChange={(e) => setShareName(e.target.value)} className={inputCls} placeholder="e.g. Sita Sharma" />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShareOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={handleShare} className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700">Share</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

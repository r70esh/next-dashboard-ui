"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createExam, updateExam, getTeacherScope } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

const CLASS_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i + 1));

const schema = z.object({
  subject: z.string().min(2, { message: "Subject is required!" }),
  class: z.enum(["1","2","3","4","5","6","7","8","9","10","11","12"], {
    errorMap: () => ({ message: "Please select a class (1 to 12)." }),
  }),
  teacher: z.string().min(2, { message: "Teacher name is required!" }),
  type: z.enum(["class_test", "terminal_exam"]),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Valid date required!" }),
});

type Inputs = z.infer<typeof schema>;

const inputCls =
  "w-full ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm focus:outline-none focus:ring-mahankalSky";
const labelCls = "text-xs text-gray-500 font-medium";

const typeMeta = {
  class_test: { label: "Class Test", emoji: "📋", desc: "One specific subject", color: "bg-amber-100 text-amber-800 border-amber-300" },
  terminal_exam: { label: "Terminal Exam", emoji: "🎓", desc: "All subjects (admin only)", color: "bg-purple-100 text-purple-800 border-purple-300" },
};

const ExamForm = ({ type, data }: { type: "create" | "update"; data?: any }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { data: session } = useSession();
  const isTeacher = (session?.user as any)?.role === "teacher";
  const creatorName = session?.user?.name || "";
  const [scopeSubjects, setScopeSubjects] = useState<string[]>([]);
  const [scopeClasses, setScopeClasses] = useState<string[]>([]);

  // Load the teacher's assigned subjects/classes to restrict the form.
  useEffect(() => {
    if (!isTeacher) return;
    getTeacherScope().then((res: any) => {
      setScopeSubjects((res?.subjects || []).map(String));
      setScopeClasses((res?.classes || []).map(String));
    });
  }, [isTeacher]);

  // Normalize existing class value to plain number string
  const defaultClass = (() => {
    const raw = String(data?.class || "");
    const num = raw.replace(/[^0-9]/g, "");
    return CLASS_OPTIONS.includes(num) ? num : "";
  })();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<Inputs>({
    resolver: zodResolver(schema),
    defaultValues: {
      subject: data?.subject || "",
      class: (defaultClass as any) || "",
      teacher: type === "create" ? creatorName : data?.teacher || "",
      type: data?.type === "terminal_exam" ? "terminal_exam" : "class_test",
      date: data?.date ? new Date(data.date).toISOString().slice(0, 10) : "",
    },
  });

  const selectedType = watch("type");

  // Auto-fill the logged-in teacher's name and keep it locked.
  useEffect(() => {
    if (isTeacher && creatorName) {
      setValue("teacher", creatorName, { shouldValidate: true });
    }
  }, [isTeacher, creatorName, setValue]);

  // Auto-select a value when a teacher has exactly one allowed option.
  useEffect(() => {
    if (!isTeacher) return;
    if (selectedType === "class_test" && scopeSubjects.length > 0 && !(scopeSubjects.length > 1)) {
      setValue("subject", scopeSubjects[0], { shouldValidate: true });
    }
    if (scopeClasses.length > 0 && !(scopeClasses.length > 1)) {
      setValue("class", scopeClasses[0] as any, { shouldValidate: true });
    }
  }, [isTeacher, selectedType, scopeSubjects, scopeClasses, setValue]);

  const onSubmit = handleSubmit(async (formData) => {
    setLoading(true);
    setError("");
    setSuccess("");
    let result;
    if (type === "create") {
      result = await createExam(formData);
    } else {
      result = await updateExam(data?.id, formData);
    }
    if (result.success) {
      setSuccess(type === "create" ? "Exam created!" : "Exam updated!");
      router.refresh();
    } else {
      setError(result.error || "Something went wrong.");
    }
    setLoading(false);
  });

  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create Exam" : "Update Exam"}
      </h1>

      {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</p>}
      {success && <p className="text-green-600 text-sm bg-green-50 p-2 rounded">{success}</p>}

      {/* EXAM TYPE SELECTOR */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Exam Type</label>
        <div className="grid grid-cols-2 gap-2">
          {(isTeacher ? ["class_test"] as const : ["class_test", "terminal_exam"] as const).map((t) => {
            const meta = typeMeta[t];
            const isSelected = selectedType === t;
            return (
              <label
                key={t}
                className={`cursor-pointer flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-xs font-bold transition-all ${
                  isSelected ? meta.color + " border-2" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <input type="radio" value={t} {...register("type")} className="hidden" />
                <span className="text-lg">{meta.emoji}</span>
                <span>{meta.label}</span>
                <span className="text-[9px] font-medium text-slate-500">{meta.desc}</span>
              </label>
            );
          })}
        </div>
        {errors.type && <p className="text-red-500 text-xs">{errors.type.message}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelCls}>Subject Name</label>
        {selectedType === "terminal_exam" ? (
          <input
            className={inputCls + " bg-gray-100 cursor-not-allowed"}
            disabled
            value="All Subjects"
            readOnly
          />
        ) : isTeacher && scopeSubjects.length > 0 ? (
          <select className={inputCls} {...register("subject")}>
            <option value="">Select subject</option>
            {scopeSubjects.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        ) : (
          <input
            className={inputCls}
            placeholder="e.g. Mathematics"
            {...register("subject")}
          />
        )}
        {errors.subject && <p className="text-red-400 text-xs">{errors.subject.message}</p>}
        {selectedType === "terminal_exam" && (
          <p className="text-[10px] font-medium text-purple-600">Terminal Exam covers all subjects of the selected class.</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelCls}>Target Class</label>
        <select className={inputCls} {...register("class")}>
          <option value="">Select class</option>
          {(isTeacher && scopeClasses.length > 0 ? scopeClasses : CLASS_OPTIONS).map((c) => (
            <option key={c} value={c}>Class {c}</option>
          ))}
        </select>
        {errors.class && <p className="text-red-400 text-xs">{errors.class.message}</p>}
      </div>

      {isTeacher ? (
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Teacher Name (auto)</label>
          <input
            className={inputCls + " bg-gray-100 cursor-not-allowed"}
            disabled
            {...register("teacher")}
          />
          <p className="text-[10px] font-medium text-sky-600">Automatically set to your account</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Teacher Name</label>
          <input
            className={inputCls}
            placeholder="e.g. Ram Bahadur"
            {...register("teacher")}
          />
          {errors.teacher && <p className="text-red-400 text-xs">{errors.teacher.message}</p>}
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label className={labelCls}>Date</label>
        <input type="date" className={inputCls} {...register("date")} />
        {errors.date && <p className="text-red-400 text-xs">{errors.date.message}</p>}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-mahankalSky text-white p-2 rounded-md font-medium disabled:opacity-60 mt-1"
      >
        {loading ? "Saving..." : type === "create" ? "Create Exam" : "Update Exam"}
      </button>
    </form>
  );
};

export default ExamForm;

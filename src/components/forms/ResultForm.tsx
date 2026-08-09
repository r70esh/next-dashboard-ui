"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import InputField from "../InputField";
import { createResult, updateResult } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

const schema = z.object({
  subject: z.string().min(2, { message: "Subject is required!" }),
  class: z.string().min(1, { message: "Class is required!" }),
  teacher: z.string().min(2, { message: "Teacher name is required!" }),
  student: z.string().min(2, { message: "Student name is required!" }),
  type: z.enum(["assignment", "class_test", "terminal_exam"], {
    errorMap: () => ({ message: "Select a valid result type" }),
  }),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Valid date required!" }),
  score: z.string().refine((val) => !isNaN(parseInt(val)) && parseInt(val) >= 0, { message: "Score must be a non-negative number" }),
  maxScore: z.string().refine((val) => !isNaN(parseInt(val)) && parseInt(val) > 0, { message: "Max score must be a positive number" }),
});

type Inputs = z.infer<typeof schema>;

const typeLabels: Record<string, { label: string; emoji: string; color: string }> = {
  assignment: { label: "Assignment", emoji: "📝", color: "bg-blue-100 text-blue-800 border-blue-300" },
  class_test: { label: "Class Test", emoji: "📋", color: "bg-amber-100 text-amber-800 border-amber-300" },
  terminal_exam: { label: "Terminal Exam", emoji: "🎓", color: "bg-purple-100 text-purple-800 border-purple-300" },
};

const ResultForm = ({ type, data }: { type: "create" | "update"; data?: any }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { data: session } = useSession();
  const isTeacher = (session?.user as any)?.role === "teacher";
  const creatorName = session?.user?.name || "";

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<Inputs>({
    resolver: zodResolver(schema),
    defaultValues: {
      subject: data?.subject || "",
      class: data?.class || "",
      teacher: type === "create" ? creatorName : data?.teacher || "",
      student: data?.student || "",
      type: data?.type || "assignment",
      date: data?.date ? new Date(data.date).toISOString().slice(0, 10) : "",
      score: data?.score?.toString() || "",
      maxScore: data?.maxScore?.toString() || "100",
    },
  });

  // Auto-fill the logged-in teacher's name and keep it locked.
  useEffect(() => {
    if (isTeacher && creatorName) {
      setValue("teacher", creatorName, { shouldValidate: true });
    }
  }, [isTeacher, creatorName, setValue]);

  const selectedType = watch("type");

  const onSubmit = handleSubmit(async (formData) => {
    setLoading(true);
    setError("");
    setSuccess("");
    let result;
    if (type === "create") {
      result = await createResult(formData);
    } else {
      result = await updateResult(data?.id, formData);
    }
    if (result.success) {
      setSuccess(type === "create" ? "Result published!" : "Result updated!");
      router.refresh();
    } else {
      setError(result.error || "Something went wrong.");
    }
    setLoading(false);
  });

  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">{type === "create" ? "Publish Student Result" : "Update Result"}</h1>
      {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded border border-red-200">{error}</p>}
      {success && <p className="text-green-600 text-sm bg-green-50 p-2 rounded border border-green-200">{success}</p>}

      {/* RESULT TYPE SELECTOR */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Result Type</label>
        <div className="grid grid-cols-3 gap-2">
          {(["assignment", "class_test", "terminal_exam"] as const).map((t) => {
            const meta = typeLabels[t];
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
              </label>
            );
          })}
        </div>
        {errors.type && <p className="text-red-500 text-xs">{errors.type.message}</p>}
      </div>

      {/* FIELDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField label="Subject Name" name="subject" register={register} error={errors.subject} />
        <InputField label="Class (1-12)" name="class" register={register} error={errors.class} />
        {isTeacher ? (
          <div className="flex flex-col gap-2 w-full md:w-1/4">
            <label className="text-xs text-gray-500">Teacher Name (auto)</label>
            <input
              {...register("teacher")}
              disabled
              className="ring-[1.5px] ring-gray-300 bg-gray-100 p-2 rounded-md text-sm w-full cursor-not-allowed"
              title="Your name is added automatically"
            />
            <p className="text-[10px] font-medium text-sky-600">Automatically set to your account</p>
          </div>
        ) : (
          <InputField label="Teacher Name" name="teacher" register={register} error={errors.teacher} />
        )}
        <InputField label="Student Name" name="student" register={register} error={errors.student} />
        <InputField label="Score / Marks Obtained" name="score" register={register} error={errors.score} />
        <InputField label="Max Marks (Full Marks)" name="maxScore" register={register} error={errors.maxScore} />
        <div className="md:col-span-2">
          <InputField label="Date of Exam / Assignment" name="date" type="date" register={register} error={errors.date} />
        </div>
      </div>

      <button type="submit" disabled={loading} className="bg-sky-600 hover:bg-sky-700 text-white p-2.5 rounded-xl font-bold text-sm disabled:opacity-60 mt-1 transition">
        {loading ? "Publishing..." : type === "create" ? "📤 Publish Result" : "✏️ Update Result"}
      </button>
    </form>
  );
};

export default ResultForm;

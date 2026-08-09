"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import InputField from "../InputField";
import { createLesson, updateLesson, getTeacherScope } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

const schema = z.object({
  subject: z.string().min(2, { message: "Subject is required!" }),
  class: z.string().refine((val) => {
    const n = parseInt(val);
    return n >= 1 && n <= 12 && !isNaN(n);
  }, { message: "Class must be between 1 and 12!" }),
  teacher: z.string().min(2, { message: "Teacher name is required!" }),
});

type Inputs = z.infer<typeof schema>;

const LessonForm = ({ type, data }: { type: "create" | "update"; data?: any }) => {
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

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<Inputs>({
    resolver: zodResolver(schema),
    defaultValues: {
      subject: data?.subject || "",
      class: data?.class || "",
      teacher: type === "create" ? creatorName : data?.teacher || "",
    },
  });

  // Auto-fill the logged-in teacher's name and keep it locked.
  useEffect(() => {
    if (isTeacher && creatorName) {
      setValue("teacher", creatorName, { shouldValidate: true });
    }
  }, [isTeacher, creatorName, setValue]);

  // Auto-select a value when a teacher has exactly one allowed option.
  useEffect(() => {
    if (!isTeacher) return;
    if (scopeSubjects.length > 0 && !(scopeSubjects.length > 1)) {
      setValue("subject", scopeSubjects[0], { shouldValidate: true });
    }
    if (scopeClasses.length > 0 && !(scopeClasses.length > 1)) {
      setValue("class", scopeClasses[0], { shouldValidate: true });
    }
  }, [isTeacher, scopeSubjects, scopeClasses, setValue]);

  const onSubmit = handleSubmit(async (formData) => {
    setLoading(true);
    setError("");
    setSuccess("");
    let result;
    if (type === "create") {
      result = await createLesson(formData);
    } else {
      result = await updateLesson(data?.id, formData);
    }
    if (result.success) {
      setSuccess(type === "create" ? "Lesson created!" : "Lesson updated!");
      router.refresh();
    } else {
      setError(result.error || "Something went wrong.");
    }
    setLoading(false);
  });

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">{type === "create" ? "Create Lesson" : "Update Lesson"}</h1>
      {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</p>}
      {success && <p className="text-green-600 text-sm bg-green-50 p-2 rounded">{success}</p>}
      <div className="flex flex-col gap-2">
        <label className="text-xs text-gray-500">Subject</label>
        {isTeacher && scopeSubjects.length > 0 ? (
          <select className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full" {...register("subject")}>
            <option value="">Select subject</option>
            {scopeSubjects.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        ) : (
          <input
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            placeholder="e.g. Mathematics"
            {...register("subject")}
          />
        )}
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-xs text-gray-500">Class (1-12)</label>
        {isTeacher && scopeClasses.length > 0 ? (
          <select className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full" {...register("class")}>
            <option value="">Select class</option>
            {scopeClasses.map((c) => (
              <option key={c} value={c}>Class {c}</option>
            ))}
          </select>
        ) : (
          <input
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            placeholder="e.g. 8"
            {...register("class")}
          />
        )}
      </div>
      {isTeacher ? (
        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-500">Teacher (auto)</label>
          <input
            {...register("teacher")}
            disabled
            className="ring-[1.5px] ring-gray-300 bg-gray-100 p-2 rounded-md text-sm w-full cursor-not-allowed"
          />
          <p className="text-[10px] font-medium text-sky-600">Automatically set to your account</p>
        </div>
      ) : (
        <InputField label="Teacher" name="teacher" register={register} error={errors.teacher} />
      )}
      <button type="submit" disabled={loading} className="bg-mahankalSky text-white p-2 rounded-md font-medium disabled:opacity-60">
        {loading ? "Saving..." : type === "create" ? "Create Lesson" : "Update Lesson"}
      </button>
    </form>
  );
};

export default LessonForm;

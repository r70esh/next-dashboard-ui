"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, School, Layers, Users, UserCog, CheckCircle2, AlertCircle } from "lucide-react";
import { createClass, updateClass, getTeacherOptions } from "@/lib/actions";

const schema = z.object({
  name: z
    .string()
    .min(2, { message: "Class name must be at least 2 characters (e.g. 1A, Class 5-B)." }),
  class: z.enum(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"], {
    errorMap: () => ({ message: "Please select a class level (1 to 12)." }),
  }),
  capacity: z
    .string()
    .refine((val) => {
      const n = parseInt(val);
      return !isNaN(n) && n > 0;
    }, { message: "Capacity must be a positive number." }),
  supervisor: z
    .string()
    .trim()
    .regex(/^[Tt][0-9]+$/, { message: "Supervisor must be a valid Teacher ID (e.g. T1001)." }),
});

type Inputs = z.infer<typeof schema>;

const CLASS_LEVELS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: `Class ${i + 1}`,
}));

type TeacherOption = { teacherId: string; name: string };

const inputCls =
  "w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200";
const labelCls = "flex items-center gap-1.5 text-xs font-bold text-slate-600";

const ClassForm = ({ type, data }: { type: "create" | "update"; data?: any }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [teacherError, setTeacherError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Inputs>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: data?.name || "",
      class: data?.class?.toString() || "",
      capacity: data?.capacity?.toString() || "",
      supervisor: data?.supervisor || "",
    },
  });

  const watchedClass = watch("class");

  useEffect(() => {
    let mounted = true;
    setLoadingTeachers(true);
    getTeacherOptions().then((res) => {
      if (!mounted) return;
      setLoadingTeachers(false);
      if (res.success) {
        setTeachers(res.teachers || []);
      } else {
        setTeacherError(res.error || "Could not load teachers.");
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Keep existing supervisor visible when editing a class
  const supervisorOptions: TeacherOption[] =
    type === "update" && data?.supervisor
      ? [{ teacherId: data.supervisor, name: "(current supervisor)" }, ...teachers]
      : teachers;

  const onSubmit = handleSubmit(async (formData) => {
    setLoading(true);
    setError("");
    setSuccess("");
    const payload = {
      ...formData,
      capacity: parseInt(formData.capacity),
      class: parseInt(formData.class),
      supervisor: formData.supervisor.trim(),
    };
    let result;
    if (type === "create") {
      result = await createClass(payload);
    } else {
      result = await updateClass(data?.id, payload);
    }
    if (result.success) {
      setSuccess(type === "create" ? "Class created successfully!" : "Class updated successfully!");
      setTimeout(() => router.refresh(), 600);
    } else {
      setError(result.error || "Something went wrong.");
    }
    setLoading(false);
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col">
      {/* Header */}
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
          <School className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-lg font-extrabold text-slate-800">
            {type === "create" ? "Add New Class" : "Update Class"}
          </h1>
          <p className="text-[11px] text-slate-400">
            Classes from Class 1 to Class 12 · Supervisor must be a teacher ID
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3.5 py-2.5 text-xs font-semibold text-green-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> {success}
        </div>
      )}

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>
            <School className="h-3.5 w-3.5 text-indigo-400" /> Class Name
          </label>
          <input
            type="text"
            placeholder='e.g. "1A", "Class 5-B"'
            className={inputCls}
            {...register("name")}
          />
          {errors.name && <p className="text-[11px] font-medium text-red-500">{errors.name.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>
              <Layers className="h-3.5 w-3.5 text-indigo-400" /> Class Level
            </label>
            <select className={inputCls} {...register("class")}>
              <option value="">Select class</option>
              {CLASS_LEVELS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            {errors.class && <p className="text-[11px] font-medium text-red-500">{errors.class.message}</p>}
            {watchedClass && (
              <p className="text-[10px] font-medium text-slate-400">Level {watchedClass} · Class 1 to 12</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>
              <Users className="h-3.5 w-3.5 text-indigo-400" /> Capacity
            </label>
            <input
              type="number"
              min="1"
              placeholder="e.g. 30, 40"
              className={inputCls}
              {...register("capacity")}
            />
            {errors.capacity && <p className="text-[11px] font-medium text-red-500">{errors.capacity.message}</p>}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>
            <UserCog className="h-3.5 w-3.5 text-indigo-400" /> Supervisor (Teacher ID)
          </label>
          {loadingTeachers ? (
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading teachers...
            </div>
          ) : teacherError ? (
            <p className="text-[11px] font-medium text-red-500">{teacherError}</p>
          ) : supervisorOptions.length === 0 ? (
            <p className="text-[11px] font-medium text-amber-600">
              No teachers registered yet. Add a teacher first, then pick their ID here.
            </p>
          ) : (
            <select className={inputCls} defaultValue="" {...register("supervisor")}>
              <option value="">Select a teacher ID</option>
              {supervisorOptions.map((t) => (
                <option key={t.teacherId} value={t.teacherId}>
                  {t.teacherId} — {t.name}
                </option>
              ))}
            </select>
          )}
          {errors.supervisor ? (
            <p className="text-[11px] font-medium text-red-500">{errors.supervisor.message}</p>
          ) : (
            <p className="text-[10px] font-medium text-slate-400">
              Enter or select the assigned teacher&apos;s ID (format: T1001).
            </p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Saving...
          </>
        ) : type === "create" ? (
          "Create Class"
        ) : (
          "Save Changes"
        )}
      </button>
    </form>
  );
};

export default ClassForm;
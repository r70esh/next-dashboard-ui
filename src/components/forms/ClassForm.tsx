"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, School, Layers, Users, UserCog, CheckCircle2, AlertCircle } from "lucide-react";
import { createClass, updateClass } from "@/lib/actions";

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
    .min(2, { message: "Supervisor name or ID is required." })
    .refine((val) => /^[A-Za-z][A-Za-z0-9 .'-]*$/.test(val.trim()), {
      message: "Supervisor must be a valid name or teacher ID (e.g. T1001).",
    }),
});

type Inputs = z.infer<typeof schema>;

const CLASS_LEVELS = [
  { value: "1", label: "Class 1" },
  { value: "2", label: "Class 2" },
  { value: "3", label: "Class 3" },
  { value: "4", label: "Class 4" },
  { value: "5", label: "Class 5" },
  { value: "6", label: "Class 6" },
  { value: "7", label: "Class 7" },
  { value: "8", label: "Class 8" },
  { value: "9", label: "Class 9" },
  { value: "10", label: "Class 10" },
  { value: "11", label: "Class 11" },
  { value: "12", label: "Class 12" },
];

const inputCls =
  "w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200";
const labelCls = "flex items-center gap-1.5 text-xs font-bold text-slate-600";

const ClassForm = ({ type, data }: { type: "create" | "update"; data?: any }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
          <p className="text-[11px] text-slate-400">Classes run from Class 1 to Class 12</p>
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
            placeholder='e.g. "Class 1A", "Grade 5-B"'
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
              <p className="text-[10px] font-medium text-slate-400">
                Level {watchedClass} · Class 1 to 12
              </p>
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
            <UserCog className="h-3.5 w-3.5 text-indigo-400" /> Supervisor ID / Name
          </label>
          <input
            type="text"
            placeholder="e.g. T1001 or Teacher Name"
            className={inputCls}
            {...register("supervisor")}
          />
          {errors.supervisor ? (
            <p className="text-[11px] font-medium text-red-500">{errors.supervisor.message}</p>
          ) : (
            <p className="text-[10px] font-medium text-slate-400">
              Enter the assigned teacher&apos;s ID or name as supervisor.
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
"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import InputField from "../InputField";
import { createSubject, updateSubject } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BookOpen, Layers, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

const schema = z.object({
  name: z.string().trim().min(2, { message: "Subject name must be at least 2 characters!" }),
  classes: z.string().min(1, { message: "Select at least one class." }),
});

type Inputs = z.infer<typeof schema>;

const CLASS_LEVELS = Array.from({ length: 12 }, (_, i) => String(i + 1));

const inputCls =
  "w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200";

const SubjectForm = ({ type, data }: { type: "create" | "update"; data?: any }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedClasses, setSelectedClasses] = useState<string[]>(
    type === "update" ? (data?.classes || []).map(String) : []
  );

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<Inputs>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: data?.name || "",
      classes: (data?.classes || []).map(String).join(","),
    },
  });

  const toggleClass = (c: string) => {
    setSelectedClasses((prev) => {
      const next = prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c];
      setValue("classes", next.join(","), { shouldValidate: true });
      return next;
    });
  };

  const onSubmit = handleSubmit(async (formData) => {
    setLoading(true);
    setError("");
    setSuccess("");
    const payload = { name: formData.name, classes: selectedClasses };
    let result;
    if (type === "create") {
      result = await createSubject(payload);
    } else {
      result = await updateSubject(data?.id, payload);
    }
    if (result.success) {
      setSuccess(type === "create" ? "Subject created successfully!" : "Subject updated!");
      router.refresh();
    } else {
      setError(result.error || "Something went wrong.");
    }
    setLoading(false);
  });

  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit}>
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
          <BookOpen className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-lg font-extrabold text-slate-800">
            {type === "create" ? "Create New Subject" : "Update Subject"}
          </h1>
          <p className="text-[11px] text-slate-400">Pick one or many classes for this subject</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3.5 py-2.5 text-xs font-semibold text-green-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> {success}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
          <BookOpen className="h-3.5 w-3.5 text-indigo-400" /> Subject Name
        </label>
        <input type="text" className={inputCls} placeholder="e.g. Mathematics" {...register("name")} />
        <input type="hidden" {...register("classes")} />
        {errors.name && <p className="text-[11px] font-medium text-red-500">{errors.name.message}</p>}
        {errors.classes && <p className="text-[11px] font-medium text-red-500">{errors.classes.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
          <Layers className="h-3.5 w-3.5 text-indigo-400" /> Classes (select one or many)
        </label>
        <div className="grid grid-cols-3 gap-2">
          {CLASS_LEVELS.map((c) => {
            const isSelected = selectedClasses.includes(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() => toggleClass(c)}
                className={`cursor-pointer rounded-lg border-2 px-2 py-2 text-xs font-bold transition-all ${
                  isSelected
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-400"
                }`}
              >
                Class {c}
              </button>
            );
          })}
        </div>
        {selectedClasses.length === 0 && (
          <p className="text-[11px] font-medium text-amber-600">Select at least one class.</p>
        )}
        {selectedClasses.length > 0 && (
          <p className="text-[10px] font-medium text-slate-400">
            {selectedClasses.length} class{selectedClasses.length > 1 ? "es" : ""} selected: Class{" "}
            {selectedClasses.join(", Class ")}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading || selectedClasses.length === 0}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Saving...
          </>
        ) : type === "create" ? (
          "Create Subject"
        ) : (
          "Save Changes"
        )}
      </button>
    </form>
  );
};

export default SubjectForm;

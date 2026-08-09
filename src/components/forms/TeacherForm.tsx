"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import InputField from "../InputField";
import { createTeacher, updateTeacher, getSubjectOptions } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BookOpen, CheckCircle2, AlertCircle, Loader2, Layers } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters!" }),
  email: z.string().email({ message: "Invalid email address!" }),
  password: z.string().optional(),
  phone: z.string().min(1, { message: "Phone is required!" }),
  address: z.string().min(1, { message: "Address is required!" }),
});

type Inputs = z.infer<typeof schema>;

const CLASS_LEVELS = Array.from({ length: 12 }, (_, i) => String(i + 1));

const chipCls =
  "cursor-pointer rounded-lg border-2 px-2 py-2 text-xs font-bold transition-all";
const chipOn =
  "border-indigo-500 bg-indigo-50 text-indigo-700";
const chipOff =
  "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-400";

const TeacherForm = ({ type, data }: { type: "create" | "update"; data?: any }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [subjectOptions, setSubjectOptions] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(
    type === "update" ? (data?.subjects || []).map(String) : []
  );
  const [selectedClasses, setSelectedClasses] = useState<string[]>(
    type === "update" ? (data?.classes || []).map(String) : []
  );

  useEffect(() => {
    getSubjectOptions().then((res: any) => {
      const names = (res?.subjects || []).map((s: any) => s.name);
      setSubjectOptions(names);
      setSelectedSubjects((prev) => {
        const extras = prev.filter((p) => !names.includes(p));
        return prev.filter((p) => names.includes(p)).concat(extras);
      });
    });
  }, []);

  const { register, handleSubmit, formState: { errors } } = useForm<Inputs>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: data?.name || "",
      email: data?.email || "",
      phone: data?.phone || "",
      address: data?.address || "",
    },
  });

  const toggleSubject = (s: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };
  const toggleClass = (c: string) => {
    setSelectedClasses((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  };

  const onSubmit = handleSubmit(async (formData) => {
    setLoading(true);
    setError("");
    setSuccess("");

    const payload = {
      ...formData,
      subjects: selectedSubjects,
      classes: selectedClasses,
    };

    let result;
    if (type === "create") {
      if (!formData.password) {
        setError("Password is required to create a teacher.");
        setLoading(false);
        return;
      }
      result = await createTeacher(payload);
    } else {
      result = await updateTeacher(data?.id, payload);
    }

    if (result.success) {
      setSuccess(type === "create" ? "Teacher created successfully!" : "Teacher updated!");
      router.refresh();
    } else {
      setError(result.error || "Something went wrong.");
    }
    setLoading(false);
  });

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a New Teacher" : "Update Teacher"}
      </h1>

      {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</p>}
      {success && <p className="text-green-600 text-sm bg-green-50 p-2 rounded">{success}</p>}

      <span className="text-xs text-gray-400 font-medium">Account Information</span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField label="Full Name" name="name" register={register} error={errors.name} />
        <InputField label="Email" name="email" register={register} error={errors.email} />
        <InputField
          label={type === "create" ? "Password" : "New Password (leave blank to keep)"}
          name="password"
          type="password"
          register={register}
          error={errors.password}
        />
      </div>

      <span className="text-xs text-gray-400 font-medium">Personal Information</span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField label="Phone" name="phone" register={register} error={errors.phone} />
        <InputField label="Address" name="address" register={register} error={errors.address} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
          <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
          Subjects (select one or many)
        </label>
        {subjectOptions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {subjectOptions.map((s) => {
              const isSelected = selectedSubjects.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSubject(s)}
                  className={`${chipCls} ${isSelected ? chipOn : chipOff}`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-amber-600">
            No subjects exist yet. Create subjects first, then assign them to teachers.
          </p>
        )}
        {selectedSubjects.filter((s) => !subjectOptions.includes(s)).length > 0 && (
          <p className="text-[10px] font-medium text-slate-400">
            Previously saved subjects not in the current list are kept:{" "}
            {selectedSubjects.filter((s) => !subjectOptions.includes(s)).join(", ")}
          </p>
        )}
        <p className="text-[10px] font-medium text-slate-400">
          {selectedSubjects.length} subject{selectedSubjects.length !== 1 ? "s" : ""} selected
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
          <Layers className="h-3.5 w-3.5 text-indigo-400" />
          Classes (select one or many)
        </label>
        <div className="grid grid-cols-3 gap-2">
          {CLASS_LEVELS.map((c) => {
            const isSelected = selectedClasses.includes(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() => toggleClass(c)}
                className={`${chipCls} ${isSelected ? chipOn : chipOff}`}
              >
                Class {c}
              </button>
            );
          })}
        </div>
        <p className="text-[10px] font-medium text-slate-400">
          {selectedClasses.length} class{selectedClasses.length !== 1 ? "es" : ""} selected.
          This teacher can only create content for the selected subjects and classes.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex items-center justify-center gap-2 bg-mahankalSky text-white p-2 rounded-md font-medium disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Saving...
          </>
        ) : type === "create" ? (
          "Create Teacher"
        ) : (
          "Update Teacher"
        )}
      </button>
    </form>
  );
};

export default TeacherForm;

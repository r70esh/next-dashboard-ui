"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createAssignment, updateAssignment, getTeacherScope } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

const CLASS_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i + 1));

const schema = z.object({
  subject: z.string().min(2, { message: "Subject must be at least 2 characters!" }),
  class: z.enum(["1","2","3","4","5","6","7","8","9","10","11","12"], {
    errorMap: () => ({ message: "Please select a class (1 to 12)." }),
  }),
  teacher: z.string().min(2, { message: "Teacher name is required!" }),
  dueDate: z.string().min(1, { message: "Due date is required!" }),
});

type Inputs = z.infer<typeof schema>;

const inputCls =
  "w-full ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm focus:outline-none focus:ring-mahankalSky";
const labelCls = "text-xs text-gray-500 font-medium";

const AssignmentForm = ({ type, data }: { type: "create" | "update"; data?: any }) => {
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

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<Inputs>({
    resolver: zodResolver(schema),
    defaultValues: {
      subject: data?.subject || "",
      class: (defaultClass as any) || "",
      teacher: type === "create" ? creatorName : data?.teacher || "",
      dueDate: data?.dueDate ? new Date(data.dueDate).toISOString().split("T")[0] : "",
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
      setValue("class", scopeClasses[0] as any, { shouldValidate: true });
    }
  }, [isTeacher, scopeSubjects, scopeClasses, setValue]);

  const onSubmit = handleSubmit(async (formData) => {
    setLoading(true);
    setError("");
    setSuccess("");

    let result;
    if (type === "create") {
      result = await createAssignment(formData);
    } else {
      result = await updateAssignment(data?.id, formData);
    }

    if (result.success) {
      setSuccess(type === "create" ? "Assignment created successfully!" : "Assignment updated!");
      router.refresh();
    } else {
      setError(result.error || "Something went wrong.");
    }
    setLoading(false);
  });

  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a New Assignment" : "Update Assignment"}
      </h1>

      {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</p>}
      {success && <p className="text-green-600 text-sm bg-green-50 p-2 rounded">{success}</p>}

      <div className="flex flex-col gap-1">
        <label className={labelCls}>Subject Name</label>
        {isTeacher && scopeSubjects.length > 0 ? (
          <select className={inputCls} {...register("subject")}>
            <option value="">Select subject</option>
            {scopeSubjects.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        ) : (
          <input
            className={inputCls}
            placeholder="e.g. Science"
            {...register("subject")}
          />
        )}
        {errors.subject && <p className="text-red-400 text-xs">{errors.subject.message}</p>}
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
        <label className={labelCls}>Due Date</label>
        <input type="date" className={inputCls} {...register("dueDate")} />
        {errors.dueDate && <p className="text-red-400 text-xs">{errors.dueDate.message}</p>}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-mahankalSky text-white p-2 rounded-md font-medium disabled:opacity-60 mt-1"
      >
        {loading ? "Saving..." : type === "create" ? "Create Assignment" : "Update Assignment"}
      </button>
    </form>
  );
};

export default AssignmentForm;

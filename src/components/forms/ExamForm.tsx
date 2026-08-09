"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createExam, updateExam } from "@/lib/actions";
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
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Valid date required!" }),
});

type Inputs = z.infer<typeof schema>;

const inputCls =
  "w-full ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm focus:outline-none focus:ring-mahankalSky";
const labelCls = "text-xs text-gray-500 font-medium";

const ExamForm = ({ type, data }: { type: "create" | "update"; data?: any }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { data: session } = useSession();
  const isTeacher = (session?.user as any)?.role === "teacher";
  const creatorName = session?.user?.name || "";

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
      date: data?.date ? new Date(data.date).toISOString().slice(0, 10) : "",
    },
  });

  // Auto-fill the logged-in teacher's name and keep it locked.
  useEffect(() => {
    if (isTeacher && creatorName) {
      setValue("teacher", creatorName, { shouldValidate: true });
    }
  }, [isTeacher, creatorName, setValue]);

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
        {type === "create" ? "Create Exam / Class Test" : "Update Exam"}
      </h1>

      {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</p>}
      {success && <p className="text-green-600 text-sm bg-green-50 p-2 rounded">{success}</p>}

      <div className="flex flex-col gap-1">
        <label className={labelCls}>Subject Name</label>
        <input
          className={inputCls}
          placeholder="e.g. Mathematics"
          {...register("subject")}
        />
        {errors.subject && <p className="text-red-400 text-xs">{errors.subject.message}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelCls}>Target Class</label>
        <select className={inputCls} {...register("class")}>
          <option value="">Select class</option>
          {CLASS_OPTIONS.map((c) => (
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

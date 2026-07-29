"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import InputField from "../InputField";
import { createResult, updateResult } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { useState } from "react";

const schema = z.object({
  subject: z.string().min(2, { message: "Subject is required!" }),
  class: z.string().refine((val) => {
    const n = parseInt(val);
    return n >= 1 && n <= 12 && !isNaN(n);
  }, { message: "Class must be between 1 and 12!" }),
  teacher: z.string().min(2, { message: "Teacher name is required!" }),
  student: z.string().min(2, { message: "Student name is required!" }),
  type: z.enum(["exam", "assignment"], { errorMap: () => ({ message: "Type must be exam or assignment" }) }),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Valid date required!" }),
  score: z.string().refine((val) => !isNaN(parseInt(val)), { message: "Score must be a number" }),
});

type Inputs = z.infer<typeof schema>;

const ResultForm = ({ type, data }: { type: "create" | "update"; data?: any }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<Inputs>({
    resolver: zodResolver(schema),
    defaultValues: {
      subject: data?.subject || "",
      class: data?.class || "",
      teacher: data?.teacher || "",
      student: data?.student || "",
      type: data?.type || "exam",
      date: data?.date ? new Date(data.date).toISOString().slice(0, 10) : "",
      score: data?.score?.toString() || "",
    },
  });

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
      setSuccess(type === "create" ? "Result created!" : "Result updated!");
      router.refresh();
    } else {
      setError(result.error || "Something went wrong.");
    }
    setLoading(false);
  });

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">{type === "create" ? "Create Result" : "Update Result"}</h1>
      {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</p>}
      {success && <p className="text-green-600 text-sm bg-green-50 p-2 rounded">{success}</p>}
      <InputField label="Subject" name="subject" register={register} error={errors.subject} />
      <InputField label="Class (1-12)" name="class" register={register} error={errors.class} />
      <InputField label="Teacher" name="teacher" register={register} error={errors.teacher} />
      <InputField label="Student" name="student" register={register} error={errors.student} />
      <div className="flex gap-4">
        <label className="flex items-center gap-2">
          <input type="radio" value="exam" {...register("type")} /> Exam
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" value="assignment" {...register("type")} /> Assignment
        </label>
      </div>
      <InputField label="Date" name="date" type="date" register={register} error={errors.date} />
      <InputField label="Score" name="score" register={register} error={errors.score} />
      <button type="submit" disabled={loading} className="bg-lamaSky text-white p-2 rounded-md font-medium disabled:opacity-60">
        {loading ? "Saving..." : type === "create" ? "Create Result" : "Update Result"}
      </button>
    </form>
  );
};

export default ResultForm;

"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import InputField from "../InputField";
import { createAttendance, updateAttendance } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { useState } from "react";

const schema = z.object({
  student: z.string().min(2, { message: "Student name is required!" }),
  date: z.string().optional(),
  status: z.enum(["present", "absent", "late"], { errorMap: () => ({ message: "Status is required" }) }),
});

type Inputs = z.infer<typeof schema>;

const AttendanceForm = ({ type, data }: { type: "create" | "update"; data?: any }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<Inputs>({
    resolver: zodResolver(schema),
    defaultValues: {
      student: data?.student || "",
      date: "",
      status: data?.status || "present",
    },
  });

  const onSubmit = handleSubmit(async (formData) => {
    setLoading(true);
    setError("");
    setSuccess("");
    let result;
    if (type === "create") {
      result = await createAttendance(formData);
    } else {
      result = await updateAttendance(data?.id, formData);
    }
    if (result.success) {
      setSuccess(type === "create" ? "Attendance created!" : "Attendance updated!");
      router.refresh();
    } else {
      setError(result.error || "Something went wrong.");
    }
    setLoading(false);
  });

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">{type === "create" ? "Create Attendance" : "Update Attendance"}</h1>
      {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</p>}
      {success && <p className="text-green-600 text-sm bg-green-50 p-2 rounded">{success}</p>}
      <InputField label="Student" name="student" register={register} error={errors.student} />
      
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">Date & Time</label>
        <div className="bg-slate-100 border border-slate-200 text-slate-500 text-xs font-bold rounded-xl p-2.5 shadow-sm cursor-not-allowed">
          {type === "create" ? "Records exact time automatically upon creation" : "Keeps original time unless updated"}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">Status</label>
        <select {...register("status")} className="border border-gray-300 rounded-md p-2 text-sm">
          <option value="present">Present</option>
          <option value="absent">Absent</option>
          <option value="late">Late</option>
        </select>
        {errors.status && <p className="text-red-400 text-xs">{errors.status.message}</p>}
      </div>
      <button type="submit" disabled={loading} className="bg-mahankalSky text-white p-2 rounded-md font-medium disabled:opacity-60">
        {loading ? "Saving..." : type === "create" ? "Create Attendance" : "Update Attendance"}
      </button>
    </form>
  );
};

export default AttendanceForm;

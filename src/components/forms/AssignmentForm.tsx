"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import InputField from "../InputField";
import { createAssignment, updateAssignment } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { useState } from "react";

const schema = z.object({
  subject: z.string().min(2, { message: "Subject must be at least 2 characters!" }),
  class: z.string().min(1, { message: "Class is required!" }),
  teacher: z.string().min(2, { message: "Teacher name is required!" }),
  dueDate: z.string().min(1, { message: "Due date is required!" }),
});

type Inputs = z.infer<typeof schema>;

const AssignmentForm = ({ type, data }: { type: "create" | "update"; data?: any }) => {
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
      dueDate: data?.dueDate ? new Date(data.dueDate).toISOString().split("T")[0] : "",
    },
  });

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
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">{type === "create" ? "Create a New Assignment" : "Update Assignment"}</h1>

      {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</p>}
      {success && <p className="text-green-600 text-sm bg-green-50 p-2 rounded">{success}</p>}

      <span className="text-xs text-gray-400 font-medium">Assignment Details</span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField label="Subject Name" name="subject" register={register} error={errors.subject} />
        <InputField label="Target Class (1-12)" name="class" register={register} error={errors.class} />
        <InputField label="Teacher Name" name="teacher" register={register} error={errors.teacher} />
        <InputField label="Due Date" name="dueDate" type="date" register={register} error={errors.dueDate} />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-mahankalSky text-white p-2 rounded-md font-medium disabled:opacity-60 mt-2"
      >
        {loading ? "Saving..." : type === "create" ? "Create Assignment" : "Update Assignment"}
      </button>
    </form>
  );
};

export default AssignmentForm;

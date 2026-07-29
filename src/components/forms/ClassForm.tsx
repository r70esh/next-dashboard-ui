"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import InputField from "../InputField";
import { createClass, updateClass } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { useState } from "react";

const schema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters!" }),
  capacity: z.string().refine((val) => {
    const n = parseInt(val);
    return n > 0 && !isNaN(n);
  }, { message: "Capacity must be a positive number!" }),
  grade: z.string().refine((val) => {
    const n = parseInt(val);
    return n >= 1 && n <= 12 && !isNaN(n);
  }, { message: "Grade must be between 1 and 12!" }),
  supervisor: z.string().min(2, { message: "Supervisor name required!" }),
});

type Inputs = z.infer<typeof schema>;

const ClassForm = ({ type, data }: { type: "create" | "update"; data?: any }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<Inputs>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: data?.name || "",
      capacity: data?.capacity?.toString() || "",
      grade: data?.grade?.toString() || "",
      supervisor: data?.supervisor || "",
    },
  });

  const onSubmit = handleSubmit(async (formData) => {
    setLoading(true);
    setError("");
    setSuccess("");
    const payload = {
      ...formData,
      capacity: parseInt(formData.capacity),
      grade: parseInt(formData.grade),
    };
    let result;
    if (type === "create") {
      result = await createClass(payload);
    } else {
      result = await updateClass(data?.id, payload);
    }
    if (result.success) {
      setSuccess(type === "create" ? "Class created successfully!" : "Class updated!");
      router.refresh();
    } else {
      setError(result.error || "Something went wrong.");
    }
    setLoading(false);
  });

  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">{type === "create" ? "Create New Class" : "Update Class"}</h1>
      {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}
      {success && <p className="text-green-600 text-sm bg-green-50 p-3 rounded-lg">{success}</p>}
      <InputField label="Class Name" name="name" register={register} error={errors.name} />
      <InputField label="Capacity" name="capacity" type="number" register={register} error={errors.capacity} />
      <InputField label="Grade (1‑12)" name="grade" type="number" register={register} error={errors.grade} />
      <InputField label="Supervisor" name="supervisor" register={register} error={errors.supervisor} />
      <button
        type="submit"
        disabled={loading}
        className="bg-lamaSky text-white p-2 rounded-md font-medium disabled:opacity-60"
      >
        {loading ? "Saving..." : type === "create" ? "Create Class" : "Update Class"}
      </button>
    </form>
  );
};

export default ClassForm;

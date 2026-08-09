"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import InputField from "../InputField";
import { createClass, updateClass } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters!" }),
  capacity: z.string().refine((val) => {
    const n = parseInt(val);
    return n > 0 && !isNaN(n);
  }, { message: "Capacity must be a positive number!" }),
  // Grade now limited to values 1-12 via enum of string literals
  grade: z.enum(["1","2","3","4","5","6","7","8","9","10","11","12"]),
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
      {/* Grade dropdown with options 1‑12 */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">Grade (1‑12)</label>
        <select
          {...register("grade")}
          className="border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Select grade</option>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={String(i + 1)}>{i + 1}</option>
          ))}
        </select>
        {errors.grade && <p className="text-xs text-red-400">{errors.grade.message}</p>}
      </div>
      <InputField label="Supervisor" name="supervisor" register={register} error={errors.supervisor} />
      <button
        type="submit"
        disabled={loading}
        className="bg-mahankalSky text-white p-2 rounded-md font-medium disabled:opacity-60 flex items-center justify-center"
      >
        {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
        {loading ? "Saving..." : type === "create" ? "Create Class" : "Update Class"}
      </button>
    </form>
  );
};

export default ClassForm;

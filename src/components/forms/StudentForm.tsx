"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import InputField from "../InputField";
import { createStudent, updateStudent } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const schema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters!" }),
  email: z.string().email({ message: "Invalid email address!" }),
  password: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().min(1, { message: "Address is required!" }),
  class: z.string().refine((val) => {
    const n = parseInt(val);
    return n >= 1 && n <= 12 && !isNaN(n);
  }, { message: "Class must be between 1 and 12!" }),
  rollNumber: z.string().min(1, { message: "Roll number is required!" }),
});

type Inputs = z.infer<typeof schema>;

const StudentForm = ({ type, data }: { type: "create" | "update"; data?: any }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [generatedId, setGeneratedId] = useState<string>("");

  const { register, handleSubmit, watch, formState: { errors } } = useForm<Inputs>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: data?.name || "",
      email: data?.email || "",
      phone: data?.phone || "",
      address: data?.address || "",
      class: data?.class || "",
      rollNumber: "",
    },
  });

  const watchedClass = watch("class");
  const watchedRoll = watch("rollNumber");

  // Auto-generate student ID from class + roll number
  useEffect(() => {
    if (watchedClass && watchedRoll) {
      // e.g., class "3", roll "11" → c311
      const classNum = watchedClass.replace(/[^0-9]/g, "");
      const rollNum = watchedRoll.replace(/[^0-9]/g, "");
      if (classNum && rollNum) {
        setGeneratedId(`c${classNum}${rollNum}`);
      }
    }
  }, [watchedClass, watchedRoll]);

  const onSubmit = handleSubmit(async (formData) => {
    setLoading(true);
    setError("");
    setSuccess("");

    const payload = {
      ...formData,
      studentId: generatedId || `S${Date.now()}`,
    };

    let result;
    if (type === "create") {
      if (!formData.password) { setError("Password is required."); setLoading(false); return; }
      result = await createStudent(payload);
    } else {
      result = await updateStudent(data?.id, payload);
    }

    if (result.success) {
      setSuccess(type === "create" ? `Student created! ID: ${generatedId}` : "Student updated!");
      router.refresh();
    } else {
      setError(result.error || "Something went wrong.");
    }
    setLoading(false);
  });

  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">{type === "create" ? "Register a New Student" : "Update Student"}</h1>

      {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}
      {success && <p className="text-green-600 text-sm bg-green-50 p-3 rounded-lg">{success}</p>}

      <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Account Info</span>
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

      <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Class & ID</span>
      <div className="flex justify-between flex-wrap gap-4">
        <div className="flex flex-col gap-2 w-full md:w-[45%]">
          <label className="text-xs text-gray-500">Class (1‑12)</label>
          <input
            type="number"
            min="1"
            max="12"
            placeholder="e.g. 3"
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("class")}
          />
          {errors.class && <p className="text-xs text-red-400">{errors.class.message}</p>}
        </div>
        <div className="flex flex-col gap-2 w-full md:w-[45%]">
          <label className="text-xs text-gray-500">Roll Number</label>
          <input
            type="number"
            min="1"
            placeholder="e.g. 11"
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("rollNumber")}
          />
          {errors.rollNumber && <p className="text-xs text-red-400">{errors.rollNumber.message}</p>}
        </div>
      </div>

      {/* Auto-generated ID preview */}
      {generatedId && (
        <div className="flex items-center gap-3 bg-mahankalYellowLight border border-mahankalYellow rounded-lg p-3">
          <span className="text-sm text-gray-600">Auto-generated Student ID:</span>
          <span className="font-bold text-lg text-mahankalPurple">{generatedId}</span>
          <span className="text-xs text-gray-400">(Class {watchedClass}, Roll {watchedRoll})</span>
        </div>
      )}

      <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Contact Info</span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField label="Phone (optional)" name="phone" register={register} error={errors.phone} />
        <InputField label="Address" name="address" register={register} error={errors.address} />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-mahankalSky text-white p-2 rounded-md font-medium disabled:opacity-60"
      >
        {loading ? "Saving..." : type === "create" ? "Create Student" : "Update Student"}
      </button>
    </form>
  );
};

export default StudentForm;

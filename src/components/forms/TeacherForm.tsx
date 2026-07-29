"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import InputField from "../InputField";
import { createTeacher, updateTeacher } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { useState } from "react";

const schema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters!" }),
  email: z.string().email({ message: "Invalid email address!" }),
  password: z.string().optional(),
  phone: z.string().min(1, { message: "Phone is required!" }),
  address: z.string().min(1, { message: "Address is required!" }),
  subjects: z.string().optional(),
});

type Inputs = z.infer<typeof schema>;

const TeacherForm = ({ type, data }: { type: "create" | "update"; data?: any }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<Inputs>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: data?.name || "",
      email: data?.email || "",
      phone: data?.phone || "",
      address: data?.address || "",
      subjects: data?.subjects?.join(", ") || "",
    },
  });

  const onSubmit = handleSubmit(async (formData) => {
    setLoading(true);
    setError("");
    setSuccess("");

    let result;
    if (type === "create") {
      if (!formData.password) { setError("Password is required to create a teacher."); setLoading(false); return; }
      result = await createTeacher(formData);
    } else {
      result = await updateTeacher(data?.id, formData);
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
      <h1 className="text-xl font-semibold">{type === "create" ? "Create a New Teacher" : "Update Teacher"}</h1>

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
        <InputField label="Subjects (comma separated)" name="subjects" register={register} error={errors.subjects} />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-lamaSky text-white p-2 rounded-md font-medium disabled:opacity-60"
      >
        {loading ? "Saving..." : type === "create" ? "Create Teacher" : "Update Teacher"}
      </button>
    </form>
  );
};

export default TeacherForm;

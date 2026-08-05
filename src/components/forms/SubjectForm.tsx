"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import InputField from "../InputField";
import { createSubject, updateSubject } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { useState } from "react";

const schema = z.object({
  name: z.string().min(2, { message: "Subject name must be at least 2 characters!" }),
  teachers: z.string().optional(),
});

type Inputs = z.infer<typeof schema>;

const SubjectForm = ({ type, data }: { type: "create" | "update"; data?: any }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<Inputs>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: data?.name || "",
      teachers: data?.teachers?.join(", ") || "",
    },
  });

  const onSubmit = handleSubmit(async (formData) => {
    setLoading(true);
    setError("");
    setSuccess("");
    const payload = {
      ...formData,
    };
    let result;
    if (type === "create") {
      result = await createSubject(payload);
    } else {
      result = await updateSubject(data?.id, payload);
    }
    if (result.success) {
      setSuccess(type === "create" ? "Subject created successfully!" : "Subject updated!");
      router.refresh();
    } else {
      setError(result.error || "Something went wrong.");
    }
    setLoading(false);
  });

  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create New Subject" : "Update Subject"}
      </h1>
      {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}
      {success && <p className="text-green-600 text-sm bg-green-50 p-3 rounded-lg">{success}</p>}
      <InputField label="Subject Name" name="name" register={register} error={errors.name} />
      <InputField label="Teachers (comma separated)" name="teachers" register={register} error={errors.teachers} />
      <button
        type="submit"
        disabled={loading}
        className="bg-mahankalSky text-white p-2 rounded-md font-medium disabled:opacity-60"
      >
        {loading ? "Saving..." : type === "create" ? "Create Subject" : "Update Subject"}
      </button>
    </form>
  );
};

export default SubjectForm;

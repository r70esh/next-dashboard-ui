"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import InputField from "../InputField";
import { createParent, updateParent } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const schema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters!" }),
  email: z.string().email({ message: "Invalid email address!" }),
  password: z.string().optional(),
  phone: z.string().min(1, { message: "Phone is required!" }),
  address: z.string().min(1, { message: "Address is required!" }),
});

type Inputs = z.infer<typeof schema>;

type StudentOption = {
  _id: string;
  name: string;
  studentId: string;
  class: string;
};

const ParentForm = ({ type, data }: { type: "create" | "update"; data?: any }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Child linking state
  const [childClass, setChildClass] = useState("");
  const [childRoll, setChildRoll] = useState("");
  const [addingChild, setAddingChild] = useState(false);
  const [addError, setAddError] = useState("");
  const [selectedChildren, setSelectedChildren] = useState<StudentOption[]>(
    data?.students ? data.students.map((id: string) => ({ name: id, studentId: id, _id: id, class: "" })) : []
  );

  const { register, handleSubmit, formState: { errors } } = useForm<Inputs>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: data?.name || "",
      email: data?.email || "",
      phone: data?.phone || "",
      address: data?.address || "",
    },
  });

  // Resolve stored child refs (studentId or legacy name) so chips show real info.
  useEffect(() => {
    if (type !== "update" || !data?.students?.length) return;
    let cancelled = false;
    fetch("/api/students")
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        const all: StudentOption[] = json.students || [];
        const resolved = (data.students as string[]).map((v) => {
          const vLower = String(v).trim().toLowerCase();
          const found = all.find(
            (s) =>
              s.studentId.toLowerCase() === vLower ||
              s.name.toLowerCase() === vLower
          );
          return found || { _id: v, name: v, studentId: "", class: "" };
        });
        setSelectedChildren(resolved);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [type, data]);

  const addChild = async () => {
    if (!childClass.trim() || !childRoll.trim()) {
      setAddError("Enter both class and roll number.");
      return;
    }
    setAddingChild(true);
    setAddError("");
    try {
      const res = await fetch(
        `/api/students?class=${encodeURIComponent(childClass.trim())}&roll=${encodeURIComponent(childRoll.trim())}`
      );
      const json = await res.json();
      const s = json.students?.[0];
      if (s) {
        if (selectedChildren.find((c) => c.studentId === s.studentId)) {
          setAddError("This child is already linked.");
        } else {
          setSelectedChildren((prev) => [...prev, s]);
          setChildClass("");
          setChildRoll("");
        }
      } else {
        setAddError("No student found with this class and roll number.");
      }
    } catch {
      setAddError("Unable to verify the student. Please try again.");
    }
    setAddingChild(false);
  };

  const removeChild = (id: string) => {
    setSelectedChildren((prev) => prev.filter((c) => c._id !== id));
  };

  const onSubmit = handleSubmit(async (formData) => {
    setLoading(true);
    setError("");
    setSuccess("");

    if (selectedChildren.length === 0) {
      setError("Please link at least one child.");
      setLoading(false);
      return;
    }

    const payload = {
      ...formData,
      students: selectedChildren.map((c) => c.studentId || c.name),
    };

    let result;
    if (type === "create") {
      if (!formData.password) { setError("Password is required."); setLoading(false); return; }
      result = await createParent(payload);
    } else {
      result = await updateParent(data?.id, payload);
    }

    if (result.success) {
      setSuccess(type === "create" ? "Parent account created!" : "Parent updated!");
      router.refresh();
    } else {
      setError(result.error || "Something went wrong.");
    }
    setLoading(false);
  });

  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">{type === "create" ? "Register a New Parent" : "Update Parent"}</h1>

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

      <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Contact Info</span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField label="Phone" name="phone" register={register} error={errors.phone} />
        <InputField label="Address" name="address" register={register} error={errors.address} />
      </div>

      {/* Child Linking Section */}
      <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Link Your Children</span>

      {/* Selected children */}
      {selectedChildren.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedChildren.map((c) => (
            <div key={c._id} className="flex items-center gap-2 bg-mahankalSkyLight border border-mahankalSky rounded-full px-3 py-1 text-sm">
              <span className="font-medium">{c.name}</span>
              {c.studentId && <span className="text-xs text-gray-500">({c.studentId})</span>}
              {c.class && <span className="text-xs text-gray-400">Class {c.class}</span>}
              <button
                type="button"
                onClick={() => removeChild(c._id)}
                className="text-red-400 hover:text-red-600 font-bold ml-1"
              >×</button>
            </div>
          ))}
        </div>
      )}

      {/* Add child by class + roll */}
      <div className="flex flex-col gap-3 border border-gray-200 rounded-xl p-4 bg-gray-50">
        <p className="text-sm font-medium text-gray-700">Add child by Class &amp; Roll Number</p>
        <div className="flex gap-2">
          <input
            type="number"
            min="1"
            max="12"
            placeholder="Class (1‑12)"
            className="w-28 border border-gray-200 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-mahankalSky"
            value={childClass}
            onChange={(e) => setChildClass(e.target.value)}
          />
          <input
            type="number"
            min="1"
            placeholder="Roll No."
            className="flex-1 border border-gray-200 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-mahankalSky"
            value={childRoll}
            onChange={(e) => setChildRoll(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addChild())}
          />
          <button
            type="button"
            onClick={addChild}
            disabled={addingChild}
            className="bg-mahankalSky text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
          >
            {addingChild ? "..." : "Add Child"}
          </button>
        </div>

        {addError && <p className="text-xs text-red-500 font-medium">{addError}</p>}
        <p className="text-xs text-gray-400">
          You can link multiple children. They will all appear on the parent&apos;s dashboard.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-pink-400 text-white p-2 rounded-md font-medium disabled:opacity-60"
      >
        {loading ? "Saving..." : type === "create" ? "Create Parent Account" : "Update Parent"}
      </button>
    </form>
  );
};

export default ParentForm;

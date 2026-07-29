"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import InputField from "../InputField";
import { createParent, updateParent } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
  grade: number;
};

const ParentForm = ({ type, data }: { type: "create" | "update"; data?: any }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Child linking state
  const [classFilter, setClassFilter] = useState("");
  const [searchResults, setSearchResults] = useState<StudentOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedChildren, setSelectedChildren] = useState<StudentOption[]>(
    data?.students ? data.students.map((name: string) => ({ name, studentId: "", _id: name, class: "" })) : []
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

  const searchStudents = async () => {
    if (!classFilter.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/students?class=${classFilter.trim()}`);
      const json = await res.json();
      setSearchResults(json.students || []);
    } catch {
      setSearchResults([]);
    }
    setSearching(false);
  };

  const addChild = (student: StudentOption) => {
    if (!selectedChildren.find((c) => c._id === student._id)) {
      setSelectedChildren((prev) => [...prev, student]);
    }
    setSearchResults([]);
    setClassFilter("");
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
      students: selectedChildren.map((c) => c.name),
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
            <div key={c._id} className="flex items-center gap-2 bg-lamaSkyLight border border-lamaSky rounded-full px-3 py-1 text-sm">
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

      {/* Search by class */}
      <div className="flex flex-col gap-3 border border-gray-200 rounded-xl p-4 bg-gray-50">
        <p className="text-sm font-medium text-gray-700">Search student by Class</p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter class (e.g. 3 or 3A)"
            className="flex-1 border border-gray-200 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-lamaSky"
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), searchStudents())}
          />
          <button
            type="button"
            onClick={searchStudents}
            disabled={searching}
            className="bg-lamaSky text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
          >
            {searching ? "..." : "Search"}
          </button>
        </div>

        {/* Results */}
        {searchResults.length > 0 && (
          <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
            <p className="text-xs text-gray-400">Select your child:</p>
            {searchResults.map((s) => (
              <button
                key={s._id}
                type="button"
                onClick={() => addChild(s)}
                disabled={!!selectedChildren.find((c) => c._id === s._id)}
                className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2 hover:bg-lamaSkyLight text-left disabled:opacity-50"
              >
                <span className="font-medium text-sm">{s.name}</span>
                <div className="flex gap-2 text-xs text-gray-500">
                  <span className="bg-gray-100 px-2 py-0.5 rounded">ID: {s.studentId}</span>
                  <span className="bg-gray-100 px-2 py-0.5 rounded">Class {s.class}</span>
                  <span className="bg-gray-100 px-2 py-0.5 rounded">Grade {s.grade}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {searchResults.length === 0 && classFilter && !searching && (
          <p className="text-xs text-gray-400">No students found. Try a different class.</p>
        )}
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

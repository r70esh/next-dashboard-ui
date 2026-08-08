"use client";

import { useState } from "react";
import { updateUserProfile } from "@/lib/actions";
import { useRouter } from "next/navigation";

export default function ProfileEditForm({
  id,
  role,
  initialName,
  initialPhone,
  initialAddress,
}: {
  id: string;
  role: string;
  initialName: string;
  initialPhone: string;
  initialAddress: string;
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [address, setAddress] = useState(initialAddress);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const res = await updateUserProfile(id, role, { name, phone, address });
    setLoading(false);

    if (res.success) {
      setMessage({ type: "success", text: "Profile updated successfully!" });
      setIsEditing(false);
      router.refresh();
    } else {
      setMessage({ type: "error", text: res.error || "Failed to update profile." });
    }
  };

  if (!isEditing) {
    return (
      <div className="mt-4 flex flex-col gap-2">
        {message && (
          <div
            className={`p-3 rounded-lg text-xs font-semibold ${
              message.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}
        <button
          onClick={() => setIsEditing(true)}
          className="bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs px-4 py-2 rounded-lg transition w-fit"
        >
          ✏️ Edit Profile
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col gap-3 max-w-md">
      <h3 className="text-sm font-bold text-slate-800">Edit Profile</h3>

      {message && (
        <div
          className={`p-2.5 rounded-lg text-xs font-semibold ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-slate-600">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="p-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-sky-500 bg-white"
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-slate-600">Phone Number</label>
        <input
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="p-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-sky-500 bg-white"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-slate-600">Address</label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="p-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-sky-500 bg-white"
          required
        />
      </div>

      <div className="flex gap-2 mt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-semibold text-xs px-4 py-2 rounded-lg transition"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={() => setIsEditing(false)}
          className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs px-4 py-2 rounded-lg transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

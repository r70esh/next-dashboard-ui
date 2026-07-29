"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createTeacher, createStudent, createParent } from "@/lib/actions";

type Role = "teacher" | "student" | "parent";

const roleData: Record<Role, { label: string; icon: string; btnColor: string; activeClass: string }> = {
  teacher: {
    label: "Teacher",
    icon: "📚",
    btnColor: "bg-sky-600 hover:bg-sky-700",
    activeClass: "border-sky-600 bg-sky-100 text-sky-900 ring-2 ring-sky-400 font-bold",
  },
  student: {
    label: "Student",
    icon: "🎒",
    btnColor: "bg-amber-600 hover:bg-amber-700",
    activeClass: "border-amber-600 bg-amber-100 text-amber-900 ring-2 ring-amber-400 font-bold",
  },
  parent: {
    label: "Parent",
    icon: "👨‍👩‍👧",
    btnColor: "bg-pink-600 hover:bg-pink-700",
    activeClass: "border-pink-600 bg-pink-100 text-pink-900 ring-2 ring-pink-400 font-bold",
  },
};

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("teacher");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Common fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // Teacher-specific
  const [subjects, setSubjects] = useState("");

  // Student-specific
  const [grade, setGrade] = useState("");
  const [classNum, setClassNum] = useState("");
  const [rollNum, setRollNum] = useState("");
  const [generatedId, setGeneratedId] = useState("");

  // Parent-specific
  const [classFilter, setClassFilter] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedChildren, setSelectedChildren] = useState<any[]>([]);

  // Auto-generate student ID (c<class><roll>)
  useEffect(() => {
    if (classNum && rollNum) {
      const c = classNum.replace(/\D/g, "");
      const r = rollNum.replace(/\D/g, "");
      if (c && r) setGeneratedId(`c${c}${r}`);
      else setGeneratedId("");
    } else {
      setGeneratedId("");
    }
  }, [classNum, rollNum]);

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

  const addChild = (s: any) => {
    if (!selectedChildren.find((c) => c._id === s._id)) {
      setSelectedChildren((p) => [...p, s]);
    }
    setSearchResults([]);
    setClassFilter("");
  };

  const removeChild = (id: string) => {
    setSelectedChildren((p) => p.filter((c) => c._id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      let result: any;

      if (role === "teacher") {
        result = await createTeacher({ name, email, password, phone, address, subjects });
      } else if (role === "student") {
        if (!generatedId) {
          setError("Please enter class and roll number to generate your ID.");
          setLoading(false);
          return;
        }
        result = await createStudent({
          name,
          email,
          password,
          phone,
          address,
          grade,
          class: classNum,
          studentId: generatedId,
        });
      } else {
        if (selectedChildren.length === 0) {
          setError("Please search and select at least one child.");
          setLoading(false);
          return;
        }
        result = await createParent({
          name,
          email,
          password,
          phone,
          address,
          students: selectedChildren.map((c) => c.name).join(","),
        });
      }

      if (result.success) {
        setSuccess(`✅ Account created! You can now sign in as a ${role}.`);
        setName("");
        setEmail("");
        setPassword("");
        setPhone("");
        setAddress("");
        setSubjects("");
        setGrade("");
        setClassNum("");
        setRollNum("");
        setSelectedChildren([]);
      } else {
        setError(result.error || "Something went wrong. Email may already be registered.");
      }
    } catch {
      setError("Unexpected error. Please try again.");
    }
    setLoading(false);
  };

  const current = roleData[role];

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 p-6 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md mb-2">
            <Image src="/logo.png" alt="logo" width={40} height={40} />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-wide">Create Your Account</h1>
          <p className="text-xs text-slate-300 mt-1">SchooLama Registration</p>
        </div>

        <div className="p-6 md:p-8">
          {/* Role selector */}
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Select Your Account Type
          </label>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {(["teacher", "student", "parent"] as Role[]).map((r) => {
              const item = roleData[r];
              const isSelected = role === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setRole(r);
                    setError("");
                    setSuccess("");
                  }}
                  className={`cursor-pointer flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-150 text-sm font-semibold ${
                    isSelected
                      ? item.activeClass
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-400 hover:bg-slate-100"
                  }`}
                >
                  <span className="text-2xl mb-1">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold p-3 rounded-xl mb-4">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-800 text-xs font-semibold p-4 rounded-xl mb-4">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Common fields */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700">Full Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Enter your full name"
                className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-800 text-sm text-slate-800 bg-slate-50 focus:bg-white transition"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-800 text-sm text-slate-800 bg-slate-50 focus:bg-white transition"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Minimum 8 characters"
                minLength={8}
                className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-800 text-sm text-slate-800 bg-slate-50 focus:bg-white transition"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">Phone</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone number"
                  className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-800 text-sm text-slate-800 bg-slate-50 focus:bg-white transition"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">Address</label>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  placeholder="Your address"
                  className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-800 text-sm text-slate-800 bg-slate-50 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Teacher: subjects */}
            {role === "teacher" && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">Subjects (comma separated)</label>
                <input
                  value={subjects}
                  onChange={(e) => setSubjects(e.target.value)}
                  placeholder="Math, Science, English"
                  className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-800 text-sm text-slate-800 bg-slate-50 focus:bg-white transition"
                />
              </div>
            )}

            {/* Student: class + roll -> auto ID */}
            {role === "student" && (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-700">Grade</label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      required
                      placeholder="e.g. 3"
                      className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-800 text-sm text-slate-800 bg-slate-50 focus:bg-white transition"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-700">Class</label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={classNum}
                      onChange={(e) => setClassNum(e.target.value)}
                      required
                      placeholder="e.g. 3"
                      className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-800 text-sm text-slate-800 bg-slate-50 focus:bg-white transition"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-700">Roll No.</label>
                    <input
                      type="number"
                      min="1"
                      value={rollNum}
                      onChange={(e) => setRollNum(e.target.value)}
                      required
                      placeholder="e.g. 11"
                      className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-800 text-sm text-slate-800 bg-slate-50 focus:bg-white transition"
                    />
                  </div>
                </div>

                {generatedId && (
                  <div className="flex items-center justify-between bg-amber-50 border border-amber-300 rounded-xl p-3">
                    <span className="text-xs text-amber-900 font-medium">Your Student ID will be:</span>
                    <span className="font-extrabold text-lg text-amber-700 bg-amber-100 px-3 py-1 rounded-lg">
                      {generatedId}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Parent: search child by class */}
            {role === "parent" && (
              <div className="flex flex-col gap-3">
                {selectedChildren.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedChildren.map((c) => (
                      <div
                        key={c._id}
                        className="flex items-center gap-2 bg-pink-50 border border-pink-300 rounded-full px-3 py-1 text-xs font-semibold text-pink-900"
                      >
                        <span>{c.name}</span>
                        <span className="text-pink-600">({c.studentId})</span>
                        <button
                          type="button"
                          onClick={() => removeChild(c._id)}
                          className="text-pink-600 hover:text-pink-900 font-bold cursor-pointer"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-700">Find your child by Class</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter class number (e.g. 3)"
                      className="flex-1 border border-slate-300 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-pink-500 bg-white"
                      value={classFilter}
                      onChange={(e) => setClassFilter(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), searchStudents())}
                    />
                    <button
                      type="button"
                      onClick={searchStudents}
                      disabled={searching}
                      className="cursor-pointer bg-pink-600 hover:bg-pink-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition disabled:opacity-60"
                    >
                      {searching ? "Searching..." : "Search"}
                    </button>
                  </div>

                  {searchResults.length > 0 && (
                    <div className="mt-2 flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                      <span className="text-[11px] font-bold text-slate-400">Click to select child:</span>
                      {searchResults.map((s) => (
                        <button
                          key={s._id}
                          type="button"
                          onClick={() => addChild(s)}
                          disabled={!!selectedChildren.find((c) => c._id === s._id)}
                          className="cursor-pointer flex items-center justify-between bg-white border border-slate-200 rounded-xl p-2.5 hover:bg-pink-50 text-left disabled:opacity-40 transition"
                        >
                          <span className="font-semibold text-xs text-slate-800">{s.name}</span>
                          <div className="flex gap-1.5 text-[10px]">
                            <span className="bg-slate-100 font-medium px-2 py-0.5 rounded text-slate-600">
                              ID: {s.studentId}
                            </span>
                            <span className="bg-slate-100 font-medium px-2 py-0.5 rounded text-slate-600">
                              Class {s.class}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchResults.length === 0 && classFilter && !searching && (
                    <p className="text-xs text-slate-400 mt-1">No students found for this class.</p>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`cursor-pointer w-full text-white p-3.5 rounded-xl font-bold text-sm shadow-md transition-all duration-200 disabled:opacity-60 mt-1 ${current.btnColor}`}
            >
              {loading ? "Creating account..." : `Register as ${current.label}`}
            </button>

            <div className="text-center text-xs text-slate-500 mt-2">
              Already have an account?{" "}
              <Link href="/sign-in" className="text-sky-600 hover:text-sky-800 font-bold underline ml-1">
                Sign In
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

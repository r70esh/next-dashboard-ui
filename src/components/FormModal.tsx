"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteTeacher, deleteStudent, deleteParent,
  deleteSubject, deleteClass, deleteLesson,
  deleteExam, deleteAssignment, deleteResult,
  deleteAttendance, deleteEvent, deleteAnnouncement
} from "@/lib/actions";

const SubjectForm = dynamic(() => import("./forms/SubjectForm"), { loading: () => <p>Loading...</p> });
const ClassForm = dynamic(() => import("./forms/ClassForm"), { loading: () => <p>Loading...</p> });
const TeacherForm = dynamic(() => import("./forms/TeacherForm"), { loading: () => <p>Loading...</p> });
const StudentForm = dynamic(() => import("./forms/StudentForm"), { loading: () => <p>Loading...</p> });
const ParentForm = dynamic(() => import("./forms/ParentForm"), { loading: () => <p>Loading...</p> });
const EventForm = dynamic(() => import("./forms/EventForm"), { loading: () => <p>Loading...</p> });
const AssignmentForm = dynamic(() => import("./forms/AssignmentForm"), { loading: () => <p>Loading...</p> });
const LessonForm = dynamic(() => import("./forms/LessonForm"), { loading: () => <p>Loading...</p> });
const ExamForm = dynamic(() => import("./forms/ExamForm"), { loading: () => <p>Loading...</p> });
const ResultForm = dynamic(() => import("./forms/ResultForm"), { loading: () => <p>Loading...</p> });
const AttendanceForm = dynamic(() => import("./forms/AttendanceForm"), { loading: () => <p>Loading...</p> });
// ...


const deleteActions: Record<string, (id: string) => Promise<any>> = {
  teacher: deleteTeacher,
  student: deleteStudent,
  parent: deleteParent,
  subject: deleteSubject,
  class: deleteClass,
  lesson: deleteLesson,
  exam: deleteExam,
  assignment: deleteAssignment,
  result: deleteResult,
  attendance: deleteAttendance,
  event: deleteEvent,
  announcement: deleteAnnouncement,
};

const forms: { [key: string]: (type: "create" | "update", data?: any) => JSX.Element } = {
  teacher: (type, data) => <TeacherForm type={type} data={data} />,
  student: (type, data) => <StudentForm type={type} data={data} />,
  parent: (type, data) => <ParentForm type={type} data={data} />,
  class: (type, data) => <ClassForm type={type} data={data} />,
  event: (type, data) => <EventForm type={type} data={data} />,
  assignment: (type, data) => <AssignmentForm type={type} data={data} />,
  subject: (type, data) => <SubjectForm type={type} data={data} />,
  lesson: (type, data) => <LessonForm type={type} data={data} />,
  exam: (type, data) => <ExamForm type={type} data={data} />,
  result: (type, data) => <ResultForm type={type} data={data} />,
  attendance: (type, data) => <AttendanceForm type={type} data={data} />,
};

const FormModal = ({
  table,
  type,
  data,
  id,
}: {
  table:
    | "teacher" | "student" | "parent" | "subject" | "class"
    | "lesson" | "exam" | "assignment" | "result" | "attendance"
    | "event" | "announcement";
  type: "create" | "update" | "delete";
  data?: any;
  id?: number | string;
}) => {
  const size = type === "create" ? "w-8 h-8" : "w-7 h-7";
  const bgColor =
    type === "create" ? "bg-lamaYellow"
    : type === "update" ? "bg-lamaSky"
    : "bg-lamaPurple";

  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    setError("");
    const action = deleteActions[table];
    if (action) {
      const result = await action(id.toString());
      if (result.success) {
        setOpen(false);
        router.refresh();
      } else {
        setError(result.error || "Delete failed.");
      }
    }
    setDeleting(false);
  };

  const Form = () => {
    if (type === "delete") {
      return (
        <div className="p-4 flex flex-col gap-4">
          <span className="text-center font-medium">
            Are you sure you want to delete this {table}? All data will be lost.
          </span>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setOpen(false)}
              className="bg-gray-200 text-gray-700 py-2 px-6 rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 text-white py-2 px-6 rounded-md disabled:opacity-60"
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      );
    }
    if ((type === "create" || type === "update") && forms[table]) {
      return forms[table](type, data);
    }
    return (
      <div className="p-4 text-center text-gray-500">
        Form for <strong>{table}</strong> is not yet available.
      </div>
    );
  };

  return (
    <>
      <button
        className={`${size} flex items-center justify-center rounded-full ${bgColor}`}
        onClick={() => setOpen(true)}
      >
        <Image src={`/${type}.png`} alt="" width={16} height={16} />
      </button>
      {open && (
        <div className="w-screen h-screen absolute left-0 top-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-md relative w-[90%] md:w-[70%] lg:w-[60%] xl:w-[50%] 2xl:w-[40%] max-h-[90vh] overflow-y-auto">
            <Form />
            <div
              className="absolute top-4 right-4 cursor-pointer"
              onClick={() => setOpen(false)}
            >
              <Image src="/close.png" alt="" width={14} height={14} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FormModal;

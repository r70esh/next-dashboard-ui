import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import Image from "next/image";
import connectToDB from "@/lib/db";
import { Result as ResultModel, Teacher, Student, Parent } from "@/lib/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type Result = {
  id: string;
  subject: string;
  class: string;
  teacher: string;
  student: string;
  type: "assignment" | "class_test" | "terminal_exam";
  date: string;
  score: number;
  maxScore: number;
};

const columns = [
  { header: "Subject", accessor: "name" },
  { header: "Student", accessor: "student" },
  { header: "Type", accessor: "type" },
  { header: "Score", accessor: "score", className: "hidden md:table-cell" },
  { header: "Teacher", accessor: "teacher", className: "hidden md:table-cell" },
  { header: "Class", accessor: "class", className: "hidden md:table-cell" },
  { header: "Date", accessor: "date", className: "hidden md:table-cell" },
  { header: "Actions", accessor: "action" },
];

const typeLabel: Record<string, string> = {
  assignment: "📝 Assignment",
  class_test: "📋 Class Test",
  terminal_exam: "🎓 Terminal Exam",
};

const typeBadge: Record<string, string> = {
  assignment: "bg-blue-100 text-blue-800",
  class_test: "bg-amber-100 text-amber-800",
  terminal_exam: "bg-purple-100 text-purple-800",
};

const ResultListPage = async () => {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role || "admin";
  const userId = (session?.user as any)?.id;
  const userEmail = session?.user?.email;

  await connectToDB();

  let filter: any = {};

  if (role === "admin") {
    filter = {};
  } else if (role === "teacher") {
    const teacherObj = await Teacher.findOne({
      $or: [{ _id: userId }, { email: userEmail }]
    });
    if (teacherObj) {
      filter = {
        $or: [
          { teacher: teacherObj.name },
          { class: { $in: teacherObj.classes || [] } }
        ]
      };
    }
  } else if (role === "student") {
    const studentObj = await Student.findOne({
      $or: [{ _id: userId }, { email: userEmail }]
    });
    if (studentObj) {
      filter = {
        $or: [
          { student: studentObj.name },
          { student: studentObj.studentId },
          { student: studentObj.email }
        ]
      };
    } else {
      filter = { student: "__NONE__" };
    }
  } else if (role === "parent") {
    const parentObj = await Parent.findOne({
      $or: [{ _id: userId }, { email: userEmail }]
    });
    if (parentObj && parentObj.students && parentObj.students.length > 0) {
      filter = {
        $or: [
          { student: { $in: parentObj.students } }
        ]
      };
    } else {
      filter = { student: "__NONE__" };
    }
  }

  const raw = await ResultModel.find(filter);
  const data: Result[] = JSON.parse(JSON.stringify(raw)).map((r: any) => ({
    ...r,
    id: r._id,
    date: new Date(r.date).toLocaleDateString(),
  }));

  const renderRow = (item: Result) => (
    <tr key={item.id} className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-mahankalPurpleLight">
      <td className="flex items-center gap-4 p-4 font-medium">{item.subject}</td>
      <td className="font-semibold text-slate-800">{item.student}</td>
      <td>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${typeBadge[item.type] || "bg-slate-100 text-slate-700"}`}>
          {typeLabel[item.type] || item.type}
        </span>
      </td>
      <td className="hidden md:table-cell font-black text-green-700">
        {(item as any).score}/{(item as any).maxScore || 100}
      </td>
      <td className="hidden md:table-cell">{item.teacher}</td>
      <td className="hidden md:table-cell">
        <span className="bg-sky-100 text-sky-900 font-bold px-2 py-0.5 rounded text-xs">
          Class {item.class}
        </span>
      </td>
      <td className="hidden md:table-cell">{item.date}</td>
      <td>
        <div className="flex items-center gap-2">
          {(role === "admin" || role === "teacher") && (
            <>
              <FormModal table="result" type="update" data={item} />
              <FormModal table="result" type="delete" id={item.id} />
            </>
          )}
        </div>
      </td>
    </tr>
  );


  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">Exam & Assignment Results</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-mahankalYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-mahankalYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {(role === "admin" || role === "teacher") && <FormModal table="result" type="create" />}
          </div>
        </div>
      </div>
      <Table columns={columns} renderRow={renderRow} data={data} />
      <Pagination />
    </div>
  );
};

export default ResultListPage;

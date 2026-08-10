export const dynamic = 'force-dynamic';

import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableToolbar from "@/components/TableToolbar";
import FilterSelect from "@/components/FilterSelect";
import connectToDB from "@/lib/db";
import { Exam as ExamModel, Teacher, Student, Parent } from "@/lib/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { filterAndSort } from "@/lib/tableUtils";

/** Normalise "Class 7", "class7", "7" → "7" */
function normaliseClass(cls: string): string {
  return (cls || "").replace(/[^0-9]/g, "");
}

/** All storage variants for matching */
function classVariants(level: string): string[] {
  const n = normaliseClass(level);
  if (!n) return [];
  return [n, `Class ${n}`, `class ${n}`, `CLASS ${n}`];
}

type Exam = {
  id: string;
  subject: string;
  class: string;
  teacher: string;
  type: string;
  date: string;
};

const columns = [
  { header: "Subject Name", accessor: "name" },
  { header: "Type", accessor: "type", className: "hidden md:table-cell" },
  { header: "Class", accessor: "class" },
  { header: "Teacher", accessor: "teacher", className: "hidden lg:table-cell" },
  { header: "Date", accessor: "date", className: "hidden lg:table-cell" },
  { header: "Actions", accessor: "action" },
];

const ExamListPage = async ({
  searchParams,
}: {
  searchParams: { search?: string; filter?: string; sort?: string; filterType?: string };
}) => {
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
      $or: [{ _id: userId }, { email: userEmail }],
    });
    if (teacherObj) {
      // Teacher sees exams they created (by name) OR for any of their classes
      const classVars = (teacherObj.classes || []).flatMap(classVariants);
      filter = {
        $or: [
          { teacher: teacherObj.name },
          ...(classVars.length > 0 ? [{ class: { $in: classVars } }] : []),
        ],
      };
    }
  } else if (role === "student") {
    const studentObj = await Student.findOne({
      $or: [{ _id: userId }, { email: userEmail }],
    });
    if (studentObj?.class) {
      // Match all possible stored formats for the student's class
      filter = { class: { $in: classVariants(studentObj.class) } };
    } else {
      filter = { _id: null };
    }
  } else if (role === "parent") {
    const parentObj = await Parent.findOne({
      $or: [{ _id: userId }, { email: userEmail }],
    });
    if (parentObj?.students?.length > 0) {
      const children = await Student.find({
        $or: [
          { name: { $in: parentObj.students } },
          { studentId: { $in: parentObj.students } },
          { email: { $in: parentObj.students } },
        ],
      }).select("class");
      const levels = Array.from(
        new Set(children.map((c: any) => normaliseClass(c.class)).filter(Boolean))
      );
      if (levels.length > 0) {
        filter = { class: { $in: levels.flatMap(classVariants) } };
      } else {
        filter = { _id: null };
      }
    } else {
      filter = { _id: null };
    }
  }

  const raw = await ExamModel.find(filter).sort({ date: -1 });
  const data: Exam[] = JSON.parse(JSON.stringify(raw)).map((e: any) => ({
    ...e,
    id: e._id,
    date: new Date(e.date).toLocaleDateString(),
  }));

  const search = searchParams.search || "";
  const filterParam = searchParams.filter || "";
  const sort = searchParams.sort || "";
  const sortDir = sort.endsWith(":desc") ? "desc" : "asc";
  const sortField = sort.split(":")[0] || "";

  const filteredData = filterAndSort(data, {
    search,
    filter: filterParam,
    searchFields: ["subject", "class", "teacher", "type"],
    filterField: (e) => normaliseClass(e.class),
    sortField: sortField || undefined,
    sortDir,
  }).filter((e) => !searchParams.filterType || (e.type || "class_test") === searchParams.filterType);

  const classOptions = Array.from(
    new Set(data.map((e) => normaliseClass(e.class)).filter(Boolean))
  )
    .sort((a, b) => Number(a) - Number(b))
    .map((c) => ({ value: c, label: `Class ${c}` }));

  const typeOptions = [
    { value: "class_test", label: "Class Test" },
    { value: "terminal_exam", label: "Terminal Exam" },
  ];

  const renderRow = (item: Exam) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-mahankalPurpleLight"
    >
      <td className="flex items-center gap-4 p-4 font-medium">{item.subject}</td>
      <td className="hidden md:table-cell">
        <span
          className={`px-2 py-1 rounded text-xs font-bold border ${
            item.type === "terminal_exam"
              ? "bg-purple-100 text-purple-800 border-purple-300"
              : "bg-amber-100 text-amber-800 border-amber-300"
          }`}
        >
          {item.type === "terminal_exam" ? "Terminal Exam" : "Class Test"}
        </span>
      </td>
      <td>
        <span className="bg-sky-100 text-sky-900 font-bold px-2 py-1 rounded text-xs">
          Class {normaliseClass(item.class) || item.class}
        </span>
      </td>
      <td className="hidden lg:table-cell">{item.teacher}</td>
      <td className="hidden lg:table-cell">{item.date}</td>
      <td>
        <div className="flex items-center gap-2">
          {(role === "admin" || role === "teacher") && (
            <>
              <FormModal table="exam" type="update" data={item} />
              <FormModal table="exam" type="delete" id={item.id} />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">Exams / Class Tests</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableToolbar
            searchPlaceholder="Search exams..."
            filterOptions={classOptions}
            filterPlaceholder="Class"
            sortOptions={[
              { value: "subject:asc", label: "Subject (A-Z)" },
              { value: "date:asc", label: "Date (Oldest)" },
              { value: "date:desc", label: "Date (Newest)" },
            ]}
          />
          <FilterSelect
            options={typeOptions}
            placeholder="Exam Type"
            paramKey="filterType"
          />
          <div className="flex items-center gap-4 self-end">
            {(role === "admin" || role === "teacher") && <FormModal table="exam" type="create" />}
          </div>
        </div>
      </div>
      <Table columns={columns} renderRow={renderRow} data={filteredData} />
      <Pagination />
    </div>
  );
};

export default ExamListPage;

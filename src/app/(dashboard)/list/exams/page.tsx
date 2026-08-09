import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableToolbar from "@/components/TableToolbar";
import Image from "next/image";
import connectToDB from "@/lib/db";
import { Exam as ExamModel, Teacher, Student, Parent } from "@/lib/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { filterAndSort } from "@/lib/tableUtils";

type Exam = {
  id: string;
  subject: string;
  class: string;
  teacher: string;
  date: string;
};

const columns = [
  { header: "Subject Name", accessor: "name" },
  { header: "Class", accessor: "class" },
  { header: "Teacher", accessor: "teacher", className: "hidden md:table-cell" },
  { header: "Date", accessor: "date", className: "hidden md:table-cell" },
  { header: "Actions", accessor: "action" },
];

const ExamListPage = async ({
  searchParams,
}: {
  searchParams: { search?: string; filter?: string; sort?: string };
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
    // Teacher sees exams for classes they teach or created by them
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
    // Student ONLY sees exams for their specific class!
    const studentObj = await Student.findOne({
      $or: [{ _id: userId }, { email: userEmail }]
    });
    if (studentObj && studentObj.class) {
      filter = { class: studentObj.class };
    } else {
      filter = { class: "__NONE__" };
    }
  } else if (role === "parent") {
    // Parent ONLY sees exams for the classes of their linked children!
    const parentObj = await Parent.findOne({
      $or: [{ _id: userId }, { email: userEmail }]
    });
    if (parentObj && parentObj.students && parentObj.students.length > 0) {
      const children = await Student.find({
        $or: [
          { name: { $in: parentObj.students } },
          { email: { $in: parentObj.students } }
        ]
      });
      const childrenClasses = Array.from(new Set(children.map((c) => c.class).filter(Boolean)));
      if (childrenClasses.length > 0) {
        filter = { class: { $in: childrenClasses } };
      } else {
        filter = { class: "__NONE__" };
      }
    } else {
      filter = { class: "__NONE__" };
    }
  }

  const raw = await ExamModel.find(filter);
  const data: Exam[] = JSON.parse(JSON.stringify(raw)).map((e: any) => ({
    ...e,
    id: e._id,
    date: new Date(e.date).toLocaleDateString(),
  }));

  const search = searchParams.search || "";
  const filter = searchParams.filter || "";
  const sort = searchParams.sort || "";
  const sortDir = sort.endsWith(":desc") ? "desc" : "asc";
  const sortField = sort.split(":")[0] || "";

  const filteredData = filterAndSort(data, {
    search,
    filter,
    searchFields: ["subject", "class", "teacher"],
    filterField: (e) => e.class,
    sortField: sortField ? (sortField as keyof Exam) : undefined,
    sortDir,
  });

  const classOptions = Array.from(new Set(data.map((e) => String(e.class)))).map((c) => ({
    value: c,
    label: `Class ${c}`,
  }));

  const renderRow = (item: Exam) => (
    <tr key={item.id} className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-mahankalPurpleLight">
      <td className="flex items-center gap-4 p-4 font-medium">{item.subject}</td>
      <td>
        <span className="bg-amber-100 text-amber-900 font-bold px-2 py-1 rounded text-xs">
          Class {item.class}
        </span>
      </td>
      <td className="hidden md:table-cell">{item.teacher}</td>
      <td className="hidden md:table-cell">{item.date}</td>
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

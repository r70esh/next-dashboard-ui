import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableToolbar from "@/components/TableToolbar";
import Image from "next/image";
import connectToDB from "@/lib/db";
import { Assignment as AssignmentModel, Teacher, Student, Parent } from "@/lib/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { filterAndSort } from "@/lib/tableUtils";

type Assignment = {
  id: string;
  subject: string;
  class: string;
  teacher: string;
  dueDate: string;
};

const columns = [
  { header: "Subject Name", accessor: "name" },
  { header: "Class", accessor: "class" },
  { header: "Teacher", accessor: "teacher", className: "hidden md:table-cell" },
  { header: "Due Date", accessor: "dueDate", className: "hidden md:table-cell" },
  { header: "Actions", accessor: "action" },
];

const AssignmentListPage = async ({
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
    // Teacher sees assignments created by them or for their classes
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
    // Student ONLY sees assignments for their class!
    const studentObj = await Student.findOne({
      $or: [{ _id: userId }, { email: userEmail }]
    });
    if (studentObj && studentObj.class) {
      filter = { class: studentObj.class };
    } else {
      filter = { class: "__NONE__" };
    }
  } else if (role === "parent") {
    // Parent ONLY sees assignments for the classes of their linked children!
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

  const raw = await AssignmentModel.find(filter);
  const data: Assignment[] = JSON.parse(JSON.stringify(raw)).map((a: any) => ({
    ...a,
    id: a._id,
    dueDate: new Date(a.dueDate).toLocaleDateString(),
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
    filterField: (a) => a.class,
    sortField: sortField ? (sortField as keyof Assignment) : undefined,
    sortDir,
  });

  const classOptions = Array.from(new Set(data.map((a) => String(a.class)))).map((c) => ({
    value: c,
    label: `Class ${c}`,
  }));

  const renderRow = (item: Assignment) => (
    <tr key={item.id} className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-mahankalPurpleLight">
      <td className="flex items-center gap-4 p-4 font-medium">{item.subject}</td>
      <td>
        <span className="bg-sky-100 text-sky-900 font-bold px-2 py-0.5 rounded text-xs">
          Class {item.class}
        </span>
      </td>
      <td className="hidden md:table-cell">{item.teacher}</td>
      <td className="hidden md:table-cell">{item.dueDate}</td>
      <td>
        <div className="flex items-center gap-2">
          {(role === "admin" || role === "teacher") && (
            <>
              <FormModal table="assignment" type="update" data={item} />
              <FormModal table="assignment" type="delete" id={item.id} />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">Assignments</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableToolbar
            searchPlaceholder="Search assignments..."
            filterOptions={classOptions}
            filterPlaceholder="Class"
            sortOptions={[
              { value: "subject:asc", label: "Subject (A-Z)" },
              { value: "dueDate:asc", label: "Due Date (Oldest)" },
              { value: "dueDate:desc", label: "Due Date (Newest)" },
            ]}
          />
          <div className="flex items-center gap-4 self-end">
            {(role === "admin" || role === "teacher") && <FormModal table="assignment" type="create" />}
          </div>
        </div>
      </div>
      <Table columns={columns} renderRow={renderRow} data={filteredData} />
      <Pagination />
    </div>
  );
};

export default AssignmentListPage;

import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableToolbar from "@/components/TableToolbar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Image from "next/image";
import connectToDB from "@/lib/db";
import { Attendance as AttendanceModel, Student as StudentModel, Parent as ParentModel } from "@/lib/models";
import ClassAttendanceManager from "@/components/ClassAttendanceManager";
import { filterAndSort } from "@/lib/tableUtils";

const columns = [
  {
    header: "Date",
    accessor: "date",
  },
  {
    header: "Student",
    accessor: "student",
  },
  {
    header: "Class",
    accessor: "class",
  },
  {
    header: "Status",
    accessor: "status",
    className: "hidden md:table-cell",
  },
  {
    header: "Actions",
    accessor: "action",
  },
];

const AttendanceListPage = async ({
  searchParams,
}: {
  searchParams: { search?: string; filter?: string; sort?: string };
}) => {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role || "admin";
  const userId = (session?.user as any)?.id;
  const userEmail = session?.user?.email;

  await connectToDB();

  // Classes 1-12
  const availableClasses = ["1","2","3","4","5","6","7","8","9","10","11","12"];

  let filter: any = {};

  if (role === "student") {
    const student = await StudentModel.findOne({
      $or: [{ _id: userId }, { email: userEmail }]
    });
    if (student) {
      filter = {
        $or: [{ student: student.name }, { student: student.studentId }]
      };
    } else {
      filter = { student: "__NONE__" };
    }
  } else if (role === "parent") {
    const parent = await ParentModel.findOne({
      $or: [{ _id: userId }, { email: userEmail }]
    });
    if (parent && parent.students && parent.students.length > 0) {
      filter = { student: { $in: parent.students } };
    } else {
      filter = { student: "__NONE__" };
    }
  }

  const rawAttendances = await AttendanceModel.find(filter).sort({ date: -1 });
  const students = await StudentModel.find({});

  const studentMap = students.reduce((acc: any, curr: any) => {
    acc[curr.studentId] = curr.name;
    return acc;
  }, {});

  const attendanceData = JSON.parse(JSON.stringify(rawAttendances)).map((a: any) => ({
    ...a,
    id: a._id,
    studentName: studentMap[a.student] || a.student,
    displayClass: a.class || "N/A",
  }));

  const search = searchParams.search || "";
  const filterParam = searchParams.filter || "";
  const sort = searchParams.sort || "";
  const sortDir = sort.endsWith(":desc") ? "desc" : "asc";
  const sortField = sort.split(":")[0] || "";

  const filteredData = filterAndSort(attendanceData, {
    search,
    filter: filterParam,
    searchFields: ["studentName", "displayClass", "status"],
    filterField: (a) => a.status,
    sortField: sortField || undefined,
    sortDir,
  });

  const statusOptions = [
    { value: "present", label: "Present" },
    { value: "absent", label: "Absent" },
    { value: "late", label: "Late" },
  ];

  const renderRow = (item: any) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-mahankalPurpleLight"
    >
      <td className="flex flex-col gap-0.5 p-4 font-medium">
        <span>{new Date(item.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
        <span className="text-xs text-slate-500 font-bold">{new Date(item.date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
      </td>
      <td className="font-semibold text-slate-800">{item.studentName}</td>
      <td>
        <span className="bg-sky-100 text-sky-900 font-bold px-2 py-0.5 rounded text-xs">
          Class {item.displayClass}
        </span>
      </td>
      <td className="hidden md:table-cell capitalize">
        <span
          className={`px-2.5 py-1 rounded-md text-xs font-bold ${
            item.status === "present"
              ? "bg-green-100 text-green-700 border border-green-200"
              : item.status === "absent"
              ? "bg-red-100 text-red-700 border border-red-200"
              : "bg-yellow-100 text-yellow-700 border border-yellow-200"
          }`}
        >
          {item.status}
        </span>
      </td>
      <td>
        <div className="flex items-center gap-2">
          {(role === "admin" || role === "teacher") && (
            <>
              <FormModal table="attendance" type="update" data={item} />
              <FormModal table="attendance" type="delete" id={item.id} />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* CLASS ATTENDANCE MARKER FOR TEACHERS & ADMINS */}
      {(role === "admin" || role === "teacher") && (
        <ClassAttendanceManager availableClasses={availableClasses} />
      )}

      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">Attendance History</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableToolbar
            searchPlaceholder="Search attendance..."
            filterOptions={statusOptions}
            filterPlaceholder="Status"
            sortOptions={[
              { value: "date:desc", label: "Date (Newest)" },
              { value: "date:asc", label: "Date (Oldest)" },
              { value: "studentName:asc", label: "Student (A-Z)" },
            ]}
          />
          <div className="flex items-center gap-4 self-end">
            {(role === "admin" || role === "teacher") && (
              <FormModal table="attendance" type="create" />
            )}
          </div>
        </div>
      </div>
      {/* LIST */}
      <Table columns={columns} renderRow={renderRow} data={filteredData} />
      {/* PAGINATION */}
      <Pagination />
    </div>
  );
};

export default AttendanceListPage;

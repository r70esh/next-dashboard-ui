import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Image from "next/image";
import connectToDB from "@/lib/db";
import { Attendance as AttendanceModel, Student as StudentModel } from "@/lib/models";

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
    header: "Status",
    accessor: "status",
    className: "hidden md:table-cell",
  },
  {
    header: "Actions",
    accessor: "action",
  },
];

const AttendanceListPage = async () => {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role || "admin";

  await connectToDB();
  const rawAttendances = await AttendanceModel.find({});
  const students = await StudentModel.find({});
  
  const studentMap = students.reduce((acc, curr) => {
    acc[curr.studentId] = curr.name;
    return acc;
  }, {});

  const attendanceData = JSON.parse(JSON.stringify(rawAttendances)).map((a: any) => ({
    ...a,
    id: a._id,
    studentName: studentMap[a.student] || a.student,
  }));

  const renderRow = (item: any) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">
        {new Date(item.date).toLocaleDateString()}
      </td>
      <td>{item.studentName}</td>
      <td className="hidden md:table-cell capitalize">
        <span className={`px-2 py-1 rounded-md text-xs font-semibold ${item.status === 'present' ? 'bg-green-100 text-green-700' : item.status === 'absent' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
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
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">Attendance Records</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {(role === "admin" || role === "teacher") && (
              <FormModal table="attendance" type="create" />
            )}
          </div>
        </div>
      </div>
      {/* LIST */}
      <Table columns={columns} renderRow={renderRow} data={attendanceData} />
      {/* PAGINATION */}
      <Pagination />
    </div>
  );
};

export default AttendanceListPage;

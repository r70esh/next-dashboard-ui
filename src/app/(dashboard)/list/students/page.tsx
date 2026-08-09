import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableToolbar from "@/components/TableToolbar";
import { role } from "@/lib/data";
import Image from "next/image";
import Link from "next/link";
import connectToDB from "@/lib/db";
import { Student as StudentModel } from "@/lib/models";
import { filterAndSort } from "@/lib/tableUtils";

type Student = {
  id: string;
  studentId: string;
  name: string;
  email?: string;
  photo: string;
  phone?: string;
  grade: number;
  class: string;
  address: string;
};

const columns = [
  {
    header: "Info",
    accessor: "info",
  },
  {
    header: "Student ID",
    accessor: "studentId",
    className: "hidden md:table-cell",
  },
  {
    header: "Grade",
    accessor: "grade",
    className: "hidden md:table-cell",
  },
  {
    header: "Phone",
    accessor: "phone",
    className: "hidden lg:table-cell",
  },
  {
    header: "Address",
    accessor: "address",
    className: "hidden lg:table-cell",
  },
  {
    header: "Actions",
    accessor: "action",
  },
];

const StudentListPage = async ({
  searchParams,
}: {
  searchParams: { search?: string; filter?: string; sort?: string };
}) => {
  await connectToDB();
  const rawStudents = await StudentModel.find({});
  const studentsData = JSON.parse(JSON.stringify(rawStudents)).map((s: any) => ({
    ...s,
    id: s._id,
  }));

  const search = searchParams.search || "";
  const filter = searchParams.filter || "";
  const sort = searchParams.sort || "";
  const sortDir = sort.endsWith(":desc") ? "desc" : "asc";
  const sortField = sort.split(":")[0] || "";

  const filteredData = filterAndSort(studentsData, {
    search,
    filter,
    searchFields: ["name", "studentId", "class"],
    filterField: (s) => s.grade,
    sortField: sortField ? (sortField as keyof typeof studentsData[number]) : undefined,
    sortDir,
  });

  const gradeOptions = Array.from(
    new Set(studentsData.map((s: any) => String(s.grade)))
  ).map((g) => ({ value: g, label: `Grade ${g}` }));

  const renderRow = (item: Student) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-mahankalPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">
        <Image
          src={item.photo || "/avatar.png"}
          alt=""
          width={40}
          height={40}
          className="md:hidden xl:block w-10 h-10 rounded-full object-cover"
        />
        <div className="flex flex-col">
          <h3 className="font-semibold">{item.name}</h3>
          <p className="text-xs text-gray-500">{item.class}</p>
        </div>
      </td>
      <td className="hidden md:table-cell">{item.studentId}</td>
      <td className="hidden md:table-cell">{item.grade}</td>
      <td className="hidden md:table-cell">{item.phone}</td>
      <td className="hidden md:table-cell">{item.address}</td>
      <td>
        <div className="flex items-center gap-2">
          <Link href={`/list/students/${item.id}`}>
            <button className="w-7 h-7 flex items-center justify-center rounded-full bg-mahankalSky">
              <Image src="/view.png" alt="" width={16} height={16} />
            </button>
          </Link>
          {role === "admin" && (
            <FormModal table="student" type="delete" id={item.id}/>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Students</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableToolbar
            searchPlaceholder="Search students..."
            filterOptions={gradeOptions}
            filterPlaceholder="Grade"
            sortOptions={[
              { value: "name:asc", label: "Name (A-Z)" },
              { value: "name:desc", label: "Name (Z-A)" },
              { value: "grade:asc", label: "Grade (Low-High)" },
              { value: "grade:desc", label: "Grade (High-Low)" },
            ]}
          />
          <div className="flex items-center gap-4 self-end">
            {role === "admin" && (
              <FormModal table="student" type="create"/>
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

export default StudentListPage;

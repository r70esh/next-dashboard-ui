import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableToolbar from "@/components/TableToolbar";
import ApproveTeacherButton from "@/components/ApproveTeacherButton";
import Image from "next/image";
import Link from "next/link";
import connectToDB from "@/lib/db";
import { Teacher as TeacherModel } from "@/lib/models";
import { filterAndSort } from "@/lib/tableUtils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type Teacher = {
  id: string;
  teacherId: string;
  name: string;
  email?: string;
  photo: string;
  phone: string;
  subjects: string[];
  classes: string[];
  address: string;
  status?: string;
};

const columns = [
  {
    header: "Info",
    accessor: "info",
  },
  {
    header: "Teacher ID",
    accessor: "teacherId",
    className: "hidden md:table-cell",
  },
  {
    header: "Status",
    accessor: "status",
    className: "hidden md:table-cell",
  },
  {
    header: "Subjects",
    accessor: "subjects",
    className: "hidden md:table-cell",
  },
  {
    header: "Classes",
    accessor: "classes",
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

const TeacherListPage = async ({
  searchParams,
}: {
  searchParams: { search?: string; filter?: string; sort?: string };
}) => {
  await connectToDB();
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user && (session.user as any).role === "admin";
  const rawTeachers = await TeacherModel.find({});
  const teachersData = JSON.parse(JSON.stringify(rawTeachers)).map((t: any) => ({
    ...t,
    id: t._id,
  }));

  const search = searchParams.search || "";
  const filter = searchParams.filter || "";
  const sort = searchParams.sort || "";
  const sortDir = sort.endsWith(":desc") ? "desc" : "asc";
  const sortField = sort.split(":")[0] || "";

  const filteredData = filterAndSort(teachersData, {
    search,
    filter,
    searchFields: ["name", "email", "teacherId"],
    filterField: (t) => t.subjects || [],
    sortField: sortField || undefined,
    sortDir,
  });

  const subjectOptions = Array.from(
    new Set(teachersData.flatMap((t: any) => t.subjects || []))
  ).map((s) => ({ value: String(s), label: String(s) }));

  const renderRow = (item: Teacher) => {
    const pending = item.status === "pending";
    return (
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
            <h3 className="font-semibold flex items-center gap-2">
              {item.name}
              {pending && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                  Pending
                </span>
              )}
            </h3>
            <p className="text-xs text-gray-500">{item?.email}</p>
          </div>
        </td>
        <td className="hidden md:table-cell">{item.teacherId}</td>
        <td className="hidden md:table-cell">
          {pending ? (
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-700">
              Awaiting Approval
            </span>
          ) : (
            <span className="rounded-full bg-green-100 px-2.5 py-1 text-[10px] font-bold text-green-700">
              Approved
            </span>
          )}
        </td>
        <td className="hidden md:table-cell">{item.subjects?.join(",")}</td>
        <td className="hidden md:table-cell">{item.classes?.join(",")}</td>
        <td className="hidden md:table-cell">{item.phone}</td>
        <td className="hidden md:table-cell">{item.address}</td>
        <td>
          <div className="flex items-center gap-2">
            <Link href={`/list/teachers/${item.id}`}>
              <button className="w-7 h-7 flex items-center justify-center rounded-full bg-mahankalSky">
                <Image src="/view.png" alt="" width={16} height={16} />
              </button>
            </Link>
            {pending && isAdmin ? (
              <ApproveTeacherButton id={item.id} />
            ) : (
              isAdmin && <FormModal table="teacher" type="delete" id={item.id} />
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Teachers</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableToolbar
            searchPlaceholder="Search teachers..."
            filterOptions={subjectOptions}
            filterPlaceholder="Subject"
            sortOptions={[
              { value: "name:asc", label: "Name (A-Z)" },
              { value: "name:desc", label: "Name (Z-A)" },
              { value: "teacherId:asc", label: "Teacher ID (A-Z)" },
            ]}
          />
          <div className="flex items-center gap-4 self-end">
            {isAdmin && (
              <FormModal table="teacher" type="create"/>
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

export default TeacherListPage;

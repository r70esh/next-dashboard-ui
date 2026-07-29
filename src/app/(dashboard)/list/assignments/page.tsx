import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import Image from "next/image";
import connectToDB from "@/lib/db";
import { Assignment as AssignmentModel, Student, Parent } from "@/lib/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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

const AssignmentListPage = async () => {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role || "admin";

  await connectToDB();
  const userEmail = session?.user?.email;
  let filter: any = {};
  if (role === "student") {
    const student = await Student.findOne({ email: userEmail });
    if (student?.class) {
      filter = { class: student.class };
    }
  } else if (role === "parent") {
    const parent = await Parent.findOne({ email: userEmail });
    const childrenNames: string[] = parent?.students || [];
    const children = await Student.find({ name: { $in: childrenNames } });
    const classes = children.map((c: any) => c.class);
    filter = { class: { $in: classes } };
  }
  const raw = await AssignmentModel.find(filter);
  const data: Assignment[] = JSON.parse(JSON.stringify(raw)).map((a: any) => ({
    ...a,
    id: a._id,
    dueDate: new Date(a.dueDate).toLocaleDateString(),
  }));

  const renderRow = (item: Assignment) => (
    <tr key={item.id} className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight">
      <td className="flex items-center gap-4 p-4">{item.subject}</td>
      <td>{item.class}</td>
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
        <h1 className="hidden md:block text-lg font-semibold">All Assignments</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {(role === "admin" || role === "teacher") && <FormModal table="assignment" type="create" />}
          </div>
        </div>
      </div>
      <Table columns={columns} renderRow={renderRow} data={data} />
      <Pagination />
    </div>
  );
};

export default AssignmentListPage;

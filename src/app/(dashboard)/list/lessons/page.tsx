import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableToolbar from "@/components/TableToolbar";
import Image from "next/image";
import connectToDB from "@/lib/db";
import { Lesson as LessonModel } from "@/lib/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { filterAndSort } from "@/lib/tableUtils";

type Lesson = {
  id: string;
  subject: string;
  class: string;
  teacher: string;
};

const columns = [
  { header: "Subject Name", accessor: "name" },
  { header: "Class", accessor: "class" },
  { header: "Teacher", accessor: "teacher", className: "hidden md:table-cell" },
  { header: "Actions", accessor: "action" },
];

const LessonListPage = async ({
  searchParams,
}: {
  searchParams: { search?: string; filter?: string; sort?: string };
}) => {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role || "admin";

  await connectToDB();
  const raw = await LessonModel.find({});
  const data: Lesson[] = JSON.parse(JSON.stringify(raw)).map((l: any) => ({ ...l, id: l._id }));

  const search = searchParams.search || "";
  const filter = searchParams.filter || "";
  const sort = searchParams.sort || "";
  const sortDir = sort.endsWith(":desc") ? "desc" : "asc";
  const sortField = sort.split(":")[0] || "";

  const filteredData = filterAndSort(data, {
    search,
    filter,
    searchFields: ["subject", "class", "teacher"],
    filterField: (l) => l.class,
    sortField: sortField || undefined,
    sortDir,
  });

  const classOptions = Array.from(new Set(data.map((l) => String(l.class)))).map((c) => ({
    value: c,
    label: `Class ${c}`,
  }));

  const renderRow = (item: Lesson) => (
    <tr key={item.id} className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-mahankalPurpleLight">
      <td className="flex items-center gap-4 p-4">{item.subject}</td>
      <td>{item.class}</td>
      <td className="hidden md:table-cell">{item.teacher}</td>
      <td>
        <div className="flex items-center gap-2">
          {role === "admin" && (
            <>
              <FormModal table="lesson" type="update" data={item} />
              <FormModal table="lesson" type="delete" id={item.id} />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Lessons</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableToolbar
            searchPlaceholder="Search lessons..."
            filterOptions={classOptions}
            filterPlaceholder="Class"
            sortOptions={[
              { value: "subject:asc", label: "Subject (A-Z)" },
              { value: "class:asc", label: "Class (A-Z)" },
            ]}
          />
          <div className="flex items-center gap-4 self-end">
            {role === "admin" && <FormModal table="lesson" type="create" />}
          </div>
        </div>
      </div>
      <Table columns={columns} renderRow={renderRow} data={filteredData} />
      <Pagination />
    </div>
  );
};

export default LessonListPage;

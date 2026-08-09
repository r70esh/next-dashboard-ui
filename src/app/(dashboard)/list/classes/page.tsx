import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableToolbar from "@/components/TableToolbar";
import Image from "next/image";
import connectToDB from "@/lib/db";
import { Class as ClassModel } from "@/lib/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { filterAndSort } from "@/lib/tableUtils";

type ClassItem = {
  id: string;
  name: string;
  capacity: number;
  class: number;
  supervisor: string;
};

const columns = [
  { header: "Class Name", accessor: "name" },
  { header: "Class Level", accessor: "class", className: "hidden md:table-cell" },
  { header: "Capacity", accessor: "capacity", className: "hidden md:table-cell" },
  { header: "Supervisor", accessor: "supervisor", className: "hidden md:table-cell" },
  { header: "Actions", accessor: "action" },
];

const ClassListPage = async ({
  searchParams,
}: {
  searchParams: { search?: string; filter?: string; sort?: string };
}) => {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role || "admin";

  await connectToDB();
  const raw = await ClassModel.find({});
  const data: ClassItem[] = JSON.parse(JSON.stringify(raw)).map((c: any) => ({ ...c, id: c._id }));

  const search = searchParams.search || "";
  const filter = searchParams.filter || "";
  const sort = searchParams.sort || "";
  const sortDir = sort.endsWith(":desc") ? "desc" : "asc";
  const sortField = sort.split(":")[0] || "";

  const filteredData = filterAndSort(data, {
    search,
    filter,
    searchFields: ["name", "supervisor"],
    filterField: (c) => c.class,
    sortField: sortField || undefined,
    sortDir,
  });

  const classOptions = Array.from(new Set(data.map((c) => String(c.class)))).map((c) => ({
    value: c,
    label: `Class ${c}`,
  }));

  const renderRow = (item: ClassItem) => (
    <tr key={item.id} className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-mahankalPurpleLight">
      <td className="flex items-center gap-4 p-4">{item.name}</td>
      <td className="hidden md:table-cell">Class {item.class}</td>
      <td className="hidden md:table-cell">{item.capacity}</td>
      <td className="hidden md:table-cell">{item.supervisor}</td>
      <td>
        <div className="flex items-center gap-2">
          {role === "admin" && (
            <>
              <FormModal table="class" type="update" data={item} />
              <FormModal table="class" type="delete" id={item.id} />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Classes</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableToolbar
            searchPlaceholder="Search classes..."
            filterOptions={classOptions}
            filterPlaceholder="Class Level"
            sortOptions={[
              { value: "name:asc", label: "Name (A-Z)" },
              { value: "class:asc", label: "Class (Low-High)" },
              { value: "class:desc", label: "Class (High-Low)" },
              { value: "capacity:asc", label: "Capacity (Low-High)" },
            ]}
          />
          <div className="flex items-center gap-4 self-end">
            {role === "admin" && <FormModal table="class" type="create" />}
          </div>
        </div>
      </div>
      <Table columns={columns} renderRow={renderRow} data={filteredData} />
      <Pagination />
    </div>
  );
};

export default ClassListPage;

export const dynamic = 'force-dynamic';

import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableToolbar from "@/components/TableToolbar";
import Image from "next/image";
import connectToDB from "@/lib/db";
import { Event as EventModel } from "@/lib/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { filterAndSort } from "@/lib/tableUtils";

type EventItem = {
  id: string;
  title: string;
  description: string;
  class: string;
  date: string;
  startTime: string;
  endTime: string;
};

const columns = [
  { header: "Title", accessor: "title" },
  { header: "Class", accessor: "class" },
  { header: "Date", accessor: "date", className: "hidden md:table-cell" },
  { header: "Start Time", accessor: "startTime", className: "hidden md:table-cell" },
  { header: "End Time", accessor: "endTime", className: "hidden md:table-cell" },
  { header: "Actions", accessor: "action" },
];

const EventListPage = async ({
  searchParams,
}: {
  searchParams: { search?: string; filter?: string; sort?: string };
}) => {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role || "admin";

  await connectToDB();
  const raw = await EventModel.find({});
  const data: EventItem[] = JSON.parse(JSON.stringify(raw)).map((e: any) => ({
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
    searchFields: ["title", "class", "description"],
    filterField: (e) => e.class,
    sortField: sortField || undefined,
    sortDir,
  });

  const classOptions = Array.from(new Set(data.map((e) => String(e.class)))).map((c) => ({
    value: c,
    label: `Class ${c}`,
  }));

  const renderRow = (item: EventItem) => (
    <tr key={item.id} className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-mahankalPurpleLight">
      <td className="flex flex-col gap-1 p-4">
        <span className="font-semibold">{item.title}</span>
        <span className="text-xs text-gray-500 line-clamp-2">{item.description}</span>
      </td>
      <td>{item.class}</td>
      <td className="hidden md:table-cell">{item.date}</td>
      <td className="hidden md:table-cell">{item.startTime}</td>
      <td className="hidden md:table-cell">{item.endTime}</td>
      <td>
        <div className="flex items-center gap-2">
          {role === "admin" && (
            <>
              <FormModal table="event" type="update" data={item} />
              <FormModal table="event" type="delete" id={item.id} />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Events</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableToolbar
            searchPlaceholder="Search events..."
            filterOptions={classOptions}
            filterPlaceholder="Class"
            sortOptions={[
              { value: "title:asc", label: "Title (A-Z)" },
              { value: "date:asc", label: "Date (Oldest)" },
              { value: "date:desc", label: "Date (Newest)" },
            ]}
          />
          <div className="flex items-center gap-4 self-end">
            {role === "admin" && <FormModal table="event" type="create" />}
          </div>
        </div>
      </div>
      <Table columns={columns} renderRow={renderRow} data={filteredData} />
      <Pagination />
    </div>
  );
};

export default EventListPage;

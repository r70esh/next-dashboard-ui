"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Option = { value: string; label: string };

export default function TableToolbar({
  searchPlaceholder = "Search...",
  filterOptions = [],
  filterPlaceholder = "Filter",
  sortOptions = [],
  sortPlaceholder = "Sort",
}: {
  searchPlaceholder?: string;
  filterOptions?: Option[];
  filterPlaceholder?: string;
  sortOptions?: Option[];
  sortPlaceholder?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
      <div className="w-full md:w-auto flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 px-2">
        <Image src="/search.png" alt="" width={14} height={14} />
        <input
          type="text"
          placeholder={searchPlaceholder}
          defaultValue={searchParams.get("search") || ""}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setParam("search", (e.target as HTMLInputElement).value);
            }
          }}
          className="w-full md:w-[180px] p-2 bg-transparent outline-none"
        />
      </div>
      <div className="flex items-center gap-2 self-end">
        {filterOptions.length > 0 && (
          <select
            value={searchParams.get("filter") || ""}
            onChange={(e) => setParam("filter", e.target.value)}
            className="h-8 max-w-[150px] text-[11px] font-bold text-slate-700 bg-mahankalYellow rounded-full px-2.5 cursor-pointer outline-none"
            title={filterPlaceholder}
          >
            <option value="">{filterPlaceholder}</option>
            {filterOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        )}
        {sortOptions.length > 0 && (
          <select
            value={searchParams.get("sort") || ""}
            onChange={(e) => setParam("sort", e.target.value)}
            className="h-8 max-w-[160px] text-[11px] font-bold text-slate-700 bg-mahankalYellow rounded-full px-2.5 cursor-pointer outline-none"
            title={sortPlaceholder}
          >
            <option value="">{sortPlaceholder}</option>
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}

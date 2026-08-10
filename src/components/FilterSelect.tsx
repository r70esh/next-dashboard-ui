"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Option = { value: string; label: string };

export default function FilterSelect({
  options,
  placeholder = "Filter",
  paramKey = "filter",
  className = "h-8 max-w-[150px] text-[11px] font-bold text-slate-700 bg-mahankalYellow rounded-full px-2.5 cursor-pointer outline-none",
}: {
  options: Option[];
  placeholder?: string;
  paramKey?: string;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <select
      value={searchParams.get(paramKey) || ""}
      onChange={(e) => {
        const params = new URLSearchParams(searchParams.toString());
        if (e.target.value) params.set(paramKey, e.target.value);
        else params.delete(paramKey);
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      }}
      className={className}
      title={placeholder}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

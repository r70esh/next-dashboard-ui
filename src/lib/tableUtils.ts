type FieldAccessor<T> = string | ((item: T) => any);

function getValue<T>(item: T, field: FieldAccessor<T>): any {
  if (typeof field === "function") return field(item);
  return (item as any)[field];
}

export function filterAndSort<T extends Record<string, any>>(
  items: T[],
  opts: {
    search?: string;
    filter?: string;
    searchFields: FieldAccessor<T>[];
    filterField?: FieldAccessor<T>;
    sortField?: FieldAccessor<T>;
    sortDir?: "asc" | "desc";
  }
): T[] {
  let result = [...items];

  const q = (opts.search || "").trim().toLowerCase();
  if (q) {
    result = result.filter((item) =>
      opts.searchFields.some((f) => {
        const v = getValue(item, f);
        return String(v ?? "").toLowerCase().includes(q);
      })
    );
  }

  if (opts.filter && opts.filterField) {
    const fv = opts.filterField;
    result = result.filter((item) => {
      const v = getValue(item, fv);
      if (Array.isArray(v)) {
        return v.some((x) => String(x).toLowerCase() === String(opts.filter).toLowerCase());
      }
      return String(v ?? "").toLowerCase() === String(opts.filter).toLowerCase();
    });
  }

  if (opts.sortField) {
    const dir = opts.sortDir === "desc" ? -1 : 1;
    result.sort((a, b) => {
      const av = getValue(a, opts.sortField!);
      const bv = getValue(b, opts.sortField!);
      if (av == null && bv == null) return 0;
      if (av == null) return 1 * dir;
      if (bv == null) return -1 * dir;
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv), undefined, { numeric: true }) * dir;
    });
  }

  return result;
}

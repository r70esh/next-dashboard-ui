// Period rules:
//   Classes 1-3   -> 6 periods
//   Classes 4-10  -> 7 periods
//   Classes 11-12 -> 6 periods
//   Every period is 45 minutes.
export const PERIOD_DURATION_MINUTES = 45;

// Returns how many periods a given class has in a day.
export function getPeriodCountForClass(className: string): number {
  const c = parseInt(className, 10);
  if (isNaN(c)) return 7;
  if (c >= 1 && c <= 3) return 6;
  if (c >= 4 && c <= 10) return 7;
  if (c >= 11 && c <= 12) return 6;
  return 7;
}

// Returns ["1".."N"] for the given class.
export function getPeriodOptionsForClass(className: string): string[] {
  const count = getPeriodCountForClass(className);
  return Array.from({ length: count }, (_, i) => String(i + 1));
}

// School week: Sunday -> Friday (no Saturday).
export const WEEK_DAYS = [
  { value: "sunday", label: "Sunday" },
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
];

export const DAY_LABELS: Record<string, string> = Object.fromEntries(
  WEEK_DAYS.map((d) => [d.value, d.label])
);

// Default class-period times (45-minute periods, 20-minute break after period 2).
export const DEFAULT_PERIOD_TIMES: Record<number, { start: string; end: string }> = {
  1: { start: "10:10", end: "10:55" },
  2: { start: "10:55", end: "11:40" },
  3: { start: "12:00", end: "12:45" },
  4: { start: "12:45", end: "13:30" },
  5: { start: "13:30", end: "14:15" },
  6: { start: "14:15", end: "15:00" },
  7: { start: "15:00", end: "15:45" },
};

export const DEFAULT_BREAK_TIME = { start: "11:40", end: "12:00" };

// Builds the default timetable rows for a class. Each row is one slot on the
// grid (period number = position including the break row, so it sorts in the
// exact order the timetable renders). The break is inserted after period 2.
export function getDefaultScheduleRows(className: string) {
  const count = getPeriodCountForClass(className);
  const rows: Array<{
    period: number;
    type: string;
    startTime: string;
    endTime: string;
    subject: string;
    teacher: string;
    room: string;
    notes: string;
  }> = [];
  let position = 1;
  for (let p = 1; p <= count; p++) {
    if (p === 3) {
      rows.push({
        period: position++,
        type: "break",
        startTime: DEFAULT_BREAK_TIME.start,
        endTime: DEFAULT_BREAK_TIME.end,
        subject: "",
        teacher: "",
        room: "",
        notes: "Short break",
      });
    }
    const t = DEFAULT_PERIOD_TIMES[p] || DEFAULT_PERIOD_TIMES[1];
    rows.push({
      period: position++,
      type: "class",
      startTime: t.start,
      endTime: t.end,
      subject: "",
      teacher: "",
      room: "",
      notes: "",
    });
  }
  return rows;
}

// Renders human labels for every slot of a day, e.g.
//   { 1: "1st Period", 2: "2nd Period", 3: "Break", 4: "3rd Period", ... }
// The `period` field is the slot's row position (break included), so the class
// counter renumbers correctly after the break.
export function buildDayLabels(rows: Array<{ period: number; type?: string }>): Record<number, string> {
  const labels: Record<number, string> = {};
  let classCount = 0;
  for (const row of rows) {
    if (row.type === "class") {
      classCount++;
      labels[row.period] = ordinal(classCount);
    } else if (row.type === "break") {
      labels[row.period] = "Break";
    } else if (row.type === "lunch") {
      labels[row.period] = "Lunch Break";
    } else if (row.type === "assembly") {
      labels[row.period] = "Assembly";
    } else {
      labels[row.period] = "Other";
    }
  }
  return labels;
}

export function ordinal(period: number): string {
  const suffixes = ["th", "st", "nd", "rd", "th", "th", "th", "th", "th", "th"];
  const mod = period % 100;
  const suffix = mod >= 11 && mod <= 13 ? "th" : suffixes[period % 10] || "th";
  return `${period}${suffix} Period`;
}

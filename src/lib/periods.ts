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

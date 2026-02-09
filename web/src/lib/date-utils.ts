export function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function getMonday(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  return copy;
}

export function getMonthStart(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function getMonthEnd(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function getWeekStart(d: Date): string {
  return toDateStr(getMonday(d));
}

export function getWeekEnd(d: Date): string {
  return toDateStr(addDays(getMonday(d), 6));
}

export function getMonthStartStr(d: Date): string {
  return toDateStr(getMonthStart(d));
}

export function getMonthEndStr(d: Date): string {
  return toDateStr(getMonthEnd(d));
}

export function getYearStartStr(d: Date): string {
  return `${d.getFullYear()}-01-01`;
}

export function getYearEndStr(d: Date): string {
  return `${d.getFullYear()}-12-31`;
}

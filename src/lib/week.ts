// Utilidades de fecha para el plan semanal (semana de lunes a domingo).

/** Devuelve el lunes de la semana que contiene `date`, en formato YYYY-MM-DD. */
export function mondayOf(date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay(); // 0 = domingo
  const diff = day === 0 ? -6 : 1 - day; // retroceder al lunes
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

/** Suma `weeks` semanas a una fecha YYYY-MM-DD y devuelve el nuevo lunes. */
export function addWeeks(weekStart: string, weeks: number): string {
  const d = new Date(weekStart + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + weeks * 7);
  return d.toISOString().slice(0, 10);
}

/** Etiqueta legible del rango de la semana, p.ej. "9 – 15 jun". */
export function weekLabel(weekStart: string): string {
  const start = new Date(weekStart + "T00:00:00Z");
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("es-PE", { day: "numeric", month: "short", timeZone: "UTC" });
  return `${fmt(start)} – ${fmt(end)}`;
}

/** Zona horaria de la app (Perú). */
export const APP_TIMEZONE = "America/Lima";

/** Fecha de hoy en Lima, formato YYYY-MM-DD. */
export function todayISO(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: APP_TIMEZONE }).format(now);
}

/** Suma días a una fecha YYYY-MM-DD. */
export function addDays(date: string, days: number): string {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Día de la semana con lunes = 0 para una fecha YYYY-MM-DD. */
export function dayIndexMondayFirst(date: string): number {
  const day = new Date(date + "T00:00:00Z").getUTCDay(); // 0 = domingo
  return (day + 6) % 7;
}

/** Etiqueta corta de una fecha, p.ej. "lun 23 nov". */
export function dayLabel(date: string): string {
  return new Date(date + "T00:00:00Z").toLocaleDateString("es-PE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/** True si el texto es una fecha YYYY-MM-DD válida. */
export function isISODate(s: unknown): s is string {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
}

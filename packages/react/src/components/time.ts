/**
 * Fixed locale and time zone on purpose: a date formatted with the visitor's locale renders
 * differently on the server than in the browser, which React reports as a hydration mismatch.
 */
const FORMATTER = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

export function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : FORMATTER.format(date);
}

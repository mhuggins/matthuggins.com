export function formatDate(str: string) {
  const date = new Date(str);

  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  return str;
}

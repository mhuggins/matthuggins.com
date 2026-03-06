const defaultTimeZone = "America/Chicago";

export function formatDate(str: string, timeZone = defaultTimeZone) {
  const tzOffset = getTimeZoneOffset(timeZone);
  const date = new Date(formatDateString(str, tzOffset));

  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone,
    });
  }

  return str;
}

function getTimeZoneOffset(timeZone: string): string {
  const str = new Date().toLocaleString("en", { timeZone, timeZoneName: "longOffset" });
  const [, h, m] = str.match(/([+-]\d+):(\d+)$/) || [, "+00", "00"];
  return `${h}:${m}`;
}

function formatDateString(str: string, timeZoneOffset: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return `${str}T00:00:00${timeZoneOffset}`;
  }
  return str;
}

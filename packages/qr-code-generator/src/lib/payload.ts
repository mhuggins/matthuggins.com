import assertNever from "assert-never";
import type { Payload } from "../types";

/**
 * Wi-Fi and vCard payloads are field-delimited formats, so any delimiter that
 * appears inside a value has to be escaped or the reader mis-parses the record.
 * The two specs disagree on which characters are special, hence two patterns.
 */
const WIFI_ESCAPE = /([\\;,:"])/g;
const VCARD_ESCAPE = /([\\;,])/g;

/**
 * Turn a structured payload into the string that actually gets encoded.
 * Returns an empty string when the payload has nothing meaningful in it yet,
 * which the caller treats as "nothing to render".
 */
export function buildPayload(payload: Payload): string {
  switch (payload.kind) {
    case "url":
      return normalizeUrl(payload.url);
    case "text":
      return payload.text.trim();
    case "wifi":
      return buildWifi(payload);
    case "email":
      return buildEmail(payload);
    case "sms":
      return buildSms(payload);
    case "phone":
      return payload.number.trim() ? `tel:${normalizePhone(payload.number)}` : "";
    case "vcard":
      return buildVCard(payload);
    default:
      return assertNever(payload);
  }
}

/**
 * Accept what people actually type ("matthuggins.com") and encode something a
 * phone camera can open. Anything that already carries a scheme is left alone.
 */
export function normalizeUrl(input: string): string {
  const url = input.trim();
  if (!url) {
    return "";
  }
  return /^[a-z][a-z0-9+.-]*:/i.test(url) ? url : `https://${url}`;
}

/** Strip the formatting characters people type into phone fields. */
function normalizePhone(input: string): string {
  return input.trim().replace(/[^\d+]/g, "");
}

function escapeWifi(value: string): string {
  return value.replace(WIFI_ESCAPE, "\\$1");
}

function escapeVCard(value: string): string {
  return value.replace(VCARD_ESCAPE, "\\$1").replace(/\r?\n/g, "\\n");
}

function buildWifi(payload: Extract<Payload, { kind: "wifi" }>): string {
  const ssid = payload.ssid.trim();
  if (!ssid) {
    return "";
  }

  const fields = [`T:${payload.encryption}`, `S:${escapeWifi(ssid)}`];
  if (payload.encryption !== "nopass" && payload.password) {
    fields.push(`P:${escapeWifi(payload.password)}`);
  }
  if (payload.hidden) {
    fields.push("H:true");
  }

  return `WIFI:${fields.join(";")};;`;
}

function buildEmail(payload: Extract<Payload, { kind: "email" }>): string {
  const to = payload.to.trim();
  if (!to) {
    return "";
  }

  const params = new URLSearchParams();
  if (payload.subject.trim()) {
    params.set("subject", payload.subject.trim());
  }
  if (payload.body.trim()) {
    params.set("body", payload.body.trim());
  }

  // URLSearchParams encodes spaces as "+", which mail clients render literally.
  const query = params.toString().replace(/\+/g, "%20");
  return query ? `mailto:${to}?${query}` : `mailto:${to}`;
}

function buildSms(payload: Extract<Payload, { kind: "sms" }>): string {
  const number = normalizePhone(payload.number);
  if (!number) {
    return "";
  }
  // SMSTO is the convention QR readers recognize, unlike the RFC `sms:` scheme.
  return payload.message.trim() ? `SMSTO:${number}:${payload.message.trim()}` : `SMSTO:${number}`;
}

function buildVCard(payload: Extract<Payload, { kind: "vcard" }>): string {
  const firstName = payload.firstName.trim();
  const lastName = payload.lastName.trim();
  const organization = payload.organization.trim();
  const fullName = [firstName, lastName].filter(Boolean).join(" ");

  if (!fullName && !organization) {
    return "";
  }

  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${escapeVCard(lastName)};${escapeVCard(firstName)};;;`,
  ];

  if (fullName) {
    lines.push(`FN:${escapeVCard(fullName)}`);
  }
  if (organization) {
    lines.push(`ORG:${escapeVCard(organization)}`);
  }
  if (payload.title.trim()) {
    lines.push(`TITLE:${escapeVCard(payload.title.trim())}`);
  }
  if (payload.phone.trim()) {
    lines.push(`TEL;TYPE=CELL:${normalizePhone(payload.phone)}`);
  }
  if (payload.email.trim()) {
    lines.push(`EMAIL:${payload.email.trim()}`);
  }
  if (payload.url.trim()) {
    lines.push(`URL:${normalizeUrl(payload.url)}`);
  }

  lines.push("END:VCARD");
  return lines.join("\n");
}

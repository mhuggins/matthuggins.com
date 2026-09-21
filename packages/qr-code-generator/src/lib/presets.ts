import type { Design, EyeStyle, FrameStyle, ModuleStyle, PayloadKind, PayloadMap } from "../types";
import { NO_LOGO } from "./logos";

export interface Palette {
  id: string;
  label: string;
  foreground: string;
  background: string;
  eyeColor: string;
  frameColor: string;
}

/**
 * Each palette sets every color at once, including the eye and frame colors,
 * so a single click always produces a coherent code rather than a half-themed one.
 */
export const PALETTES: readonly Palette[] = [
  {
    id: "classic",
    label: "Classic",
    foreground: "#111827",
    background: "#ffffff",
    eyeColor: "#111827",
    frameColor: "#111827",
  },
  {
    id: "teal",
    label: "Teal",
    foreground: "#1a454f",
    background: "#ffffff",
    eyeColor: "#358799",
    frameColor: "#358799",
  },
  {
    id: "indigo",
    label: "Indigo",
    foreground: "#312e81",
    background: "#eef2ff",
    eyeColor: "#4f46e5",
    frameColor: "#4f46e5",
  },
  {
    id: "forest",
    label: "Forest",
    foreground: "#14532d",
    background: "#f0fdf4",
    eyeColor: "#16a34a",
    frameColor: "#166534",
  },
  {
    id: "sunset",
    label: "Sunset",
    foreground: "#7c2d12",
    background: "#fff7ed",
    eyeColor: "#ea580c",
    frameColor: "#ea580c",
  },
  {
    id: "berry",
    label: "Berry",
    foreground: "#701a75",
    background: "#fdf4ff",
    eyeColor: "#c026d3",
    frameColor: "#a21caf",
  },
  {
    id: "midnight",
    label: "Midnight",
    foreground: "#e2e8f0",
    background: "#0f172a",
    eyeColor: "#38bdf8",
    frameColor: "#38bdf8",
  },
];

export const MODULE_STYLES: readonly { id: ModuleStyle; label: string }[] = [
  { id: "square", label: "Square" },
  { id: "rounded", label: "Rounded" },
  { id: "dots", label: "Dots" },
];

export const EYE_STYLES: readonly { id: EyeStyle; label: string }[] = [
  { id: "square", label: "Square" },
  { id: "rounded", label: "Rounded" },
  { id: "circle", label: "Circle" },
  { id: "leaf", label: "Leaf" },
];

export const FRAME_STYLES: readonly { id: FrameStyle; label: string }[] = [
  { id: "none", label: "None" },
  { id: "border", label: "Border" },
  { id: "label-below", label: "Caption" },
  { id: "label-above", label: "Header" },
  { id: "ticket", label: "Ticket" },
];

export const PAYLOAD_KINDS: readonly { id: PayloadKind; label: string }[] = [
  { id: "url", label: "URL" },
  { id: "text", label: "Text" },
  { id: "wifi", label: "Wi-Fi" },
  { id: "email", label: "Email" },
  { id: "sms", label: "SMS" },
  { id: "phone", label: "Phone" },
  { id: "vcard", label: "Contact" },
];

/** Ready-made captions, so the common cases are one click rather than typing. */
export const LABEL_SUGGESTIONS = ["SCAN ME", "DOWNLOAD", "MENU", "JOIN WI-FI", "GET TICKETS"];

export const MIN_LOGO_RATIO = 0.12;
export const MAX_LOGO_RATIO = 0.3;

export const DEFAULT_DESIGN: Design = {
  foreground: "#111827",
  background: "#ffffff",
  eyeColor: null,
  moduleStyle: "rounded",
  eyeStyle: "rounded",
  frame: "label-below",
  frameColor: "#358799",
  label: "SCAN ME",
  logoId: NO_LOGO,
  customLogo: null,
  logoRatio: 0.2,
  errorCorrection: "M",
};

export const DEFAULT_PAYLOADS: PayloadMap = {
  url: { kind: "url", url: "https://matthuggins.com" },
  text: { kind: "text", text: "" },
  wifi: { kind: "wifi", ssid: "", password: "", encryption: "WPA", hidden: false },
  email: { kind: "email", to: "", subject: "", body: "" },
  sms: { kind: "sms", number: "", message: "" },
  phone: { kind: "phone", number: "" },
  vcard: {
    kind: "vcard",
    firstName: "",
    lastName: "",
    organization: "",
    title: "",
    phone: "",
    email: "",
    url: "",
  },
};

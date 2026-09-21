export type PayloadKind = "url" | "text" | "wifi" | "email" | "sms" | "phone" | "vcard";

export type ModuleStyle = "square" | "rounded" | "dots";

export type EyeStyle = "square" | "rounded" | "circle" | "leaf";

export type FrameStyle = "none" | "border" | "label-below" | "label-above" | "ticket";

export type ErrorCorrection = "L" | "M" | "Q" | "H";

export interface UrlPayload {
  kind: "url";
  url: string;
}

export interface TextPayload {
  kind: "text";
  text: string;
}

export interface WifiPayload {
  kind: "wifi";
  ssid: string;
  password: string;
  encryption: "WPA" | "WEP" | "nopass";
  hidden: boolean;
}

export interface EmailPayload {
  kind: "email";
  to: string;
  subject: string;
  body: string;
}

export interface SmsPayload {
  kind: "sms";
  number: string;
  message: string;
}

export interface PhonePayload {
  kind: "phone";
  number: string;
}

export interface VCardPayload {
  kind: "vcard";
  firstName: string;
  lastName: string;
  organization: string;
  title: string;
  phone: string;
  email: string;
  url: string;
}

export type Payload =
  | UrlPayload
  | TextPayload
  | WifiPayload
  | EmailPayload
  | SmsPayload
  | PhonePayload
  | VCardPayload;

/** Every payload variant, keyed by kind, so switching tabs preserves each form. */
export type PayloadMap = { [P in Payload as P["kind"]]: P };

export interface Design {
  foreground: string;
  background: string;
  /** `null` keeps the finder patterns in sync with `foreground`. */
  eyeColor: string | null;
  moduleStyle: ModuleStyle;
  eyeStyle: EyeStyle;
  frame: FrameStyle;
  frameColor: string;
  label: string;
  /** Id from `LOGO_OPTIONS`, `"custom"` for an uploaded image, or `"none"`. */
  logoId: string;
  /** Data URL for the uploaded image, kept separate so switching icons is lossless. */
  customLogo: string | null;
  /** Share of the QR symbol's width covered by the logo plate. */
  logoRatio: number;
  errorCorrection: ErrorCorrection;
}

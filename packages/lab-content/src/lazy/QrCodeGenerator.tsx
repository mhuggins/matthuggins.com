import { lazy } from "react";

export const QrCodeGenerator = lazy(async () => ({
  default: (await import("@matthuggins/qr-code-generator")).QrCodeGenerator,
}));

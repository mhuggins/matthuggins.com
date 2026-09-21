import { describe, expect, it } from "vitest";
import { buildPayload, normalizeUrl } from "../payload";

describe("normalizeUrl", () => {
  it("adds https to a bare host", () => {
    expect(normalizeUrl("matthuggins.com")).toBe("https://matthuggins.com");
  });

  it("leaves an existing scheme alone", () => {
    expect(normalizeUrl("http://example.com")).toBe("http://example.com");
    expect(normalizeUrl("mailto:hi@example.com")).toBe("mailto:hi@example.com");
  });

  it("returns an empty string for blank input", () => {
    expect(normalizeUrl("   ")).toBe("");
  });
});

describe("buildPayload", () => {
  it("encodes a Wi-Fi network", () => {
    expect(
      buildPayload({
        kind: "wifi",
        ssid: "Guest",
        password: "hunter2",
        encryption: "WPA",
        hidden: false,
      }),
    ).toBe("WIFI:T:WPA;S:Guest;P:hunter2;;");
  });

  it("escapes Wi-Fi delimiters inside values", () => {
    expect(
      buildPayload({
        kind: "wifi",
        ssid: "Matt; Home",
        password: 'a:b"c',
        encryption: "WPA",
        hidden: true,
      }),
    ).toBe('WIFI:T:WPA;S:Matt\\; Home;P:a\\:b\\"c;H:true;;');
  });

  it("omits the password for an open network", () => {
    expect(
      buildPayload({
        kind: "wifi",
        ssid: "Cafe",
        password: "ignored",
        encryption: "nopass",
        hidden: false,
      }),
    ).toBe("WIFI:T:nopass;S:Cafe;;");
  });

  it("percent-encodes spaces in mailto parameters", () => {
    const result = buildPayload({
      kind: "email",
      to: "hi@example.com",
      subject: "Hello there",
      body: "",
    });
    expect(result).toBe("mailto:hi@example.com?subject=Hello%20there");
  });

  it("strips formatting from phone numbers", () => {
    expect(buildPayload({ kind: "phone", number: "+1 (555) 010-1234" })).toBe("tel:+15550101234");
    expect(buildPayload({ kind: "sms", number: "555.010.1234", message: "yo" })).toBe(
      "SMSTO:5550101234:yo",
    );
  });

  it("builds a vCard and skips blank fields", () => {
    const result = buildPayload({
      kind: "vcard",
      firstName: "Matt",
      lastName: "Huggins",
      organization: "",
      title: "",
      phone: "",
      email: "matt@example.com",
      url: "matthuggins.com",
    });

    expect(result).toBe(
      [
        "BEGIN:VCARD",
        "VERSION:3.0",
        "N:Huggins;Matt;;;",
        "FN:Matt Huggins",
        "EMAIL:matt@example.com",
        "URL:https://matthuggins.com",
        "END:VCARD",
      ].join("\n"),
    );
  });

  it("returns an empty string when a payload has nothing to encode", () => {
    expect(buildPayload({ kind: "url", url: "" })).toBe("");
    expect(
      buildPayload({ kind: "wifi", ssid: "", password: "", encryption: "WPA", hidden: false }),
    ).toBe("");
    expect(
      buildPayload({
        kind: "vcard",
        firstName: "",
        lastName: "",
        organization: "",
        title: "",
        phone: "",
        email: "",
        url: "",
      }),
    ).toBe("");
  });
});

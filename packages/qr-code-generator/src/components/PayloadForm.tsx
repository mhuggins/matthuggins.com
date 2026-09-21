import assertNever from "assert-never";
import type { Payload } from "../types";
import { Field } from "./Field";
import { Select, TextArea, TextInput } from "./TextInput";

export interface PayloadFormProps {
  payload: Payload;
  onChange: (payload: Payload) => void;
}

/** The fields for whichever payload type is selected. */
export function PayloadForm({ payload, onChange }: PayloadFormProps) {
  switch (payload.kind) {
    case "url":
      return (
        <Field label="Destination" hint="The scheme is filled in for you if you leave it off.">
          {(id) => (
            <TextInput
              id={id}
              type="url"
              inputMode="url"
              placeholder="matthuggins.com"
              value={payload.url}
              onChange={(event) => onChange({ ...payload, url: event.target.value })}
            />
          )}
        </Field>
      );

    case "text":
      return (
        <Field label="Text">
          {(id) => (
            <TextArea
              id={id}
              rows={4}
              placeholder="Anything you want the scan to show"
              value={payload.text}
              onChange={(event) => onChange({ ...payload, text: event.target.value })}
            />
          )}
        </Field>
      );

    case "wifi":
      return (
        <div className="flex flex-col gap-3">
          <Field label="Network name (SSID)">
            {(id) => (
              <TextInput
                id={id}
                placeholder="Guest Wi-Fi"
                value={payload.ssid}
                onChange={(event) => onChange({ ...payload, ssid: event.target.value })}
              />
            )}
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Security">
              {(id) => (
                <Select
                  id={id}
                  value={payload.encryption}
                  onChange={(event) =>
                    onChange({
                      ...payload,
                      encryption: event.target.value as typeof payload.encryption,
                    })
                  }
                >
                  <option value="WPA">WPA / WPA2 / WPA3</option>
                  <option value="WEP">WEP</option>
                  <option value="nopass">Open (no password)</option>
                </Select>
              )}
            </Field>
            <Field label="Password">
              {(id) => (
                <TextInput
                  id={id}
                  disabled={payload.encryption === "nopass"}
                  placeholder={payload.encryption === "nopass" ? "Not required" : "••••••••"}
                  value={payload.password}
                  onChange={(event) => onChange({ ...payload, password: event.target.value })}
                />
              )}
            </Field>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-gray-600 text-sm dark:text-gray-300">
            <input
              type="checkbox"
              checked={payload.hidden}
              onChange={(event) => onChange({ ...payload, hidden: event.target.checked })}
              className="size-4 cursor-pointer accent-primary"
            />
            This network is hidden
          </label>
        </div>
      );

    case "email":
      return (
        <div className="flex flex-col gap-3">
          <Field label="Send to">
            {(id) => (
              <TextInput
                id={id}
                type="email"
                inputMode="email"
                placeholder="hello@example.com"
                value={payload.to}
                onChange={(event) => onChange({ ...payload, to: event.target.value })}
              />
            )}
          </Field>
          <Field label="Subject">
            {(id) => (
              <TextInput
                id={id}
                placeholder="Optional"
                value={payload.subject}
                onChange={(event) => onChange({ ...payload, subject: event.target.value })}
              />
            )}
          </Field>
          <Field label="Message">
            {(id) => (
              <TextArea
                id={id}
                rows={3}
                placeholder="Optional"
                value={payload.body}
                onChange={(event) => onChange({ ...payload, body: event.target.value })}
              />
            )}
          </Field>
        </div>
      );

    case "sms":
      return (
        <div className="flex flex-col gap-3">
          <Field label="Phone number">
            {(id) => (
              <TextInput
                id={id}
                type="tel"
                inputMode="tel"
                placeholder="+1 555 010 1234"
                value={payload.number}
                onChange={(event) => onChange({ ...payload, number: event.target.value })}
              />
            )}
          </Field>
          <Field label="Message">
            {(id) => (
              <TextArea
                id={id}
                rows={3}
                placeholder="Optional pre-filled message"
                value={payload.message}
                onChange={(event) => onChange({ ...payload, message: event.target.value })}
              />
            )}
          </Field>
        </div>
      );

    case "phone":
      return (
        <Field label="Phone number" hint="Scanning opens the dialer with this number ready.">
          {(id) => (
            <TextInput
              id={id}
              type="tel"
              inputMode="tel"
              placeholder="+1 555 010 1234"
              value={payload.number}
              onChange={(event) => onChange({ ...payload, number: event.target.value })}
            />
          )}
        </Field>
      );

    case "vcard":
      return (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="First name">
              {(id) => (
                <TextInput
                  id={id}
                  value={payload.firstName}
                  onChange={(event) => onChange({ ...payload, firstName: event.target.value })}
                />
              )}
            </Field>
            <Field label="Last name">
              {(id) => (
                <TextInput
                  id={id}
                  value={payload.lastName}
                  onChange={(event) => onChange({ ...payload, lastName: event.target.value })}
                />
              )}
            </Field>
            <Field label="Company">
              {(id) => (
                <TextInput
                  id={id}
                  value={payload.organization}
                  onChange={(event) => onChange({ ...payload, organization: event.target.value })}
                />
              )}
            </Field>
            <Field label="Job title">
              {(id) => (
                <TextInput
                  id={id}
                  value={payload.title}
                  onChange={(event) => onChange({ ...payload, title: event.target.value })}
                />
              )}
            </Field>
            <Field label="Phone">
              {(id) => (
                <TextInput
                  id={id}
                  type="tel"
                  inputMode="tel"
                  value={payload.phone}
                  onChange={(event) => onChange({ ...payload, phone: event.target.value })}
                />
              )}
            </Field>
            <Field label="Email">
              {(id) => (
                <TextInput
                  id={id}
                  type="email"
                  inputMode="email"
                  value={payload.email}
                  onChange={(event) => onChange({ ...payload, email: event.target.value })}
                />
              )}
            </Field>
          </div>
          <Field label="Website">
            {(id) => (
              <TextInput
                id={id}
                placeholder="matthuggins.com"
                value={payload.url}
                onChange={(event) => onChange({ ...payload, url: event.target.value })}
              />
            )}
          </Field>
        </div>
      );

    default:
      return assertNever(payload);
  }
}

import { withForm } from "@matthuggins/form";
import { cn, InfoTooltip } from "@matthuggins/ui";
import { KeyIcon, ShieldCheckIcon, XIcon } from "@phosphor-icons/react";
import { AGENT_MODELS } from "../lib/agent";
import { DEFAULT_CONFIG } from "../lib/config";

/** The API-key + model fields, bound to the shared config form. Renders only the
 * fields row; the enclosing config panel provides the surface and padding. */
export const ApiKeyFields = withForm({
  defaultValues: DEFAULT_CONFIG,
  props: {
    className: undefined as string | undefined,
  },
  render: ({ form, className }) => (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-end", className)}>
      <form.AppField name="model">
        {(field) => (
          <field.SelectField label="Model">
            {AGENT_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </field.SelectField>
        )}
      </form.AppField>

      <form.AppField name="apiKey">
        {(field) => (
          <form.Subscribe selector={(state) => state.values.apiKey.length > 0}>
            {(hasKey) => (
              <field.TextField
                type="password"
                label={
                  <div className="flex items-center gap-2">
                    <span>API key</span>
                    <InfoTooltip icon={ShieldCheckIcon}>
                      Your key stays in this browser tab (kept in <code>sessionStorage</code> only)
                      and is sent directly to Anthropic only.
                    </InfoTooltip>
                  </div>
                }
                iconBefore={<KeyIcon weight="bold" className="size-4" />}
                iconAfter={
                  hasKey ? (
                    <form.IconButton
                      icon={XIcon}
                      intent="inline"
                      className="cursor-pointer"
                      onClick={() => field.handleChange("")}
                    />
                  ) : null
                }
                placeholder="sk-ant-..."
                autoComplete="off"
                spellCheck={false}
                className="flex-1"
                inputClassName="font-mono"
              />
            )}
          </form.Subscribe>
        )}
      </form.AppField>
    </div>
  ),
});

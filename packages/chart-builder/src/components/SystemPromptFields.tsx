import { withForm } from "@matthuggins/form";
import { Button, InfoTooltip } from "@matthuggins/ui";
import { ArrowCounterClockwiseIcon } from "@phosphor-icons/react";
import { DEFAULT_SYSTEM_PROMPT } from "../constants/systemPrompt";
import { DEFAULT_CONFIG } from "../lib/config";
import { Collapsible } from "./Collapsible";

/** The editable system-prompt body, bound to the shared config form. The title
 * lives on the enclosing Collapsible, so this renders only the help text,
 * a Reset action, and the textarea. */
export const SystemPromptFields = withForm({
  defaultValues: DEFAULT_CONFIG,
  props: { disabled: false },
  render: ({ form, disabled }) => (
    <Collapsible
      title={
        <div className="flex w-full items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            System prompt
            <InfoTooltip>
              This text is sent as the agent's <code>system</code> prompt. Edit it and watch
              behavior change: forbid pie charts, change the voice, or drop the "call
              geocodeLocation first" rule.
            </InfoTooltip>
          </div>
          <form.Subscribe selector={(state) => state.values.systemPrompt === DEFAULT_SYSTEM_PROMPT}>
            {(isDefault) =>
              isDefault ? null : (
                <Button
                  intent="secondary"
                  size="xs"
                  disabled={disabled}
                  icon={ArrowCounterClockwiseIcon}
                  className="shrink-0"
                  onClick={(event) => {
                    event.stopPropagation();
                    form.setFieldValue("systemPrompt", DEFAULT_SYSTEM_PROMPT);
                  }}
                >
                  Reset
                </Button>
              )
            }
          </form.Subscribe>
        </div>
      }
    >
      <form.AppField name="systemPrompt">
        {(field) => (
          <field.TextAreaField
            rows={14}
            spellCheck={false}
            disabled={disabled}
            inputClassName="resize-y font-mono text-xs leading-relaxed"
          />
        )}
      </form.AppField>
    </Collapsible>
  ),
});

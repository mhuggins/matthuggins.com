import {
  cn,
  IconButton as UiIconButton,
  type IconButtonProps as UiIconButtonProps,
} from "@matthuggins/ui";
import { SpinnerIcon } from "@phosphor-icons/react";
import type { Except, SetRequired } from "type-fest";
import { useFormContext } from "../../hooks/useForm";

export type IconButtonProps = Except<SetRequired<UiIconButtonProps, "icon">, "children">;

export function IconButton({ type, disabled, icon, className, ...props }: IconButtonProps) {
  const form = useFormContext();

  return (
    <form.Subscribe selector={(state) => state.isValidating || state.isSubmitting}>
      {(isFormProcessing) => {
        const showSpinner = isFormProcessing && type === "submit";

        return (
          <UiIconButton
            {...props}
            type={type}
            icon={showSpinner ? SpinnerIcon : icon}
            disabled={isFormProcessing || disabled}
            className={cn(showSpinner && "animate-spin", className)}
          />
        );
      }}
    </form.Subscribe>
  );
}

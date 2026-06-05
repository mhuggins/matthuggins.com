import { Button as UiButton, type ButtonProps as UiButtonProps } from "@matthuggins/ui";
import { useFormContext } from "../../hooks/useForm";

export type ButtonProps = UiButtonProps;

export function Button({ disabled, type = "button", children, ...props }: ButtonProps) {
  const form = useFormContext();

  return (
    <form.Subscribe selector={(state) => state.isValidating || state.isSubmitting}>
      {(isFormProcessing) => (
        <UiButton {...props} type={type} disabled={isFormProcessing || disabled}>
          {children}
        </UiButton>
      )}
    </form.Subscribe>
  );
}

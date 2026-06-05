import { Button, type ButtonProps, Processing } from "@matthuggins/ui";
import { Except } from "type-fest";
import { useFormContext } from "../../hooks/useForm";

export type SubmitButtonProps = Except<ButtonProps, "type">;

export function SubmitButton({
  disabled,
  intent = "primary",
  children,
  icon,
  ...props
}: SubmitButtonProps) {
  const form = useFormContext();

  return (
    <form.Subscribe selector={(state) => state.isValidating || state.isSubmitting}>
      {(isFormProcessing) => (
        <Button
          {...props}
          type="submit"
          intent={intent}
          icon={isFormProcessing ? undefined : icon}
          disabled={isFormProcessing || disabled}
        >
          {isFormProcessing ? (
            <span className="inline-flex items-center gap-3">
              <Processing />
              {children}
            </span>
          ) : (
            children
          )}
        </Button>
      )}
    </form.Subscribe>
  );
}

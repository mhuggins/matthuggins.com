import { ReactNode } from "react";
import type { Simplify } from "type-fest";
import { useFieldContext } from "../../hooks/useForm";
import { getFieldErrorMessage } from "../../utils/get-field-error-message";
import { FieldError } from "../FieldError";
import { FieldLabel } from "../FieldLabel";

export type CustomFieldProps = Simplify<{
  label?: ReactNode;
  children: ReactNode;
}>;

export const CustomField = ({ label, children }: CustomFieldProps) => {
  const field = useFieldContext<string>();
  const error = getFieldErrorMessage(field.state.meta);

  return (
    <div className="flex flex-col gap-2">
      {label && <FieldLabel htmlFor={field.name}>{label}</FieldLabel>}
      {children}
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
};

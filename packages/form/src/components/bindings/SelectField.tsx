import { cn } from "@matthuggins/ui";
import { forwardRef, type ReactNode } from "react";
import type { Except, Simplify } from "type-fest";
import { useFieldContext } from "../../hooks/useForm";
import { getFieldErrorMessage } from "../../utils/get-field-error-message";
import { FieldError } from "../FieldError";
import { FieldLabel } from "../FieldLabel";
import { Select, type SelectProps } from "../inputs/Select";

export type SelectFieldProps = Simplify<
  Except<SelectProps, "id" | "name" | "value"> & {
    label?: ReactNode;
    inputClassName?: string;
  }
>;

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, onBlur, onChange, className, inputClassName, children, ...props }, ref) => {
    const field = useFieldContext<string>();
    const error = getFieldErrorMessage(field.state.meta);

    return (
      <div className={cn("flex flex-col gap-2", className)}>
        {label && <FieldLabel htmlFor={field.name}>{label}</FieldLabel>}
        <Select
          ref={ref}
          {...props}
          id={field.name}
          name={field.name}
          value={field.state.value}
          hasError={!!error}
          onBlur={(event) => {
            onBlur?.(event);
            field.handleBlur();
          }}
          onChange={(event) => {
            onChange?.(event);
            field.handleChange(event.target.value);
          }}
          className={inputClassName}
        >
          {children}
        </Select>
        {error && <FieldError>{error}</FieldError>}
      </div>
    );
  },
);

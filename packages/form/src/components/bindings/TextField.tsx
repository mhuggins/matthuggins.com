import { cn } from "@matthuggins/ui";
import { forwardRef, ReactNode } from "react";
import type { Except, Simplify } from "type-fest";
import { useFieldContext } from "../../hooks/useForm";
import { getFieldErrorMessage } from "../../utils/get-field-error-message";
import { FieldError } from "../FieldError";
import { FieldLabel } from "../FieldLabel";
import { Input, type InputProps } from "../inputs/Input";

export type TextFieldProps = Simplify<
  Except<InputProps, "id" | "name" | "type" | "value"> & {
    label?: ReactNode;
    type?: "text" | "email" | "password" | "search" | "url";
    inputClassName?: string;
  }
>;

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, onBlur, onChange, className, inputClassName, ...props }, ref) => {
    const field = useFieldContext<string>();
    const error = getFieldErrorMessage(field.state.meta);

    return (
      <div className={cn("flex flex-col gap-2", className)}>
        {label && <FieldLabel htmlFor={field.name}>{label}</FieldLabel>}
        <Input
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
        />
        {error && <FieldError>{error}</FieldError>}
      </div>
    );
  },
);

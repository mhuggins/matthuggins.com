import type { AnyFieldMeta, StandardSchemaV1Issue } from "@tanstack/react-form";

export const getFieldErrorMessage = (fieldMeta: AnyFieldMeta) => {
  if (fieldMeta.isValid) {
    return undefined;
  }

  // We can safely cast to `StandardSchemaV1Issue[]` here due to the explicit
  // typing on the `validators` object in our wrapped `useForm` hook.
  return (fieldMeta.errors as StandardSchemaV1Issue[])
    .map((err) => err?.message)
    .filter(Boolean)
    .join(", ");
};

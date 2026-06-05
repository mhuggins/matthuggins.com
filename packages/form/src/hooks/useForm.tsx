/** biome-ignore-all lint/suspicious/noExplicitAny: needed for common form types */
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { Button } from "../components/bindings/Button";
import { CustomField } from "../components/bindings/CustomField";
import { IconButton } from "../components/bindings/IconButton";
import { SelectField } from "../components/bindings/SelectField";
import { SubmitButton } from "../components/bindings/SubmitButton";
import { TextAreaField } from "../components/bindings/TextAreaField";
import { TextField } from "../components/bindings/TextField";

const fieldComponents = {
  CustomField,
  TextAreaField,
  TextField,
  SelectField,
} as const;

const formComponents = {
  Button,
  IconButton,
  SubmitButton,
} as const;

export const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts();

const { withFieldGroup, withForm, useAppForm, useTypedAppFormContext } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents,
  formComponents,
});

export { useAppForm as useForm, withFieldGroup, withForm, useTypedAppFormContext };

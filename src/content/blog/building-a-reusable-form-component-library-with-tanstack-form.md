---
title: Building a Reusable Form Component Library with TanStack Form
date: 2025-12-18
published: true
tags: [react, typescript, form management]
summary: After years of working with react-hook-form, I made the switch to TanStack Form and built a reusable component library around it on top of my company's existing form components. Here are the patterns I landed on for binding these components to form state, creating intelligent buttons with automated loading states, and lazy-loading fields for better performance.
---

For years, [react-hook-form](https://react-hook-form.com/) was my go-to for form state management. It worked well enough, but I'd regularly hit friction points -- unexpected re-renders, confusing ref forwarding, and type gymnastics that left me wanting something better. When [TanStack Form](https://tanstack.com/form) came along, offering fine-grained control over form state, validation, and submission, I decided to give it a shot.

I set out to build a form system that would integrate with our existing form component and validation libraries, while offering type safety, handling repetitive boilerplate, and staying flexible enough for complex cases. Here's where I landed.

## TanStack Form Basics

Before diving into abstractions, let's look at what TanStack Form usage looks like. First, we need to create our form hook using `createFormHook` and `createFormHookContexts`:

```tsx
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";

const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts();

export const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {},
  formComponents: {},
});

export { fieldContext, formContext, useFieldContext, useFormContext };
```

The `useAppForm` hook returns a form object with methods for managing state, validation, and submission:

```tsx
import { useAppForm } from "@/hooks/useAppForm";

function LoginForm() {
  const form = useAppForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      await login(value.email, value.password);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      {/* fields go here */}
    </form>
  );
}
```

Fields are rendered using `form.Field`, which takes a `name` prop and a render function. The render function receives a `field` object containing the current value, validation state, and handlers:

```tsx
<form.Field name="email">
  {(field) => (
    <div>
      <label htmlFor={field.name}>Email</label>
      <input
        id={field.name}
        name={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
      />
      {field.state.meta.errors.length > 0 && (
        <span className="text-red-500">
          {field.state.meta.errors.join(", ")}
        </span>
      )}
    </div>
  )}
</form.Field>
```

This pattern is explicit and flexible, but you'll notice the boilerplate -- the label/input/error structure, the event handler wiring, and the error display logic -- adds up quickly. If you have dozens of forms with various field types, this becomes quite tedious.

The `useFieldContext` hook we exported earlier solves this by allowing field components to access their state and handlers without prop drilling. Let's put it to use.

## Defining a Consistent Form Field Layout

Looking at the field rendering above, most form fields share a common layout:

1. A field label,
2. The input component itself, and
3. Error messages caused by validation failures on that field.

Creating a `FieldWrapper` component that encapsulates this structure ensures visual consistency across all form fields and centralizes the layout logic:

```tsx
interface FieldWrapperProps {
  children: ReactNode;
  className?: string;
  id?: string;
  label?: ReactNode;
  error?: string;
  required?: boolean;
}

export const FieldWrapper: React.FC<FieldWrapperProps> = ({
  children,
  className,
  id,
  label,
  error,
  required = false,
}) => (
  <div className={classNames("flex flex-col gap-1", className)}>
    {label && (
      <label className="text-sm" htmlFor={id}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
    )}
    {children}
    {error && <span className="text-sm text-red-500">{error}</span>}
  </div>
);
```

Notice that the `label` prop is typed as `ReactNode` rather than `string`. This flexibility allows consumers to pass more than plain text -- for example, a label with a tooltip icon that provides additional context about the field's purpose:

```tsx
<form.Field name="apiKey">
  {(field) => (
    <FieldWrapper
      label={
        <span className="flex items-center gap-1">
          API Key
          <Tooltip content="Your unique identifier for API access">
            <InfoIcon className="size-4" />
          </Tooltip>
        </span>
      }
    >
      {/* input field */}
    </FieldWrapper>
  )}
</form.Field>
```

## Binding Inputs to Form Fields

With `FieldWrapper` and our contexts in place, we can create reusable field components that handle all the wiring internally. These "field binding" components use `useFieldContext` to access state and handlers, so consumers don't need to think about it.

Here's an `InputField` component that wraps a standard `input` element:

```tsx
import { forwardRef, type ReactNode } from "react";
import { AnyFieldMeta } from "@tanstack/react-form";
import { FieldWrapper } from "@/components/FieldWrapper";
import { useFieldContext } from "@/hooks/useAppForm";

// Utility to extract error messages from field metadata
const getFieldErrorMessage = (fieldMeta: AnyFieldMeta) => {
  if (fieldMeta.isValid) {
    return undefined;
  }
  return fieldMeta.errors
    .map((err) => err?.message)
    .filter(Boolean)
    .join(", ");
};

interface InputFieldProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "id" | "name" | "value"
> {
  label?: ReactNode;
  inputClassName?: string;
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ className, inputClassName, label, onBlur, onChange, ...props }, ref) => {
    const field = useFieldContext<string>();
    const error = getFieldErrorMessage(field.state.meta);

    return (
      <FieldWrapper
        id={field.name}
        label={label}
        error={error}
        required={props.required}
        className={className}
      >
        <input
          ref={ref}
          {...props}
          id={field.name}
          name={field.name}
          value={field.state.value ?? ""}
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
      </FieldWrapper>
    );
  },
);
```

A few points of note:

- **`useFieldContext<string>()`** gives us access to the field's current value, metadata (including validation errors), and handlers. The generic parameter specifies the field's value type.
- **Event handler composition**: We call both the consumer's handler (if provided) and TanStack Form's handler. This lets consumers add custom behavior without breaking form integration.
- **Error extraction**: The `getFieldErrorMessage` utility handles the common case of joining multiple validation errors into a single string. You'll want to adjust this based on your validation library's error format.

This same pattern can be applied to other input types (e.g.: `NumberField`, `SelectField`, `TextAreaField`, etc.). Each component utilizes `useFieldContext` with the appropriate value type, wiring up the relevant handlers.

To make this field available as an `AppField` on our forms, we can include it in the previously empty `fieldComponents` object that we passed to `createFormHook`:

```tsx
export const { useAppForm, withForm, withFieldGroup } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    CheckboxField,
    InputField,
    NumberField,
    PasswordField,
    SelectField,
    TextAreaField,
    // ... other field types
  },
  formComponents: {},
});
```

The form object returned by `useAppForm` now has an `AppField` component and your registered field components attached to it. Instead of importing the form field directly for use:

```tsx
import InputField from "@/components/bindings/InputField";

return (
  <form.Field name="email">
    {(field) => (
      <InputField label="Email" />
    )}
  </form.Field>
);
```

We can now reference it via the `field` object directly:

```tsx
return (
  <form.AppField name="email">
    {(field) => (
      <field.InputField label="Email" />
    )}
  </form.AppField>
);
```

## Creating Reusable Form Buttons

### Submit Button with Loading State

A common requirement is showing a loading or disabled state while the form is validating or submitting. Rather than managing this manually in every form, we can create a `SubmitButton` component that automatically reflects form state:

```tsx
import { useFormContext } from "@/hooks/useAppForm";
import type { ButtonHTMLAttributes } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface SubmitButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

export function SubmitButton({
  loading,
  disabled,
  children,
  className,
  ...props
}: SubmitButtonProps) {
  const form = useFormContext();

  return (
    <form.Subscribe
      selector={(state) => state.isValidating || state.isSubmitting}
    >
      {(isFormProcessing) => (
        <button
          type="submit"
          disabled={isFormProcessing || disabled}
          className={classNames("flex items-center gap-1", className)}
          {...props}
        >
          {(isFormProcessing || loading) && (
            <LoadingSpinner />
          )}
          {children}
        </button>
      )}
    </form.Subscribe>
  );
}
```

The `form.Subscribe` component selectively subscribes to specific pieces of form state, re-rendering only when those values change. Here we're watching `isValidating` and `isSubmitting` to determine if the form is currently processing.

The button merges this state data with explicitly passed `loading` and `disabled` props, allowing consumers to add additional conditions while still benefiting from the automatic behavior.

### Important: Using `mutateAsync` with TanStack Query

If you're using TanStack Query (React Query) for form submissions, there's a critical detail to be aware of: **always use `mutateAsync` rather than `mutate`** when calling mutations in your `onSubmit` handler.

```tsx
// Correct - form state accurately reflects submission progress
const form = useAppForm({
  defaultValues: { email: "" },
  onSubmit: async ({ value }) => {
    await subscribeToNewsletter.mutateAsync(value);
  },
});

// Incorrect - isSubmitting becomes false before mutation completes
const form = useAppForm({
  defaultValues: { email: "" },
  onSubmit: async ({ value }) => {
    subscribeToNewsletter.mutate(value); // Don't do this!
  },
});
```

The difference is that `mutate` fires and forgets -- your `onSubmit` function completes immediately while the mutation runs in the background. With `mutateAsync`, the promise doesn't resolve until the mutation completes, so TanStack Form correctly tracks the submission state.

### Extending Loading State to Other Buttons

The same pattern applies to other form buttons. For example, a cancel button that should be disabled during form submission:

```tsx
export function Button({ disabled, ...props }: ButtonProps) {
  const form = useFormContext();

  return (
    <form.Subscribe
      selector={(state) => state.isValidating || state.isSubmitting}
    >
      {(isFormProcessing) => (
        <button
          type="button"
          disabled={isFormProcessing || disabled}
          {...props}
        />
      )}
    </form.Subscribe>
  );
}
```

### Applying Loading State to Form Fields

You can extend this pattern to form fields as well. For example, making fields read-only during submission prevents users from modifying values while a submission is in flight:

```tsx
export function InputField({ readOnly, ...props }: InputFieldProps) {
  const field = useFieldContext<string>();
  const form = useFormContext();
  const error = getFieldErrorMessage(field.state.meta);

  return (
    <form.Subscribe
      selector={(state) => state.isValidating || state.isSubmitting}
    >
      {(isFormProcessing) => (
        <FieldWrapper
          id={field.name}
          label={props.label}
          error={error}
          required={props.required}
        >
          <input
            id={field.name}
            name={field.name}
            value={field.state.value ?? ""}
            onBlur={field.handleBlur}
            onChange={(e) => field.handleChange(e.target.value)}
            readOnly={isFormProcessing || readOnly}
            {...props}
          />
        </FieldWrapper>
      )}
    </form.Subscribe>
  );
}
```

### Registering and Using Button Components

Just like field components, button components need to be registered with `createFormHook` to be available on the form object. Add them to the `formComponents` map:

```tsx
import { Button } from "@/components/bindings/Button";
import { SubmitButton } from "@/components/bindings/SubmitButton";

export const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {},
  formComponents: {
    Button,
    SubmitButton,
  },
});
```

Once registered, you can access these buttons via `form.SubmitButton` and `form.Button`:

```tsx
function NewsletterForm() {
  const form = useAppForm({
    defaultValues: { email: "" },
    onSubmit: async ({ value }) => {
      await subscribe(value.email);
    },
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
      <form.AppField name="email">
        {(field) => (
          <field.InputField label="Email" type="email" required />
        )}
      </form.AppField>

      <div className="flex gap-2">
        <form.AppForm>
          <form.SubmitButton>Subscribe</form.SubmitButton>
          <form.Button onClick={onCancel}>Cancel</form.Button>
        </form.AppForm>
      </div>
    </form>
  );
}
```

Both buttons automatically disable during form submission, and the submit button shows its loading state -- no manual state management required.

## Creating a Custom `Form` Component

While `useAppForm` returns everything needed to build a form, you'll likely find yourself writing the same boilerplate repeatedly, such as preventing default form submission, and wrapping children in the form context provider. By building a custom `Form` component, we can provide sane defaults instead:

```tsx
import type {
  AppFieldExtendedReactFormApi,
  FormAsyncValidateOrFn,
  FormValidateOrFn,
} from "@tanstack/react-form";
import { type FormHTMLAttributes, type ReactNode, forwardRef } from "react";

interface FormProps<
  TFormData,
  TOnMount extends undefined | FormValidateOrFn<TFormData>,
  TOnChange extends undefined | FormValidateOrFn<TFormData>,
  TOnChangeAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  TOnBlur extends undefined | FormValidateOrFn<TFormData>,
  TOnBlurAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  TOnSubmit extends undefined | FormValidateOrFn<TFormData>,
  TOnSubmitAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  TOnDynamic extends undefined | FormValidateOrFn<TFormData>,
  TOnDynamicAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  TOnServer extends undefined | FormAsyncValidateOrFn<TFormData>,
  TSubmitMeta,
  TFieldComponents extends Record<string, ComponentType<any>>,
  TFormComponents extends Record<string, ComponentType<any>>,
> extends FormHTMLAttributes<HTMLFormElement> {
  form: AppFieldExtendedReactFormApi<
    TFormData,
    TOnMount,
    TOnChange,
    TOnChangeAsync,
    TOnBlur,
    TOnBlurAsync,
    TOnSubmit,
    TOnSubmitAsync,
    TOnDynamic,
    TOnDynamicAsync,
    TOnServer,
    TSubmitMeta,
    TFieldComponents,
    TFormComponents
  >;
}

const FormInner = forwardRef<HTMLFormElement, FormProps<any>>(
  ({ form, children, ...props }, ref) => (
    <form
      ref={ref}
      onSubmit={(event) => {
        event.preventDefault();
        return form.handleSubmit();
      }}
      {...props}
    >
      <form.AppForm>{children}</form.AppForm>
    </form>
  ),
);

export const Form = forwardRef(FormInner) as <
  TFormData,
  TOnMount extends undefined | FormValidateOrFn<TFormData>,
  TOnChange extends undefined | FormValidateOrFn<TFormData>,
  TOnChangeAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  TOnBlur extends undefined | FormValidateOrFn<TFormData>,
  TOnBlurAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  TOnSubmit extends undefined | FormValidateOrFn<TFormData>,
  TOnSubmitAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  TOnDynamic extends undefined | FormValidateOrFn<TFormData>,
  TOnDynamicAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  TOnServer extends undefined | FormAsyncValidateOrFn<TFormData>,
  TSubmitMeta,
  TFieldComponents extends Record<string, ComponentType<any>>,
  TFormComponents extends Record<string, ComponentType<any>>,
>(
  props: FormProps<
    TFormData,
    TOnMount,
    TOnChange,
    TOnChangeAsync,
    TOnBlur,
    TOnBlurAsync,
    TOnSubmit,
    TOnSubmitAsync,
    TOnDynamic,
    TOnDynamicAsync,
    TOnServer,
    TSubmitMeta,
    TFieldComponents,
    TFormComponents
  > & { ref?: ForwardedRef<HTMLFormElement> },
) => ReactNode;
```

This custom `Form` component provides several benefits:

1. **Default `onSubmit` handler**: Prevents the browser's default form submission behavior and calls TanStack Form's `handleSubmit` function. This is almost always what you want.

2. **Automatic context provision**: Wraps children in `form.AppForm`, ensuring the form context is always available to child components. Without this, you'd need to manually wrap children in every form where child components reference form context, as seen in the `Button` and `SubmitButton` usage example from earlier.

Usage becomes clean and declarative:

```tsx
function MyForm() {
  const form = useAppForm({
    defaultValues: { email: "", password: "" },
    onSubmit: async ({ value }) => {
      await submitToApi(value);
    },
  });

  return (
    <Form form={form}>
      <form.AppField name="email">
        {(field) => (
          <field.InputField label="Email" type="email" required />
        )}
      </form.AppField>

      <form.AppField name="password">
        {(field) => (
          <field.PasswordField label="Password" required />
        )}
      </form.AppField>

      <form.SubmitButton>Sign In</form.SubmitButton>
    </Form>
  );
}
```

## Lazy-Loading Form Fields

For larger applications with many form field types, lazy-loading can significantly improve initial bundle size. TanStack Form's `createFormHook` works seamlessly with React's lazy loading.

### Basic Setup

Wrap your field components with `React.lazy` before passing them to `createFormHook`:

```tsx
import { lazy } from "react";

const InputField = lazy(async () => ({
  default: (await import("@/components/bindings/InputField")).InputField,
}));

const NumberField = lazy(async () => ({
  default: (await import("@/components/bindings/NumberField")).NumberField,
}));

const SelectField = lazy(async () => ({
  default: (await import("@/components/bindings/SelectField")).SelectField,
}));

// Pass these lazy components to createFormHook
const fieldComponents = {
  InputField,
  NumberField,
  SelectField,
  // ...
};
```

### Using Suspense in the Form Component

We can now update our custom `Form` component to wrap children in a `Suspense` boundary to ensure a loading state is displayed while field components are being loaded:

```tsx
<Suspense fallback={<LoadingSpinner />}>
  <form.AppForm>{children}</form.AppForm>
</Suspense>
```

We can also update our `Form` component to accept a custom `fallback` element:

```tsx
import { type FormHTMLAttributes, type ReactNode, Suspense, forwardRef } from "react";

const defaultFallback = <LoadingFallback />;

interface FormProps<TFormData> extends FormHTMLAttributes<HTMLFormElement> {
  form: AppFieldExtendedReactFormApi<TFormData, /* ... type params */>;
  fallback?: ReactNode;
}

export const Form = forwardRef<HTMLFormElement, FormProps<any>>(
  ({ form, children, fallback = defaultFallback, ...props }, ref) => (
    <form
      ref={ref}
      onSubmit={(event) => {
        event.preventDefault();
        return form.handleSubmit();
      }}
      {...props}
    >
      <Suspense fallback={fallback}>
        <form.AppForm>{children}</form.AppForm>
      </Suspense>
    </form>
  ),
);
```

This allows us to optionally override the form's appearance while field components load:

```tsx
<Form
  form={form}
  fallback={<div className="animate-pulse">Loading form...</div>}
>
  {/* fields */}
</Form>
```

### Per-Field Loading States with `withLazyLoading`

While a form-level Suspense fallback works, it can cause the entire form to show a loading state when any single field is loading. A better user experience is to show a placeholder for each individual field that's loading.

We can achieve this with a `withLazyLoading` higher-order component:

```tsx
import { type ComponentType, type LazyExoticComponent, Suspense } from "react";

export const withLazyLoading =
  <FallbackProps extends object>(FallbackComponent: ComponentType<FallbackProps>) =>
  <P extends FallbackProps>(LazyComponent: LazyExoticComponent<ComponentType<P>>) => {
    return (props: P) => (
      <Suspense fallback={<FallbackComponent {...props} />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
```

This HOC wraps a lazy component with its own `Suspense` boundary and renders a fallback component with the same props. This means the fallback can use props like `label` to render a more accurate placeholder.

### Default Fallback Components

Let's take this idea and create a minimal set of fallback components that match the visual structure of our actual components:

```tsx
// DefaultFieldFallback.tsx
export function DefaultFieldFallback({ label }: { label?: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col gap-1">
      {label && (
        <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200 sm:w-1/4" />
      )}
      <div className="h-9 w-full animate-pulse rounded border border-gray-200 bg-gray-100" />
    </div>
  );
}

// DefaultButtonFallback.tsx
export function DefaultButtonFallback() {
  return (
    <div className="h-9 w-32 animate-pulse rounded-md bg-gray-200" />
  );
}
```

### Applying Field Fallback Components

Now that we've defined the `withLazyLoading` HOC and fallback components for both fields and buttons, we can wrap our lazy-loaded components easily:

```tsx
const InputField = withLazyLoading(DefaultFieldFallback)(
  lazy(async () => ({
    default: (await import("@/components/bindings/InputField")).InputField,
  })),
);

const SubmitButton = withLazyLoading(DefaultButtonFallback)(
  lazy(async () => ({
    default: (await import("@/components/bindings/SubmitButton")).SubmitButton,
  })),
);

export const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { InputField, /* ... */ },
  formComponents: { SubmitButton, /* ... */ },
});
```

When a field is loading, users see a skeleton that matches the field's structure rather than a generic loading spinner or blank space.

## Challenges and Considerations

While TanStack Form has been a significant improvement over alternatives like react-hook-form, there are some challenges worth noting.

### Type Complexity with `withForm` and `withFieldGroup`

TanStack Form's `createFormHook` exposes `withForm` and `withFieldGroup` higher-order components for breaking forms into reusable chunks. While powerful in theory, the type inference can be challenging.

At times, the form type doesn't align perfectly with what these HOCs expect, which occasionally proves challenging to overcome despite years of TypeScript experience. In some cases, I've had to resort to casting despite my degree of loathsomeness for doing so, as it bypasses TypeScript's type safety, losing its benefits:

```tsx
// Not ideal, but sometimes necessary
<MyFormSection form={form as never} />

// Or using ts-expect-error
{/* @ts-expect-error Form type mismatch */}
<MyFormSection form={form} />
```

### Verbose Generic Types

The object returned by `useAppForm` is heavily parameterized with generics. This is great for type safety in practice, but makes it difficult to type as a parameter.

When building wrapper components like our `Form` component, you may find yourself using `any` or creative type gymnastics to avoid spelling out the full generic signature. In fact, the TanStack Form library itself exposes an `AnyFormApi` type (as well as an `AnyFieldApi` type) that essentially does the same. The drawback is that type safety is lost when used.

### Error Type Handling

Error types are loosely defined because they depend on your validation implementation. TanStack Form supports multiple validation approaches (e.g.: Zod schemas, Valibot, and custom validators), each with different error structures.

For consistent error display, it's best to standardize on a single validation library and create a utility function that understands that library's error format:

```tsx
import type { AnyFieldMeta } from "@tanstack/react-form";

// Assumes Standard Schema v1 compatible validators (Zod, Valibot, etc.)
export const getFieldErrorMessage = (fieldMeta: AnyFieldMeta) => {
  if (fieldMeta.isValid) {
    return undefined;
  }

  return fieldMeta.errors
    .map((err) => err?.message)
    .filter(Boolean)
    .join(", ");
};
```

### Validation Handler Nuances

Documentation around custom validation can be sparse. When using schema validation libraries like Zod, the simple case works seamlessly:

```tsx
const form = useAppForm({
  defaultValues: { email: "" },
  validators: {
    onSubmit: myZodSchema,
  },
});
```

However, when you need more complex validation logic, returning the correct error format becomes unclear. Calling `schema.parse()` or `schema.parseAsync()` directly doesn't return what TanStack Form expects.

Instead, use TanStack Form's `standardSchemaValidators` helper:

```tsx
import { standardSchemaValidators } from "@tanstack/react-form";

const form = useAppForm({
  defaultValues: { email: "", confirmEmail: "" },
  validators: {
    onSubmit: async ({ value }) => {
      // Custom logic before validation
      if (someCondition) {
        return { fields: { email: "Custom error" } };
      }

      // Use standardSchemaValidators for schema validation
      return standardSchemaValidators.validateAsync(myZodSchema, value);
    },
  },
});
```

The `standardSchemaValidators` functions return the exact structure TanStack Form expects, ensuring errors display correctly.

## Conclusion

Despite these challenges, the benefits vastly outweigh any of the drawbacks. Working with TanStack Form has been a significant improvement over the alternatives. The library's approach is more explicit, avoiding "magic" behind the scenes, ultimately making the behavior predictable and debugging straightforward. Adding new form fields is easy and intuitive, and the library is ultimately a pleasure to work with while offering both a consistent user experience and a improved performance.

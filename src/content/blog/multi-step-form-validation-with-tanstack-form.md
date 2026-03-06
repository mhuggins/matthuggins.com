---
title: Multi-Step Form Validation with TanStack Form
date: 2026-03-06
published: true
tags: [react, typescript, tanstack form, form management]
summary: There's a moment in every sufficiently complex form where a Zod schema isn't enough. The email is valid. The password meets requirements. And yet, there's still a bot check to run, an API to hit, an error to map back to the right field. Here's what that looks like in practice.
image: /blog/multi-step-form-validation-with-tanstack-form.jpg
thumbnail: /blog/multi-step-form-validation-with-tanstack-form.thumb.jpg
---

TanStack Form ships with excellent support for schema validation libraries like [Zod](https://zod.dev/). For most simple forms, passing a schema to the appropriate validation handler is sufficient. But more complex forms often have validation requirements that live outside the schema entirely -- captcha verification, server-side uniqueness checks, rate limiting, or multi-step flows where each step depends on the previous one succeeding.

## The Problem

Consider a waitlist form with two validation concerns:

1. **Schema validation** - the email field must be a valid email address.
2. **reCAPTCHA verification** - the submission must pass a bot check via a backend API call.

These two concerns have a natural ordering -- there's no point running the expensive async API call if the email is invalid. However, making the API request falls outside the scope of standard schema validation, meaning we must implement a more complex solution.

The solution is to handle both in a custom-defined `validators.onSubmitAsync` function, running them sequentially and returning early on failure.

## The Validator Return Shape

It helps to understand what TanStack Form expects from form validator functions. Both sync and async form-level validators return `undefined` when valid or a `TStandardSchemaValidatorIssue<"form">` object when invalid, which looks like the following:

```ts
{
  form: Record<string, StandardSchemaV1Issue[]>;  // form-level errors
  fields: Record<string, StandardSchemaV1Issue[]>;  // field-level errors
}
```

Note that field validators simply return `StandardSchemaV1Issue[]` or `undefined`. This article focuses on form validators.

## Leveraging `parseValuesWithSchema`

Usually, we can provide a Zod schema (or any other schema that supports the [standard schema](https://standardschema.dev/) specification) directly to our `useAppForm` hook, and TanStack Form will handle everything behind the scenes:

```ts
const waitListSchema = z.object({
  email: z.string().email({ message: "Email address is required" }),
});

const form = useAppForm({
  validators: {
    onSubmit: waitListSchema,
  },
  // ...
});
```

But we can also supply a more complex function, which accepts an object parameter with the following properties:

- `value` - the current form state, representing all key/value pairs.
- `formApi` - the TanStack Form form API object for interacting further with the form. (For field-level validators, this parameter is named `fieldApi` instead.)
- `signal` - an abort signal that can be provided to any cancellable requests or asynchronous calls.

The `formApi` object provides both a `parseValuesWithSchema` and a `parseValuesWithSchemaAsync` function, which essentially mirrors what happens behind the scenes when we pass a Zod schema directly. (Note that `parseValuesWithSchema` should be used with `validators.onSubmit` while `parseValuesWithSchemaAsync` should be used with `validators.onSubmitAsync`.)

```ts
const form = useAppForm({
  validators: {
    onSubmit: ({ formApi }) => {
      const errors = formApi.parseValuesWithSchema(waitListSchema);
      console.log(errors); // TStandardSchemaValidatorIssue<"form"> | undefined
      return errors;
    },
  },
  // ...
});
```

Alternatively, TanStack Form exports a `standardSchemaValidators` object that provides the same functionality. This is useful for older versions of the library that predate `formApi.parseValuesWithSchema`. (Like `parseValuesWithSchema`, use `standardSchemaValidators.validate` with `validators.onSubmit` and `standardSchemaValidators.validateAsync` with `validators.onSubmitAsync`.)

```ts
import { standardSchemaValidators } from "@tanstack/react-form";

const form = useAppForm({
  validators: {
    onSubmit: ({ value }) => {
      const errors = standardSchemaValidators.validate(
        { value, validationSource: "form" },
        waitListSchema,
      );
      console.log(errors); // TStandardSchemaValidatorIssue<"form"> | undefined
      return errors;
    },
  },
  // ...
});
```

## The Full `onSubmitAsync` Pattern

Here's the complete handler from the waitlist form:

```ts
const form = useAppForm({
  defaultValues: { email: "", website: "" },
  validators: {
    onSubmitAsync: async ({ value }) => {
      // Step 1: Run Zod schema validation
      const validationResult = standardSchemaValidators.validate(
        { value, validationSource: "form" },
        waitListSchema,
      );

      // Short-circuit if schema validation fails - no need to hit the API
      if (validationResult) {
        return validationResult;
      }

      // Step 2: Get reCAPTCHA token (async, requires user interaction state)
      const recaptchaToken: string | null = await executeRecaptcha();

      // Step 3: Submit to API, which validates the captcha server-side
      const response: Response = await waitlistSubscribe({
        email: value.email,
        recaptchaToken,
      });

      // Valid response - no errors to return
      if (response.ok) {
        return undefined;
      }

      // Step 4: Map API error back to a field-level error on the email field
      const message: string = parseResponse(response);

      return {
        form: {},
        fields: { email: [{ message, path: ["email"] }] },
      } satisfies TStandardSchemaValidatorIssue<"form">;
    },
  },
  onSubmit: () => {
    // Only called on full success - safe to fire analytics, redirect, etc.
  },
});
```

A few points of note:

- **Short-circuiting is explicit.** By returning `validationResult` directly when it's truthy, you skip all subsequent async steps. TanStack Form will surface the schema errors and not call your post-validation `onSubmit` handler.
- **reCAPTCHA runs after schema validation.** This ordering matters. Executing reCAPTCHA adds latency and increases third-party service costs. If the email is invalid, you'd be adding wait time and spending money for no reason.
- **API errors are mapped to field-level errors.** This was an explicit choice for my use case, as it made sense to display all errors in the same place on this single-input waitlist form regardless of what the error was. For your purposes, it might be preferable to display a form-level error instead.
- **`onSubmit` only fires on full success.** This is a key TanStack Form guarantee: the `onSubmit` callback (where you'd do analytics, redirect, or update state) only executes when all validators return `undefined`. You don't need to guard against partial success inside it.

## Displaying Errors

Error messages won't appear automatically -- you need to explicitly extract them from field state and render them. Let's assume you're rendering the input in the following manner:

```tsx
<form.AppField name="email">
  {(field) => (
    <field.InputField type="email" placeholder="user@example.com" />
  )}
</form.AppField>
```

The `InputField` component is not provided by TanStack Form; it must be provided by you. Along with the input element, we can provide a label and render any error messages in a consistent manner:

```tsx
export function InputField({ className, label, ...props }: InputFieldProps, ref) {
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
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.target.value)}
      />
    </FieldWrapper>
  );
}
```

As long as the error is returned with `fields.email[n].message`, TanStack Form routes it to the right field, no matter which validation step produced it. I recommend taking a look at the [Bonus: Typed Error Messages](/blog/avoiding-tanstack-form-pitfalls) section of my previous article to understand how we can maintain type safety while extracting the error message.

## Key Takeaways

1. **Sequence your validators explicitly** inside `validators.onSubmit` or `validators.onSubmitAsync` using early returns.
2. **Use `formApi.parseValuesWithSchema()`** so you can call it inline and branch on the result.
3. **Map all errors, including API errors, back to form- or field-level errors** using the `TStandardSchemaValidatorIssue<"form">` return shape. This ensures errors are presented to the user, prompting them to respond appropriately.

TanStack Form's validator system is flexible enough to handle complex validation flows without needing middleware, custom hooks, or external state. When the built-in shorthand isn't expressive enough, expanding into a single validator function gives you all the control you need.

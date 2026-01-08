---
title: Avoiding TanStack Form Pitfalls
date: 2026-01-08
published: false
tags: [react, typescript, tanstack form, form management]
summary: While integrating TanStack Form with schema validation libraries like Zod, I ran into a subtle type system gap that caused validation errors to silently fail. Here's how I diagnosed the issue and built a type-safe wrapper to prevent it from happening again.
image: /blog/avoiding-tanstack-form-pitfalls.jpg
thumbnail: /blog/avoiding-tanstack-form-pitfalls.thumb.jpg
---

While working with [TanStack Form](https://tanstack.com/form) and [Zod](https://zod.dev/) validation, I spent more time than I would have liked debugging an issue where validation errors weren't displaying despite the validation clearly running. The culprit turned out to be a subtle type system gap that silently accepts the wrong configuration. If you're using TanStack Form with schema validation, here's what to watch out for.

## The Problem

TanStack Form provides both synchronous and asynchronous validator options:

```typescript
const form = useAppForm({
  validators: {
    onSubmit: schema,      // synchronous
    onSubmitAsync: schema, // asynchronous
  },
});
```

This seems straightforward enough. But here's the trap: **the synchronous validators accept `async` functions without TypeScript errors**.

Looking at TanStack Form's type definitions, the synchronous validator options like `onSubmit` have a return type that includes `unknown`. This means you can pass an async function (which returns a `Promise`) and TypeScript won't complain:

```typescript
// This compiles without errors, but doesn't work as expected!
validators: {
  onSubmit: async ({ value }) => {
    const result = await someAsyncValidation(value);
    return result.error ? { fields: { name: result.error } } : undefined;
  },
}
```

The validation *runs*, but if you're trying to render field errors within the context of `form.Field` or `form.AppField` (i.e.: using `field.state.meta` without a `useStore` hook or `form.Subscribe` component), you won't see them! Behind the scenes, TanStack Form runs the `onSubmit` validator function without waiting for the Promise to resolve since it is expecting a synchronous function. As a result, the field re-renders prior to the validation errors being applied to the field's state, and the validation errors don't appear within your form.

## The Symptoms

I first noticed something was wrong when validation errors weren't displaying for a file upload field. The validation was clearly running (I could see it in console logs), but the `debugger` statement I added to my field renderer was not being reached after validation.

My workaround at the time was to subscribe directly to the store:

```typescript
// The workaround I shouldn't have needed
const errors = useStore(field.store, (state) => state.meta.errors);
```

This worked because `useStore` subscribes to reactive updates, catching the errors when they eventually appeared. But it was masking the real problem: I was using `onSubmit` instead of `onSubmitAsync`.

## The Solution

Once I understood the root cause, the fix was simple: always use the async validator variants:

```diff
 validators: {
-  onSubmit: signInFormSchema,
+  onSubmitAsync: signInFormSchema,
 }
```

This is a straightforward change, but since it's such an easy mistake to make without TypeScript errors catching them, I wanted a better long-term solution. To prevent this in the future, I wrapped the `useAppForm` hook to remove access to the synchronous validators entirely:

```typescript
import type {
  AppFieldExtendedReactFormApi,
  FormAsyncValidateOrFn,
  FormOptions,
  FormValidateOrFn,
  FormValidators,
} from "@tanstack/react-form";
import type { Except } from "type-fest";

export type UseFormOptions<
  TFormData,
  TOnMount extends undefined | FormValidateOrFn<TFormData>,
  TOnChangeAsync extends undefined | FormAsyncValidateOrStandardSchema<TFormData>,
  TOnBlurAsync extends undefined | FormAsyncValidateOrStandardSchema<TFormData>,
  TOnSubmitAsync extends undefined | FormAsyncValidateOrStandardSchema<TFormData>,
  TOnDynamicAsync extends undefined | FormAsyncValidateOrStandardSchema<TFormData>,
  TOnServer extends undefined | FormAsyncValidateOrFn<TFormData>,
  TSubmitMeta,
> = Except<
  FormOptions<
    TFormData,
    TOnMount,
    undefined, // TOnChange
    TOnChangeAsync,
    undefined, // TOnBlur
    TOnBlurAsync,
    undefined, // TOnSubmit
    TOnSubmitAsync,
    undefined, // TOnDynamic
    TOnDynamicAsync,
    TOnServer,
    TSubmitMeta
  >,
  "validators"
> & {
  validators?: Except<
    FormValidators<
      TFormData,
      TOnMount,
      undefined, // TOnChange
      TOnChangeAsync,
      undefined, // TOnBlur
      TOnBlurAsync,
      undefined, // TOnSubmit
      TOnSubmitAsync,
      undefined, // TOnDynamic
      TOnDynamicAsync
    >,
    "onBlur" | "onChange" | "onDynamic" | "onSubmit"  // Remove sync options
  >;
};

const { useAppForm } = createFormHook({ /* ... */ });

export const useForm = <
  TFormData,
  TOnMount extends undefined | FormValidateOrFn<TFormData>,
  TOnChangeAsync extends undefined | FormAsyncValidateOrStandardSchema<TFormData>,
  TOnBlurAsync extends undefined | FormAsyncValidateOrStandardSchema<TFormData>,
  TOnSubmitAsync extends undefined | FormAsyncValidateOrStandardSchema<TFormData>,
  TOnDynamicAsync extends undefined | FormAsyncValidateOrStandardSchema<TFormData>,
  TOnServer extends undefined | FormAsyncValidateOrFn<TFormData>,
  TSubmitMeta,
>(
  props: UseFormOptions<TFormData, TOnMount, TOnChangeAsync, TOnBlurAsync, TOnSubmitAsync, TOnDynamicAsync, TOnServer, TSubmitMeta>,
): AppFieldExtendedReactFormApi<
  TFormData,
  TOnMount,
  undefined, // TOnChange
  TOnChangeAsync,
  undefined, // TOnBlur
  TOnBlurAsync,
  undefined, // TOnSubmit
  TOnSubmitAsync,
  undefined, // TOnDynamic
  TOnDynamicAsync,
  TOnServer,
  TSubmitMeta,
  FieldComponents,
  FormComponents
> => {
  return useAppForm(props);
};
```

Because TanStack Form's types have so many generic parameters, the change may look a bit intimidating due to the sheer number of lines of code. However, the basis of the change is rather simple if we hide all the parameters. It becomes clearer that we're simply omitting the `validators` key from `useForm`'s options, then replacing it with a version of the same object type that removes the synchronous validator functions as options:

```typescript
export type UseFormOptions<TFormData, /* ... */> = Except<
  FormOptions<TFormData, /* ... */>,
  "validators"
> & {
  validators?: Except<
    FormValidators<TFormData, /* ... */>,
    "onBlur" | "onChange" | "onDynamic" | "onSubmit"  // Remove sync options
  >;
};

const { useAppForm } = createFormHook({ /* ... */ });

export const useForm = <TFormData, /* ... */>(
  props: UseFormOptions<TFormData, /* ... */>,
): AppFieldExtendedReactFormApi<TFormData, /* ... */> => {
  return useAppForm(props);
};
```

Now if anyone tries to use `validators.onSubmit`, for example, TypeScript will error:

```log
Property 'onSubmit' does not exist on type '{ onSubmitAsync?: ... }'
```

## Bonus: Typed Error Messages

While I was at it, I also improved the typing for validation error messages. TanStack Form's error array is loosely defined as `unknown` to allow developers the flexibility to use whatever error shape suits them. However, when using [Standard Schema](https://standardschema.dev/) validators (Zod, Valibot, etc.), errors follow the `StandardSchemaV1Issue` format:

```typescript
type StandardSchemaV1Issue = {
  message: string;
  path?: Array<PropertyKey | { key: PropertyKey }>;
};
```

First, I updated our `useForm` wrapper hook to restrict the types accepted by the `validators` async properties to a subset of what is normally allowed:

```typescript
import type {
  AbortSignal,
  FormApi,
  StandardSchemaV1,
  StandardSchemaV1Issue,
} from "@tanstack/react-form";

type StandardFormValidatorIssues = {
  form: Record<string, StandardSchemaV1Issue[]>;
  fields: Record<string, StandardSchemaV1Issue[]>;
};

type FormAsyncValidateOrStandardSchema<TFormData> =
  | StandardSchemaV1<TFormData, unknown>
  | ((props: {
      value: TFormData;
      formApi: FormApi<TFormData, any, any, any, any, any, any, any, any, any, any, any>;
      signal: AbortSignal;
    }) =>
      | StandardFormValidatorIssues
      | undefined
      | Promise<StandardFormValidatorIssues | undefined>);
```

Then, I updated our error handling to expect this shape:

```typescript
export const getFieldErrorMessage = (fieldMeta: AnyFieldMeta) => {
  if (fieldMeta.isValid) return undefined;

  // We can safely cast to `StandardSchemaV1Issue[]` here due to the explicit
  // typing on the `validators` object in our wrapped `useForm` hook.
  return (fieldMeta.errors as StandardSchemaV1Issue[])
    .map((err) => err?.message)
    .filter(Boolean)
    .join(", ");
};
```

## Key Takeaways

1. **Always use `onBlurAsync` / `onChangeAsync` / `onSubmitAsync` / `onDynamicAsync`** when your validation involves Promises or schema libraries.

2. **The synchronous validators accepting async functions is a type system gap**, not intended behavior. The `unknown` return type is overly permissive.

3. **If you're seeing validation run without errors appearing**, check if you're accidentally using sync validators with async logic.

4. **Consider wrapping `useAppForm`** to enforce your team's conventions at the type level.

5. **If you find yourself reaching for `useStore` to access form state**, it might be a sign something else is wrong. The standard `field.state.meta` should work within the context of `form.Field` or `form.AppField` in most cases.

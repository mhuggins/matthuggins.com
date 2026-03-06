---
title: Fixing TanStack Form `defaultValues` Type Discrepancies
date: 2026-03-05
published: true
tags: [react, typescript, tanstack form, form management]
summary: When TanStack Form's `defaultValues` object narrows a union type to a more specific type than a given validation schema, TypeScript complains. However, there's a clean way to resolve it without sacrificing type safety.
image: /blog/fixing-tanstack-form-default-values-type-discrepancies.jpg
thumbnail: /blog/fixing-tanstack-form-default-values-type-discrepancies.thumb.jpg
---

When using [TanStack Form](https://tanstack.com/form) with [Zod](https://zod.dev/) schema validators, you may run into a TypeScript error that isn't immediately obvious to diagnose. The culprit is a mismatch between the type inferred from your `defaultValues` object and the broader type expressed by your schema. Here's what causes it and how to resolve it cleanly.

## The Problem

Consider a form that accepts either a string or a number for a particular field:

```typescript
const formSchema = z.object({
  favoriteNumber: z.union([z.string(), z.number()]),
});
```

When you wire this up with `useAppForm`, TypeScript infers the type of `defaultValues` from the literal values you provide:

```typescript
const form = useAppForm({
  defaultValues: { favoriteNumber: 0 }, // inferred as { favoriteNumber: number }
  validators: { onSubmit: formSchema }, // inferred as { favoriteNumber: string | number }
  onSubmit: () => {},
});
```

The issue here is that `{ favoriteNumber: 0 }` is inferred as `{ favoriteNumber: number }`. TypeScript doesn't know that `favoriteNumber` could also be a string, so it sees a mismatch between the inferred `defaultValues` type and the schema's expected `string | number`. The result is a TypeScript error that can be confusing to diagnose, since the values themselves are perfectly valid.

## The Solution

The fix is to explicitly widen the type of the `defaultValues` object to match the schema's inferred type. We can do this concisely using a combination of `satisfies` and `as`:

```typescript
type FormSchema = z.infer<typeof formSchema>;

const form = useAppForm({
  defaultValues: { favoriteNumber: 0 } satisfies FormSchema as FormSchema,
  validators: { onSubmit: formSchema },
  onSubmit: () => {},
});
```

The `satisfies` keyword ensures that the object literal conforms to `FormSchema` at the point of assignment. If you make a mistake -- say, setting `favoriteNumber` to a boolean -- TypeScript will catch it immediately. The subsequent `as FormSchema` cast tells TypeScript to treat the value as the wider union type, resolving the mismatch.

Using `satisfies` and `as` together is what makes this safe. The `as` cast alone would suppress the error but silently allow invalid values. The `satisfies` check ensures you still get an error if the default value isn't actually valid for the schema. Neither alone gives you both guarantees.

## Why This Comes Up

This pattern is most likely to appear when your schema uses union types that are broader than what a plain object literal naturally expresses. A `defaultValues` object with `favoriteNumber: 0` will always be inferred as `{ favoriteNumber: number }`, never `{ favoriteNumber: string | number }`. The schema's union type has no way to influence that inference.

You'll run into the same issue with other widening scenarios:

```typescript
// Schema expects `string | null`, defaultValues infers `string`
const formSchema = z.object({ nickname: z.string().nullable() });
const form = useAppForm({
  defaultValues: { nickname: "" } satisfies FormSchema as FormSchema,
  // ...
});

// Schema expects `"asc" | "desc"`, defaultValues infers `string`
const formSchema = z.object({ sortOrder: z.enum(["asc", "desc"]) });
const form = useAppForm({
  defaultValues: { sortOrder: "asc" } satisfies FormSchema as FormSchema,
  // ...
});
```

In each case, the `satisfies` + `as` pattern resolves the mismatch while keeping the type-safety guarantee that your defaults are actually valid.

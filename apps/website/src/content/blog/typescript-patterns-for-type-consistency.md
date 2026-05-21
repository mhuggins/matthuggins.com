---
title: TypeScript Patterns for Type Consistency
date: 2026-05-21
published: true
tags: [typescript]
summary: Every TypeScript type you write is either earning its keep by catching drift, enforcing exhaustiveness, and surfacing mismatches between systems, or just decoration. Here are the patterns I reach for to keep types pulling their weight across a codebase.
image: /blog/typescript-patterns-for-type-consistency.jpg
thumbnail: /blog/typescript-patterns-for-type-consistency.thumb.jpg
---

A TypeScript type is only useful when it accurately reflects what your code does. The moment a constant drifts from its declared type, a Zod schema diverges from its TypeScript counterpart, or a new union member silently bypasses an existing switch statement, the compiler stops protecting you against bugs that should never have made it past `tsc`.

This post collects the patterns I reach for to keep types and reality in lockstep. None of them are individually clever, but together they help prevent unexpected behavior and edge cases. Each one removes the need to remember which scattered pieces of code have to change together, collapsing them into a single source of truth the compiler can enforce.

## Avoiding `any` and `unknown`

Before getting to the patterns, one foundational habit worth adopting is to avoid `any` and `unknown` unless absolutely necessary. They're often used as escape hatches, and the more they appear in a codebase, the more likely you are to encounter unexpected type-related bugs.

- **`any`** turns off type checking entirely. The compiler will happily let you call an `any`-typed value like a function, index it like an array, or pass it to something expecting a `Date`. Bugs that should be caught at compile time hide behind it.
- **`unknown`** is the safer cousin, since you can't *use* an `unknown` value without narrowing it first, but it still represents a place where you've given up on knowing the shape of your data.

There are legitimate uses for both, such as interoperability with untyped libraries and parsing input at system boundaries. `unknown` also has a place within type definitions, where it can stand in for "a value of any type" without disabling type checking. A conditional type that checks whether a type is an array, for instance, doesn't care what the array holds:

```ts
type IsArray<T> = T extends unknown[] ? T : never;
type IsNotArray<T> = T extends unknown[] ? never : T;
```

Beyond scenarios like these, they should generally be avoided. When you do need them, keep them at the edges of your application and never in the middle of its core logic. If you find yourself reaching for `any` to silence an error, the better move is almost always to figure out what type the value actually has and express that. The compiler can only protect you if you tell it the truth.

## Avoiding explicit type casting

Another habit worth adopting is to avoid explicit type casting. Consider the following example.

```ts
interface User {
  id: string;
  name: string;
  address: Address;
}

interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
}

function getUserPostalCode(user: User): string {
  return user.address.postalCode;
}

getUserPostalCode({ id: crypto.randomUUID() } as User);
// Uncaught TypeError: Cannot read properties of undefined (reading 'postalCode')
```

TypeScript happily lets you cast `{ id: "..." }` as a `User` because the two types are close enough to be considered comparable. Every `User` is also a valid `{ id: string }`, so the assertion looks plausible to the compiler. The problem is that the object literal never actually provides `name` or `address`, so you'll end up with unexpected results when the code executes.

## Exhaustiveness

### `assertNever` in switch statements

When you switch on a union or enum, you want the compiler to scream if you add a new variant and forget a case.

```ts
type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "canceled";

function assertNever(value: never): never {
  throw new Error(`Unhandled discriminated union member: ${JSON.stringify(value)}`);
}

function statusLabel(status: OrderStatus): string {
  switch (status) {
    case "pending":    return "Awaiting payment";
    case "processing": return "Preparing your order";
    case "shipped":    return "On the way";
    case "delivered":  return "Delivered";
    case "canceled":   return "Canceled";
    default:           return assertNever(status);
  }
}
```

If you add `"refunded"` to the union, TypeScript will refuse to compile this function. `status` in the `default` branch is now `"refunded"`, not `never`, and that's not assignable to the parameter. You're forced to handle the new case before the build will pass.

The `assertNever` helper is three lines you write once and use everywhere. It's also useful at the end of object lookups, type predicate fallbacks, and anywhere else exhaustiveness matters.

### `Record<Union, X>` for complete mappings

A switch is one way to enforce coverage. A `Record` keyed by a union is another, which is often a cleaner option when you're just mapping values:

```ts
const STATUS_LABELS: Record<OrderStatus, string> = {
  pending:    "Awaiting payment",
  processing: "Preparing your order",
  shipped:    "On the way",
  delivered:  "Delivered",
  canceled:   "Canceled",
};
```

Just like the switch statement pattern, TypeScript will remind you with a compile error if you drop a key, spell one incorrectly, or extend the union.

### Union partitioning

`Record<Union, X>` enforces coverage because it's a single map with one slot per member. Sometimes, though, you don't want a map at all. Instead, you want to sort a union's members into several separate groups, perhaps to render three distinct dashboard sections or to feed three different code paths. The natural approach is to reach for a handful of `as const` arrays:

```ts
type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "canceled";

const ACTIVE_STATUSES = ["pending", "processing"] as const;
const IN_TRANSIT_STATUSES = ["shipped"] as const;
const CLOSED_STATUSES = ["delivered", "canceled"] as const;
```

The problem with this approach is that nothing tells the compiler these three arrays are meant to collectively cover `OrderStatus`. If you add `"refunded"` to the union, it can quietly belong to none of them. This is a silent omission rather than an outright error, so TypeScript has no reason to flag it.

The fix is to reconstruct the union from the partitioned arrays and assert that it equals the original:

```ts
import type { IsEqual } from "type-fest";

type CategorizedStatus =
  | (typeof ACTIVE_STATUSES)[number]
  | (typeof IN_TRANSIT_STATUSES)[number]
  | (typeof CLOSED_STATUSES)[number];

true satisfies IsEqual<CategorizedStatus, OrderStatus>;
```

Because each array is defined using `as const`, `(typeof ARRAY)[number]` recovers its exact literal union. Joining the three together with `|` gives you the union as it's actually partitioned, and `IsEqual` checks that result against the original source of truth.

`IsEqual` performs a bidirectional comparison, which is what makes this check reliable. If you add a status to `OrderStatus` but forget to place it in one of the arrays, the reconstructed union will be missing a member and the assertion will fail. If you remove a status from the union while it's still referenced in an array, the reconstructed union will have an extra member and the assertion will fail. Either kind of drift breaks the build.

One caveat is that this only proves the groups cover the union, not that they're disjoint. Listing the same status in two arrays still produces a combined union that equals the target, so the check will pass. If true mutual exclusivity matters, that's a separate and more difficult thing to enforce at the type level.

## Preserving literal types

### Deriving unions from `const` objects

Repeating the same set of string literals in two places, once as a constant and once as a type, is asking for drift. Derive one from the other:

```ts
const NOTIFICATION_CHANNELS = {
  EMAIL: "email",
  SMS:   "sms",
  PUSH:  "push",
} as const;

type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[keyof typeof NOTIFICATION_CHANNELS];
// "email" | "sms" | "push"
```

Add an entry, the union grows. Remove one, the union shrinks. The constant and the type can never disagree because the type *is* the constant.

### Preventing shape widening via `as const satisfies`

When you annotate an object literal with a type, TypeScript widens the values to match. For example:

```ts
const CHANNEL_PRIORITY: Record<NotificationChannel, number> = {
  email: 1,
  sms:   2,
  push:  3,
};

type EmailPriority = typeof CHANNEL_PRIORITY["email"]; // typed as `number`
```

That's often fine for variables, but it's almost never what you want for lookup tables, where you'd rather keep the narrow literal types for downstream inference. Using `satisfies` allows you to verify the shape's structure without widening it:

```ts
const CHANNEL_PRIORITY = {
  email: 1,
  sms:   2,
  push:  3,
} as const satisfies Record<NotificationChannel, number>;

type EmailPriority = typeof CHANNEL_PRIORITY["email"]; // typed as `1`
```

This approach gives you exhaustiveness checking (every notification channel must be present) *and* preserves the literal `1`, `2`, `3` types for any code that depends on the exact value.

### Using `as const satisfies Union[]` for subset arrays

When an array should hold a curated subset of a union, pair `as const` with `satisfies` just like in the previous example:

```ts
const SUPPORTED_CHANNELS = ["email", "push"] as const satisfies NotificationChannel[];
```

If `NotificationChannel` later drops `"email"`, this array fails to compile. If a value contains a typo, it fails immediately. And `(typeof SUPPORTED_CHANNELS)[number]` is a precise `"email" | "push"` union, not just `NotificationChannel`.

## Narrowing with guarantees

### Type predicates that narrow to literal subsets

A user-defined type guard isn't just for telling `unknown` apart from `string`. It can carve out *specific literals* from a union:

```ts
type Role = "owner" | "admin" | "editor" | "viewer";

function isPrivileged(role: Role): role is "owner" | "admin" {
  return role === "owner" || role === "admin";
}
```

The signature is a contract: "after this returns true, the value is one of these two." The body must back it up. If you add `"superadmin"` to `Role` and consider it privileged, the function body needs updating *and* the return-type literal union needs updating. The two evolve together, and any caller that uses the narrowed value gets the precise type.

### A truthy filter helper

A pattern I use constantly: build an array of conditional values, then strip the falsy ones with a type-guarded filter.

```ts
function isTruthy<T>(value: T | false | null | undefined | 0 | ""): value is T {
  return Boolean(value);
}

function notificationsFor(user: User): NotificationChannel[] {
  return [
    user.email && "email",
    user.phone && "sms",
    user.deviceToken && "push",
  ].filter(isTruthy);
}
```

Without `isTruthy`, the array's type is `(NotificationChannel | "" | undefined)[]` and a plain `.filter(Boolean)` leaves the falsy types in the result. With the type guard, you get a clean `NotificationChannel[]`. The compiler enforces that you reach for the right filter helper. This `isTruthy` function is already included in some commonly used libraries like [remeda](https://remedajs.com/docs/#isTruthy) as well.

### Discriminated unions

When you have a "kind of thing" that takes different shapes, a discriminated union beats every alternative (optional fields, separate types joined with `|`, base classes), because TypeScript can narrow on the discriminator:

```ts
type UserEvent =
  | { type: "click"; x: number; y: number }
  | { type: "key"; key: string; shift: boolean }
  | { type: "focus"; target: string };

function describe(event: UserEvent): string {
  switch (event.type) {
    case "click": return `click at ${event.x},${event.y}`;
    case "key":   return `key ${event.key}`;
    case "focus": return `focus on ${event.target}`;
    default:      return assertNever(event);
  }
}
```

Inside each branch, TypeScript knows exactly which variant you have. `event.x` only exists in `"click"`, and the compiler enforces it. Combined with `assertNever`, adding a new event kind becomes a multi-step build error that walks you to every place you forgot.

## Cross-system consistency

### Asserting Zod schemas match TypeScript types

When you have a TypeScript type *and* a Zod schema for the same data (common when types come from a backend and you want runtime validation at the edge), drift is inevitable unless you make it impossible.

```ts
import type { IsEqual } from "type-fest";
import { z } from "zod";

type Role = "owner" | "admin" | "editor" | "viewer";

const roleSchema = z.union([
  z.literal("owner"),
  z.literal("admin"),
  z.literal("editor"),
  z.literal("viewer"),
]);

true satisfies IsEqual<z.infer<typeof roleSchema>, Role>;
```

That last line is the magic. `IsEqual` resolves to `true` only when its two type arguments are mutually assignable. The `satisfies` check fails to compile the moment the schema and the type diverge in either direction. Add a role to the type but not the schema, or vice versa, and the build breaks.

It's one line per pair, and it pays for itself the first time it catches a mismatch.

### Generic constraints that reference real data

When a "field definition" or "column descriptor" needs to reference a key of some underlying type, don't accept a `string`. Constrain it:

```ts
type FieldDefinition<T, K extends keyof T = keyof T> = {
  id: K;
  label: string;
  format?: (value: T[K]) => string;
};

type User = { id: string; name: string; createdAt: Date };

const userFields: FieldDefinition<User>[] = [
  { id: "name", label: "Name" },
  { id: "createdAt", label: "Joined", format: (d) => d.toLocaleDateString() },
];
```

Mistyping `"createdAt"` as `"cratedAt"` will cause the compiler to complain. Renaming `createdAt` on `User` will break every field definition referencing it. As a bonus, the `format` function's parameter is typed precisely as `Date`, because `T[K]` resolves with the literal key, with no manual annotation needed.

## Key Takeaways

- **Make the type system the source of truth.** Derive constants, schemas, and runtime validators from a single type definition rather than maintaining parallel copies that have to stay in lockstep.

- **Keep `any`, `unknown`, and explicit casts at the edges.** They switch off the guarantees every other pattern relies on, so confine them to system boundaries and never reach for them to silence an error in core logic.

- **Prefer `as const satisfies T` over `: T`.** It checks the shape without widening, so downstream code keeps the narrow literal types it needs for inference.

- **Use `assertNever` and `Record<Union, X>` to make exhaustiveness the compiler's job.** Adding a union member should turn into a multi-step build error, not a silent omission.

- **Narrow with type predicates, including to literal subsets.** A guard that returns `role is "owner" | "admin"` encodes a contract the body has to keep, and gives callers precise types for free.

- **Reach for discriminated unions over optional fields or loose `|` joins.** A shared discriminant lets TypeScript narrow each branch precisely, and pairs with `assertNever` to make new variants a guided build error.

- **Constrain key references with `keyof T` instead of `string`.** Field and column descriptors that point at real keys catch typos and renames, and infer the value type for free.

- **Assert type equality with `IsEqual` wherever two definitions must agree.** One line catches drift between a Zod schema and its TypeScript type, or between a union and the `as const` arrays that partition it.

---
title: "One Schema, Two Codegens: Typing GraphQL Across Client and Server"
date: 2026-05-30
published: false
tags: [graphql, node.js, typescript, javascript]
summary: "How I keep a single GraphQL schema as the source of truth across a client and a server: sharing the SDL, generating types on both ends, and using fragments to declare a shape once and compose it into complex reusable types."
image: /blog/typing-graphql-across-client-and-server.jpg
thumbnail: /blog/typing-graphql-across-client-and-server.thumb.jpg
---

GraphQL gives you a single contract that two codebases agree on: the client asks for exactly the data it wants, and the server promises exactly the data it has. The catch is that the contract is only as good as the types around it. If the client's idea of a `Product` and the server's idea of a `Product` are two hand-maintained TypeScript interfaces, they will drift, and GraphQL's whole "ask for what you need" guarantee quietly stops being checked.

My approach removes that hand-maintenance entirely. There's **one** `.graphql` schema, written in GraphQL's Schema Definition Language (SDL), and it's the only thing I author by hand. Both the client and the server run [GraphQL Code Generator](https://the-guild.dev/graphql/codegen) against that same schema, each with a different preset suited to its role. Everything in TypeScript, on both sides, is generated. A field I add to the schema shows up as a type change in both codebases, and anything that no longer lines up becomes a compile error rather than a runtime surprise.

I'll use a small e-commerce domain throughout (users, products, orders, and order line items) because the shapes are familiar. This is the same domain I used in [Structuring the GraphQL Request Context](/blog/structuring-the-graphql-request-context), and the two posts are companions: that one is about what the server hands each resolver, while this one is about how the schema and its types travel between the client and the server.

## The single source of truth

The schema is a plain `.graphql` file. Here is the slice I'll keep coming back to:

```graphql
# schema.graphql
scalar DateTime

type Pagination {
  offset: Int!
  limit: Int!
  totalCount: Int!
}

type Product {
  id: ID!
  name: String!
  sku: String!
  brand: String!
  category: Category!
  price: String!
  currency: String!
}

type Order {
  id: ID!
  channel: Channel!
  createdAt: DateTime!
}

type OrderItem {
  id: ID!
  quantity: Int!
  unitPrice: String!
  lineTotal: String!
  order: Order!
  product: Product!
}
```

The server owns this file as part of its schema definition. The client needs the very same file to generate matching types. So before anything else, I have to answer one question: how does the client get a copy of the schema, and how do I keep that copy honest?

## Sharing the schema between client and server

There are a few ways to get the schema into the client, and they sit on a spectrum from "simplest, drifts the most" to "a little setup, never drifts."

**1. Copy the file in.** The most basic option is to literally keep a `schema.graphql` in the client repo alongside the server's. This is where a lot of projects start, and it works: codegen points at the local copy and everything downstream is typed. The problem is that nothing keeps the two copies in sync. Add a field on the server, forget to copy it over, and the client's generated types silently lag the real API. The drift is invisible until a query fails at runtime.

**2. Load it from a URL.** Codegen's `schema` field accepts an HTTP endpoint, so the client can introspect the running server at generation time:

```js
// graphql.config.js
module.exports = {
  schema: 'https://api.example.com/graphql',
  // ...
};
```

Now the client always generates against whatever the server is actually serving. The downside is a build-time dependency on a reachable, up-to-date server, which is awkward in CI and offline development, and it couples your client build to a deployed environment.

**3. Load it from a path as part of the build.** If the client and server live near each other, codegen can read the server's `.graphql` file directly:

```js
// graphql.config.js
module.exports = {
  schema: '../server/src/server/schema.graphql',
  // ...
};
```

No copying, no network. The schema has exactly one on-disk home, and the client reads it. This is a real improvement, but it leans on a relative path between two projects, which is brittle if either one moves.

**4. Share it as a workspace package.** This is the option I reach for, and it's the reason I'm such a fan of [pnpm workspaces](/blog/pnpm-makes-monorepos-effortless). I put the schema in its own package, say `@acme/graphql-schema`, that exports the `.graphql` file (and, optionally, the generated server-side types). Both the client and the server depend on it with the `workspace:*` syntax:

```json
{
  "dependencies": {
    "@acme/graphql-schema": "workspace:*"
  }
}
```

Codegen then resolves the schema through normal module resolution rather than a hand-written relative path:

```js
// graphql.config.js
const path = require('path');

module.exports = {
  schema: path.join(
    path.dirname(require.resolve('@acme/graphql-schema/package.json')),
    'schema.graphql',
  ),
  // ...
};
```

The schema now has exactly one owner, it's versioned like any other dependency, and there's no copy to drift and no relative path to break. When I touch the schema, both packages rebuild against the change, and pnpm's workspace linking means I never manually bump a version to make that happen. If you haven't set up a workspace before, the [pnpm post](/blog/pnpm-makes-monorepos-effortless) walks through the whole thing; sharing a GraphQL schema is one of the cleanest examples of why it's worth it.

Whichever option you pick, the principle is the same: the SDL is authored once, and every consumer generates from that one definition rather than describing the shapes a second time by hand.

## Two codegens, one schema

The client and the server consume the schema for opposite reasons, so they run codegen with different presets.

On the **server**, I generate resolver types with `typescript` and `typescript-resolvers`, then bind each GraphQL type to its backing database model with `mappers`. The whole point there is to type the *implementation* of the schema: what a resolver receives as its parent, what it must return, and what lives on the request context. I covered that side in depth (and why the context has exactly the shape it does) in [the request context post](/blog/structuring-the-graphql-request-context), so I won't repeat it here.

On the **client**, I have the opposite job. I'm not implementing the schema, I'm *consuming* it: writing queries and fragments and getting back precisely typed results. For that, codegen's [client preset](https://the-guild.dev/graphql/codegen/plugins/presets/preset-client) is purpose-built. Here is the full client config:

```js
// graphql.config.js
/** @type {import('@graphql-codegen/cli').CodegenConfig} */
const codegen = {
  ignoreNoDocuments: true,
  generates: {
    'src/renderer/api/generated/': {
      preset: 'client',
      config: {
        useTypeImports: true,
        defaultsScalarType: 'unknown',
        scalars: {
          DateTime: 'string',
        },
      },
      presetConfig: {
        fragmentMasking: { unmaskFunctionName: 'getFragmentData' },
      },
    },
  },
};

/** @type {import('graphql-config').IGraphQLConfig} */
module.exports = {
  schema: 'src/renderer/api/schema.graphql',
  documents: 'src/**/*.{ts,tsx}',
  extensions: { codegen },
};
```

A few of these settings carry real weight, and they're the same ones that determine how my GraphQL objects get typed.

## How I type GraphQL objects

The client preset generates a `graphql()` function into `generated/`. I write every query and fragment as a string passed to that function, and what comes back is a fully typed document node. The generator reads my `documents` glob, finds those calls, and emits a type for the exact selection set of each one. I never write a type that describes a query result; I write the query, and the result type is derived from it.

```ts
import { graphql } from '../generated';

const productDoc = graphql(`
  query GetProduct($id: ID!) {
    product(id: $id) {
      id
      name
      price
    }
  }
`);
```

When I execute `productDoc`, the result is typed as `{ product: { id: string; name: string; price: string } }` and nothing more, because that's exactly what I selected. The variables are typed too, so passing anything but `{ id: string }` is a compile error.

The three `config` options above are what make those types precise rather than approximate:

- **`scalars`** maps custom GraphQL scalars onto real TypeScript types. GraphQL only knows `DateTime` is "some scalar," so without this it would type as `any`. Mapping `DateTime: 'string'` tells the generator that this scalar arrives over the wire as a string (which it does, as JSON), so every `createdAt` is typed `string` end to end.
- **`defaultsScalarType: 'unknown'`** is a safety net. Any scalar I forget to map becomes `unknown` instead of `any`, so an unmapped scalar surfaces as a type I'm forced to narrow rather than one that silently swallows mistakes.
- **`useTypeImports: true`** emits `import type` for type-only imports, which keeps the generated types from pulling runtime code into bundles and plays nicely with `isolatedModules`.

The result is that a GraphQL object on the client is never something I describe. It is something the schema describes, narrowed to the fields I actually asked for.

## Fragments to prevent duplication

Once I have more than one or two queries, the same selections start repeating. Three different screens all want a product's name, brand, price, and currency. A dozen list queries all return the same pagination envelope. Copy-pasting those selections is exactly the drift problem again, one query down.

Fragments are GraphQL's answer, and they're a client-side tool in the truest sense: a fragment declares "this set of fields on this type," and any query can spread it. I declare each shared shape once. The pagination envelope is the simplest example, and it shows up in every list query I write:

```ts
// paginationFragmentDoc.ts
import { graphql } from './generated';

export const paginationFragmentDoc = graphql(`
  fragment PaginationDetails on Pagination {
    offset
    limit
    totalCount
  }
`);
```

Entity fragments work the same way, and they nest. An order line item is most useful with its parent order and its product alongside it, so I declare a fragment per entity and let the line-item fragment pull in the others:

```ts
export const productDetailsDoc = graphql(`
  fragment ProductDetails on Product {
    name
    sku
    brand
    category
    price
    currency
  }
`);

export const orderDetailsDoc = graphql(`
  fragment OrderDetails on Order {
    channel
    createdAt
  }
`);

export const orderItemDetailsDoc = graphql(`
  fragment OrderItemDetails on OrderItem {
    id
    quantity
    unitPrice
    lineTotal
    order {
      ...OrderDetails
    }
    product {
      ...ProductDetails
    }
  }
`);
```

Now any query composes from those pieces instead of re-listing fields. A paginated list of order items becomes a tidy spread of two fragments:

```ts
const orderLinesDoc = graphql(`
  query GetOrderLines($input: OrderLinesInput!) {
    orderLines(input: $input) {
      data {
        ...OrderItemDetails
      }
      pagination {
        ...PaginationDetails
      }
    }
  }
`);
```

There's one wrinkle that trips people up the first time, and it's a feature, not a bug. The client preset uses **fragment masking**. When a query spreads `...OrderItemDetails`, the query's result type doesn't expose those fields directly. Instead it exposes an opaque reference, and the only way to read the fields is to "unmask" the reference with the fragment's own document. That is what `unmaskFunctionName: 'getFragmentData'` in the config sets up. The component (or hook) that wants the data calls `getFragmentData` with the same fragment it depends on:

```ts
const { orderLines } = await client.request(orderLinesDoc, { input });

const pagination = getFragmentData(paginationFragmentDoc, orderLines.pagination);
//    ^ { offset: number; limit: number; totalCount: number }
```

The payoff is that each piece of code can only see the fields it explicitly declared a dependency on. A component that spreads `PaginationDetails` can't accidentally reach into product fields that happen to ride along in the same response. The fragment is both the data dependency and the access key, so the coupling between "what this code reads" and "what this code selected" is enforced rather than trusted.

## Converting fragments into complex reusable types

This is where the approach goes from "less duplication" to "genuinely powerful." Because codegen emits a named TypeScript type for every fragment, I can build higher-order types *out of those fragment types*. The generator names them predictably: `OrderItemDetails` becomes `OrderItemDetailsFragment`, `ProductDetails` becomes `ProductDetailsFragment`, and so on.

The motivating case: my UI doesn't actually want the nested shape the query returns (a line item containing an order containing a product). It wants one flat row per line, with the product and order fields merged in, ready to drop into a data grid. I want a single `OrderLine` type for that, and I want it derived from the fragments so it can't drift from what I selected.

I build it by intersecting the three fragment types, dropping the bookkeeping keys and the nested references, and re-adding a couple of renamed ids:

```ts
// types/OrderLine.ts
import {
  OrderItemDetailsFragment,
  OrderDetailsFragment,
  ProductDetailsFragment,
} from '../api/generated/graphql';

// A stricter Omit that errors if you name a key the type doesn't have,
// so renamed or removed fields surface immediately.
type OmitStrict<T, K extends keyof T> = Omit<T, K>;

export interface OrderLine
  extends OmitStrict<
      OrderItemDetailsFragment,
      '__typename' | ' $fragmentName' | 'id' | 'order' | 'product'
    >,
    OmitStrict<OrderDetailsFragment, '__typename' | ' $fragmentName'>,
    OmitStrict<ProductDetailsFragment, '__typename' | ' $fragmentName'> {
  orderItemId: OrderItemDetailsFragment['id'];
}

export type DisplayableOrderLine = OmitStrict<OrderLine, 'orderItemId'>;
export type DisplayableOrderLineColumnName = keyof DisplayableOrderLine;
```

A lot is happening in that small file, and it's worth reading slowly:

- **Each fragment type contributes its fields by intersection.** `OrderLine` is the merge of all three fragments' fields, so the flat row is defined entirely in terms of shapes that trace back to the SDL.
- **`OmitStrict` strips the parts I don't want flattened.** I drop GraphQL's `__typename` and the internal ` $fragmentName` marker, drop the nested `order` and `product` references (their fields are merged in flat, so I don't want the nested objects too), and drop the generic `id` so I can re-expose it under a clearer name.
- **Renamed ids are re-added explicitly**, typed from the fragment itself (`OrderItemDetailsFragment['id']`) so even the rename stays tied to the source.
- **`keyof` over the derived type** gives me a column-name union for free. `DisplayableOrderLineColumnName` is "every column this row can show," computed from the fragments, never maintained by hand.

The runtime side mirrors the type. I unmask each fragment in turn and merge the data in the same order the type intersects it:

```ts
import omit from 'lodash/omit';
import { FragmentType, getFragmentData } from '../api/generated';

export const constructOrderLine = (
  item: FragmentType<typeof orderItemDetailsDoc>,
): OrderLine => {
  const orderItem = getFragmentData(orderItemDetailsDoc, item);
  const order = getFragmentData(orderDetailsDoc, orderItem.order);
  const product = getFragmentData(productDetailsDoc, orderItem.product);

  const combined = omit({ ...product, ...order, ...orderItem }, ['__typename', 'id']);

  return { ...combined, orderItemId: orderItem.id };
};
```

The function takes a `FragmentType<typeof orderItemDetailsDoc>`, which means any caller holding an unmasked-or-not order-item reference can pass it in, and out comes a fully typed `OrderLine`. Add a field to `ProductDetails` in the schema, run codegen, and that field automatically appears on `ProductDetailsFragment`, which means it appears on `OrderLine`, which means it appears as a new member of `DisplayableOrderLineColumnName`. If a column map somewhere is now missing that key, it's a type error. The complex type is generated from the generated types, so it can't drift away from the schema.

This is the client-side mirror image of what I do with interfaces on the server. There, I declare a shape once as a GraphQL `interface` and compose concrete types from it; here, I declare a shape once as a fragment and compose view types from it. Different tools for different roles, same goal: write the shape once, reuse it everywhere, and let the compiler guarantee nothing drifts.

## A few things that round it out

**The typed client ties back to the request context.** I execute documents through a single configured [`graphql-request`](https://www.npmjs.com/package/graphql-request) client, created once and handed the auth token from app state:

```ts
const client = new GraphQLClient(endpoint, {
  headers: {
    authorization: token ? `Bearer ${token}` : '',
  },
});
```

That `Bearer` header is the exact other end of the handshake described in the request context post: the client attaches the token, and the server's context factory reads it back, verifies it, and resolves it into `currentUser` before any resolver runs. Because `client.request(doc, variables)` infers both the result type and the variables type from the generated document, the request call is type-checked against the schema without any annotations on my part.

**Conditional fields can be driven by typed variables.** For something like a configurable report, where the columns are chosen at runtime, I use `@include(if:)` directives keyed off boolean variables, and codegen types those variables for me:

```ts
const reportDoc = graphql(`
  query SalesReport($input: ReportInput!, $includeRevenue: Boolean!, $includeMargin: Boolean!) {
    report(input: $input) {
      data {
        category
        revenue @include(if: $includeRevenue)
        margin @include(if: $includeMargin)
      }
    }
  }
`);
```

The generated variables type now requires `includeRevenue` and `includeMargin`, so the hook that builds this query maps the user's selected columns onto those flags with the compiler watching. The result type even reflects that the conditional fields may be absent, which keeps the consuming code honest about what it actually requested.

## The whole picture

End to end, the approach is one schema and two generators:

1. **Author the schema once** as SDL, and give it a single owner. A workspace package is the cleanest home, since it kills both the copy-drift and the relative-path fragility of the alternatives.
2. **Generate on the server** with `typescript-resolvers` and `mappers`, so the implementation is typed against the schema (covered in [the request context post](/blog/structuring-the-graphql-request-context)).
3. **Generate on the client** with the client preset, so every query and fragment yields a precise result type with no hand-written interfaces.
4. **Declare shared shapes once** as fragments, compose queries from them, and let fragment masking enforce that code only reads what it selected.
5. **Derive complex view types** from the generated fragment types with intersections and `keyof`, so the flat shapes the UI consumes still trace back to a single field declaration in the schema.

The thread running through all of it is that I author exactly one description of each shape, in SDL, and let codegen carry it to both sides. The client and the server never describe the same `Product` twice, so they can never describe it differently. The contract stays a contract, and the compiler is the one enforcing it.

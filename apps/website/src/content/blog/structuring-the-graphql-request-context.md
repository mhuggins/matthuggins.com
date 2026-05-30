---
title: Structuring the GraphQL Request Context
date: 2026-05-30
published: false
tags: [graphql, prisma, node.js, typescript, javascript]
summary: "My approach to shaping an Apollo server's GraphQL context around three fields: a resolved current user, a shared data layer, and a fresh set of DataLoaders."
image: /blog/structuring-the-graphql-request-context.jpg
thumbnail: /blog/structuring-the-graphql-request-context.thumb.jpg
---

There's a lot written about modeling a GraphQL schema, but less about the other half of standing up a server: **what I put into the per-request context every resolver receives.**

The context is the single most important design decision in an Apollo server, because every resolver receives it and nothing else ambient is allowed in. Get it right and your resolvers stay small, testable, and free of import-time coupling. Get it wrong and you end up reaching for module-level singletons, leaking state between requests, or firing one database query per row.

I'll use a small, recognizable e-commerce domain throughout (users, products, orders, order line items) so the examples stay concrete. My context has exactly three things on it:

```typescript
// src/server/types/RequestContext.ts
import type { PrismaClient, User } from '@prisma/client';
import { DataLoaders } from '@/server/dataLoaders';

export interface RequestContext {
  currentUser?: User;
  prisma: PrismaClient;
  dataLoaders: DataLoaders;
}
```

- `currentUser`: who's making the request, resolved from the auth token (or `undefined` if anonymous)
- `prisma`: the Prisma client the resolvers read and write through
- `dataLoaders`: a fresh set of batching loaders, created once per request

Let's build the server around that shape and then dig into *why* the last two are worth the ceremony.

## The server bootstrap

The entire server is one file. Here it is, then I'll walk through it:

```typescript
// src/server/index.ts
import '@/env';
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { Prisma, type User } from '@prisma/client';
import { GraphQLError } from 'graphql';
import { z } from 'zod';
import { jwtSecret } from '@/constants/jwt';
import { prisma } from '@/db/prisma';
import { decorateValidationError } from '@/errors/decorateValidationError';
import { RequestContext } from '@/server/types/RequestContext';
import { verifyToken } from '@/utils/authToken';
import { createDataLoaders } from './dataLoaders';
import { schema } from './schema';

const port = parseInt(process.env.PORT || '3000', 10);

const getToken = (authorizationHeader: string | undefined) => {
  if (!authorizationHeader) {
    return undefined;
  }
  const [scheme, parameters] = authorizationHeader.split(/ +/, 2);
  return scheme === 'Bearer' ? parameters : undefined;
};

const getCurrentUser = async (token: string | undefined): Promise<User | undefined> => {
  if (!token) {
    return undefined;
  }
  const payload = verifyToken({ token, secret: jwtSecret });
  const user = payload && (await prisma.user.findUnique({ where: { email: payload.email } }));
  return user ?? undefined;
};

const server = new ApolloServer<RequestContext>({
  schema,
  formatError: (formattedError, error) => {
    const { originalError } = error as GraphQLError;
    if (
      originalError instanceof Prisma.PrismaClientKnownRequestError ||
      originalError instanceof z.ZodError
    ) {
      return decorateValidationError(formattedError, originalError);
    }
    if (originalError) {
      console.error(originalError);
    }
    return formattedError;
  },
});

startStandaloneServer(server, {
  listen: { port },
  context: async ({ req }) => ({
    currentUser: await getCurrentUser(getToken(req.headers.authorization)),
    prisma,
    dataLoaders: createDataLoaders(),
  }),
})
  .then(({ url }) => {
    console.log(`🚀  Server started: ${url}`);
  })
  .catch((err) => {
    throw err;
  });
```

`new ApolloServer<RequestContext>` is typed with the context interface, so every resolver gets full IntelliSense on `context` and the compiler rejects any resolver that assumes a field the context doesn't actually provide.

The piece that runs on every single request is the `context` factory:

```typescript
context: async ({ req }) => ({
  currentUser: await getCurrentUser(getToken(req.headers.authorization)),
  prisma,
  dataLoaders: createDataLoaders(),
}),
```

Each line handles one of the three context fields, which I'll dissect throughout the remainder of this post.

## `currentUser`: resolved per request

Authentication is request-scoped by definition, so it belongs in the context factory and nowhere else. The flow is deliberately small:

1. `getToken` pulls the `Bearer <token>` value out of the `Authorization` header (returning `undefined` for anything that isn't a well-formed bearer scheme).
2. `getCurrentUser` verifies the JWT and, if valid, looks up the matching user.

```typescript
const getCurrentUser = async (token: string | undefined): Promise<User | undefined> => {
  if (!token) {
    return undefined;
  }
  const payload = verifyToken({ token, secret: jwtSecret });
  const user = payload && (await prisma.user.findUnique({ where: { email: payload.email } }));
  return user ?? undefined;
};
```

The JWT helper keeps verification honest by validating the decoded payload with Zod, so a malformed or tampered token can't smuggle a bad shape into the rest of the app:

```typescript
// src/utils/authToken.ts
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import type { User } from '@prisma/client';

type TokenPayload = Pick<User, 'id' | 'email'>;

const tokenSchema = z.object({
  id: z.string().uuid(),
  email: z.string(),
});

export const verifyToken = ({ token, secret }: { token: string; secret: string }):
  | TokenPayload
  | undefined => {
  try {
    const payload = jwt.verify(token, secret);
    return tokenSchema.parse(payload);
  } catch (err) {
    return undefined;
  }
};
```

By the time a resolver runs, `currentUser` is either a fully populated `User` record or `undefined`. Resolvers never parse headers or verify tokens themselves; they just check `context.currentUser`. An authentication middleware can lean on that, and so can a plain resolver:

```typescript
currentUser: (_parent, _args, { currentUser }) => currentUser ?? null,
```

Notice that `getCurrentUser` already goes through `prisma.user`: even authentication reads through the same client everything else does. Which brings us to the first of the two interesting context fields.

## `prisma`: why pass the client around at all?

`prisma` is just the generated [Prisma](https://www.prisma.io/) client, instantiated once and shared across the whole process:

```typescript
// src/db/prisma.ts
import { PrismaClient } from '@prisma/client';
import { isProduction } from '@/env';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (!isProduction) {
  globalForPrisma.prisma = prisma;
}
```

The client owns a connection pool and a query engine, so it's meant to be created once and reused. The `globalThis` guard just keeps hot reloads in development from spawning a fresh pool on every code change. The models themselves, and the relations between them, are declared in the Prisma schema rather than wired up in code:

```prisma
// prisma/schema.prisma (abridged)
model User {
  id     String  @id @default(uuid())
  email  String  @unique
  orders Order[]
}

model Order {
  id        String      @id @default(uuid())
  userId    String
  createdAt DateTime    @default(now())
  user      User        @relation(fields: [userId], references: [id])
  items     OrderItem[]
}

model OrderItem {
  id        String  @id @default(uuid())
  orderId   String
  productId String
  quantity  Int
  order     Order   @relation(fields: [orderId], references: [id])
  product   Product @relation(fields: [productId], references: [id])
}

model Product {
  id         String      @id @default(uuid())
  name       String
  orderItems OrderItem[]
}
```

Running `prisma generate` turns that schema into a fully typed client, with every model hanging off it as a property: `prisma.user`, `prisma.order`, `prisma.orderItem`, each exposing `findUnique`, `findMany`, `create`, and the rest.

A reasonable question: `prisma` is a plain module export, so a resolver could just `import { prisma } from '@/db/prisma'` directly. Why thread it through the context as a field at all?

A few reasons, in roughly the order I care about them:

**1. Testability and seam control.** When the data layer arrives through the context, a test can construct a context with a stand-in `prisma` (a mock client, or one pointed at a test database) and a resolver doesn't know the difference. Resolvers become pure functions of `(args, context)`: no hidden imports to intercept, no module mocking, no `jest.mock('@/db/prisma')` at the top of every test file. The dependency is *injected*, not reached for.

**2. One blessed surface.** `context.prisma` is the *only* sanctioned way into the database from a resolver. That convention makes data access trivially greppable and gives me one obvious place to add cross-cutting behavior later (query logging, a read-replica router, per-tenant scoping, all of which Prisma's client extensions make easy) without editing hundreds of import statements.

**3. Consistency with everything else on the context.** `currentUser` and `dataLoaders` are already request-scoped values handed in via context. Routing database access the same way means a resolver has a single mental model: *everything I need comes from `context`.* No special cases, no "well, the client is different."

**4. It documents intent in the type.** Because `RequestContext` declares `prisma: PrismaClient`, the context's type spells out exactly what a resolver is allowed to reach for. The capability is visible at the type level rather than implied by whatever a file happens to import.

In practice, resolvers that need direct, un-batched access (typically mutations and top-level queries) pull `prisma` straight off the context:

```typescript
// src/server/resolvers/userResolvers.ts
export const userResolvers = {
  Mutation: {
    createUser: async (_parent, { input }, { prisma }) => {
      const user = await prisma.user.create({ data: input });
      const token = createToken({ user, secret: jwtSecret });
      return { user, token };
    },
    createSession: async (_parent, { input }, { prisma }) => {
      const user = await prisma.user.findUnique({
        where: { email: input.email },
      });
      validateCreateSessionInput(input, user);
      const token = createToken({ user, secret: jwtSecret });
      return { user, token };
    },
  },
} satisfies Resolvers;
```

Reaching for `prisma` directly is the right tool when you're loading or writing a single, known record. It is *not* the right tool when you're resolving the same kind of related record once per item in a list, and that's where the third context field earns its place.

## `dataLoaders`: why a fresh batch per request?

The classic GraphQL performance trap is the **N+1 query problem**. Imagine a query that returns 50 order items and asks for each item's parent order:

```graphql
query {
  orderItems {
    id
    quantity
    order {
      id
      createdAt
    }
  }
}
```

The naive `OrderItem.order` resolver runs once per item. Fifty items means one query to fetch the items, then fifty more queries to fetch each order individually: 51 round-trips to the database for what should be two. With deeper nesting it gets quadratically worse.

[DataLoader](https://github.com/graphql/dataloader) fixes this by **batching** and **caching** within a single request. Instead of querying immediately, each `.load(id)` call registers the id; DataLoader collects every id requested during the same tick of the event loop and resolves them all in one batched query. It also memoizes: ask for the same id twice and the second call returns the cached result.

> Prisma does some batching of its own: it transparently coalesces multiple `findUnique` calls made in the same tick into a single query. That overlaps with DataLoader but doesn't replace it. Prisma's batching only covers `findUnique` lookups by id, not the filtered `findMany` loads below, and it doesn't memoize across resolver paths within a request. The two are complementary.

I create one set of loaders per request:

```typescript
// src/server/dataLoaders/index.ts
import { createOrderLoader } from './createOrderLoader';
import { createProductLoader } from './createProductLoader';

export const createDataLoaders = () => ({
  orderLoader: createOrderLoader(),
  productLoader: createProductLoader(),
});

export type DataLoaders = ReturnType<typeof createDataLoaders>;
```

A single loader is just a batch function: given a list of ids, return the records in the *same order*, with a slot for every id even if it wasn't found.

```typescript
// src/server/dataLoaders/createOrderLoader.ts
import DataLoader from 'dataloader';
import type { Order } from '@prisma/client';
import { prisma } from '@/db/prisma';

export const createOrderLoader = () =>
  new DataLoader(async (ids: readonly Order['id'][]) => {
    const orders = await prisma.order.findMany({
      where: { id: { in: [...ids] } },
    });
    return ids.map((id) => orders.find((order) => order.id === id));
  });
```

The contract DataLoader requires is subtle but important: the array you return must be **exactly the same length as `ids`, in the same order**. That's why I map back over `ids` and `find` the matching row rather than just returning whatever `findMany` produced, since the batch may come back in any order, and some ids may have no row at all.

> A nice bonus of routing loads through a function like this: the batch function is the natural place to shape each record before it reaches the schema, whether that's pulling in a relation with `include` or mapping a derived field like `lineTotal` onto every row, so resolvers receive records already in the form the schema expects.

Now the `OrderItem.order` resolver becomes a one-liner that participates in batching automatically:

```typescript
// src/server/resolvers/orderItemResolvers.ts
export const orderItemResolvers = {
  OrderItem: {
    order: composeResolvers(isAuthenticated(), async (orderItem, _args, { dataLoaders }) => {
      const order = await dataLoaders.orderLoader.load(orderItem.orderId);
      assertTruthy(order);
      return order;
    }),
  },
} satisfies Resolvers;
```

Fifty order items now produce **one** batched `WHERE id IN (...)` query for their orders instead of fifty. The resolver code reads as if it's loading a single order; DataLoader handles the coalescing underneath.

### Why *per request*, and not a singleton?

This is the detail people most often get wrong, so it's worth stating plainly: **the loaders are created inside the context factory**, which means a brand-new set is built for every request. That's not an accident or an inefficiency; it's the whole point.

DataLoader caches by id *for the lifetime of the loader*. That caching is a feature within one request (don't load the same order twice while resolving one query) and a **bug** if it outlives the request:

- A long-lived, shared loader would happily serve **stale data**: once an order is cached, a later request would keep seeing the old version even after it changed.
- It would leak data **across users and requests**. Request A loads order `123`; the cache now holds it; request B (possibly a different user) calls `.load('123')` and gets A's cached copy, sidestepping any fresh authorization or scoping.

Creating the loaders per request gives each request its own short-lived cache that is born and discarded with the request. You get the batching and de-duplication benefits exactly where they're safe, and none of the cross-request hazards. `prisma`, by contrast, holds no per-request state (just a connection pool that's built to be shared), so it's instantiated once and the same reference is handed to every context. The split is intentional: **share the stateless data layer, isolate the stateful cache.**

## The whole picture

Standing up the server comes down to one typed `ApolloServer<RequestContext>` and a context factory that, on every request:

1. **Resolves `currentUser`** from the bearer token, so authorization is just a property check.
2. **Hands over `prisma`** (the shared, stateless client) as the single, injectable, type-documented door to the database.
3. **Builds a fresh `dataLoaders`** set, so related records batch into single queries and the per-request cache can't leak across requests.

`prisma` is shared because it holds no request state; `dataLoaders` is rebuilt because it holds exactly the kind of state that must not outlive the request. Keep those two facts straight and the context does its job: every resolver is a small, testable function of `(args, context)`, with nothing ambient hiding in the imports.

## Room for improvement

This design has one more step in it, and it's the one I'd take next: drop `prisma` from the context entirely and route *every* database read through a loader.

Right now the context offers two doors to the database. Mutations and top-level queries reach for `prisma` directly; relation fields go through `dataLoaders`. That split works, but it leaves a gap, and it's the kind of gap that eventually gets tripped over by accident: nothing stops a resolver from calling `prisma.order.findUnique` inside a `.map` over a list and quietly reintroducing the exact N+1 problem the loaders exist to prevent. The batched path is *available* when it should be *mandatory*.

So make `dataLoaders.order.load(id)` the only way to read a record. Every keyed lookup is then batched and accounted for by construction, an accidental N+1 takes real effort to write, and the context shrinks back to two honest fields:

```typescript
export interface RequestContext {
  currentUser?: User;
  dataLoaders: DataLoaders;
}
```

with `prisma` demoted to an implementation detail that only the loaders module is allowed to import.

This isn't free, but the cost is bounded and worth paying:

- **Writes still need the client.** A loader batches reads; it can't `create` or `update`. So `prisma` doesn't disappear so much as move behind a small set of mutation helpers, each of which `prime`s or `clear`s the relevant loader afterward so a later read in the same request never serves the pre-write cache.
- **Filtered and paginated queries don't reduce to a single key.** A top-level `orders(filter, page)` query isn't a `.load(id)`; it's an arbitrary `findMany`. Those live on the same explicit helpers as the writes, while every by-key entity fetch, which is where N+1 actually bites, goes through a loader.
- **More loaders to write.** Each access pattern becomes its own loader. That's more boilerplate, but it's boilerplate that names every access pattern in one place and drags it into code review, which is most of the point.

The principle underneath all three is simple: the fewer raw `prisma` calls a resolver can make, the harder it is to bring back the N+1 problem the context was built to solve. Push it to the end and a resolver can't touch the database in an unbatched way even if it tries, and that's exactly the guarantee I want the context to make.

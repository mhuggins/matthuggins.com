---
title: Building Real AI Agents with the Vercel AI SDK
date: 2026-06-02
published: true
tags: [typescript, node.js, ai, security]
summary: "The Vercel AI SDK makes it easy to call a model and stream a response, but the quickstart skips the parts that matter for a real application: forwarding the user's identity to your internal services, writing a system prompt that holds up under pressure, and building tools the model can't misuse. Here's how I approach all three."
image: /blog/building-real-ai-agents-with-the-vercel-ai-sdk.jpg
thumbnail: /blog/building-real-ai-agents-with-the-vercel-ai-sdk.thumb.jpg
---

I recently built an AI-powered feature into a Node.js service that sits in front of an existing internal API, using the [Vercel AI SDK](https://ai-sdk.dev/docs/introduction) to handle the model calls. Three concerns dominated the work, and the quickstart barely scratches any of them: how does the agent act as the logged-in user when it calls internal services, how do I write a system prompt that actually constrains behavior, and how do I build tools the model can use reliably instead of confidently getting them wrong?

Here's how I approached each one. The examples assume a support-desk assistant that can search and read tickets on behalf of whoever is signed in, but the patterns apply to any agent that fronts an authenticated API.

## A Quick Orientation

If you've never used the SDK, a single-turn call with tools looks like this:

```typescript
import { generateText, stepCountIs } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

const result = await generateText({
  model: anthropic("claude-sonnet-4-6"),
  system: "You are a helpful support assistant.",
  messages: [{ role: "user", content: "Any urgent tickets for me today?" }],
  tools: {
    /* defined below */
  },
  stopWhen: stepCountIs(5),
});
```

The `tools` map and `stopWhen` parameter are what turn this from a single completion into an agent. With tools available, the model can call one, read the result, and decide what to do next. `stepCountIs(5)` lets that loop run up to five round trips before the SDK forces a final answer, which keeps a confused model from looping indefinitely. Everything below is about making `system` and `tools` trustworthy.

> Notice there's no API key in that call. The `anthropic` helper authenticates by reading an `ANTHROPIC_API_KEY` (sent as the `x-api-key` header) or an `ANTHROPIC_AUTH_TOKEN` (sent as `Authorization: Bearer`) from the environment. When you need more control, such as a custom base URL, extra headers, or your own `fetch` implementation, use `createAnthropic` to build a configured provider instead of the default instance.

Also worth noting, Anthropic is only one of many options. The SDK ships [first-party providers](https://ai-sdk.dev/providers/ai-sdk-providers) for OpenAI, Google, and others, and supports custom providers too, so switching models is mostly a one-line change.

## Acting on Behalf of the User

Most tutorials run the model with a single backend API key and call it a day. That's fine for a personal script, but it falls apart in a multi-user application. If your Node service holds one all-powerful credential and the agent decides which records to touch, then a prompt-injection payload or a simple model mistake can read or modify data the current user was never allowed to see. The agent needs to operate with exactly the permissions of the person who invoked it, no more.

When the AI service lives separately from the API it calls (a common setup, since the agent is often a new service in front of an established backend), the cleanest way to achieve this is to pass the user's identity through. The browser already sends a credential to your Node service, typically a JWT in the `Authorization` header. Your service forwards that same credential on every internal call it makes on the user's behalf:

```
Browser ──JWT──▶ Node AI service ──JWT──▶ Internal API / MCP server
```

The internal API enforces its existing authorization rules against that token exactly as it would for a direct request. The AI service adds capability without becoming a new place where permissions are decided. That's the property you want: your agent can't grant itself access it didn't already arrive with.

### Keep the Token Out of the Model's Context

Here's the part that's easy to get wrong. The credential must never reach the model. It does not belong in the system prompt, and it does not belong in a tool's input schema. If the token shows up anywhere the model can read it, you've handed a bearer credential to a system that's specifically designed to repeat text it has seen, and that text might get streamed back to the client, logged as part of a transcript, or leaked through an injection attack.

The Vercel AI SDK makes the right pattern natural, because a tool's `execute` function is just a closure. Build your tools per request and capture the user's context in that closure. The model sees only the tool's described inputs; the token rides along invisibly on the server side:

```typescript
import { tool } from "ai";
import { z } from "zod";

interface RequestContext {
  apiBaseUrl: string;
  token: string;
}

// Build a thin client bound to this user's credential.
function createApiClient({ apiBaseUrl, token }: RequestContext) {
  return {
    async get(path: string) {
      const res = await fetch(`${apiBaseUrl}${path}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error(`API request failed: ${res.status}`);
      }
      return res.json();
    },
  };
}

// A factory that produces request-scoped tools.
function buildTools(ctx: RequestContext) {
  const api = createApiClient(ctx);

  return {
    getTicket: tool({
      description: "Fetch a single support ticket by its ID.",
      inputSchema: z.object({
        ticketId: z.string().describe("The ticket ID, e.g. 'TICK-1042'."),
      }),
      execute: async ({ ticketId }) => {
        // The token is captured here, never exposed to the model.
        return api.get(`/tickets/${encodeURIComponent(ticketId)}`);
      },
    }),
  };
}
```

The model decides _which_ ticket to fetch by emitting a `ticketId`. It has no idea a token exists. The authorization boundary stays entirely on the server, and the internal API still gets to reject the request if this user can't see that ticket.

The same closure approach works if your internal calls go through an [MCP](https://modelcontextprotocol.io/) server instead of a REST API. You forward the token when establishing the MCP transport, and the tools the SDK discovers from that server inherit the user's identity for free.

### Security Considerations Worth Calling Out

Pass-through auth is the right model, but a few sharp edges deserve attention:

- **Validate the token at the edge before doing anything.** Your AI service should verify the JWT's signature, expiry, and audience on the way in rather than blindly forwarding whatever arrived. A forwarded-but-invalid token just wastes a round trip and muddies your error handling.

- **Forward to trusted internal hosts only.** The token is a bearer credential, so anything holding it can act as the user. Make sure the `apiBaseUrl` is a fixed internal endpoint and never something the model can influence through a tool argument. A tool that takes a URL parameter is an [SSRF](https://owasp.org/www-community/attacks/Server_Side_Request_Forgery) and credential-leak waiting to happen.

- **Mind the [confused deputy problem](https://en.wikipedia.org/wiki/Confused_deputy_problem).** Pass-through avoids it by design: because every internal call carries the user's own token, the agent can't be tricked into using broader privileges than the caller has. If you ever fall back to a service account for some operations, you've reintroduced the risk and need your own authorization check.

- **Scope the token to least privilege.** If your auth system supports scopes or audiences, issue the AI service a token (or exchange for one) limited to the operations the agent actually needs. A read-only assistant shouldn't be carrying a credential that can delete accounts.

- **Never log the token.** It's tempting to log full request transcripts for debugging. Redact the `Authorization` header and scrub tool execution logs, because a transcript that captures a live JWT is a credential sitting in your log aggregator.

- **Plan for expiry mid-conversation.** Agent loops and long streams can outlive a short-lived token. Decide up front whether you refresh, surface a clean "please sign in again" error, or cap session length, rather than discovering it through a confusing 401 three tool calls deep.

This is the same trust-boundary thinking I wrote about when [sandboxing untrusted player scripts](/blog/posts/building-a-secure-javascript-sandbox-for-player-bot-scripts): assume the code running inside the boundary can be coaxed into doing the wrong thing, and make sure the boundary itself can't be talked out of enforcing the rules.

## Designing the System Prompt

The system prompt is where you turn a general-purpose model into _your_ application's agent. A good one covers four things:

- **Domain context:** what the product is, what the entities mean, and what the user is generally trying to accomplish.
- **Voice and tone:** the language style the responses should adopt, so the agent sounds like part of your product rather than a generic chatbot.
- **Available actions:** a plain-language summary of what the agent can do, which orients the model toward its tools.
- **Hard restrictions:** the things it must never do, stated unambiguously.

Anthropic's write-up on [effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) is worth reading in full, but one practical takeaway is to give the prompt clear structure. Distinct section headers (or XML-style tags wrapping each section) help the model find and weight the right guidance instead of treating a wall of text as undifferentiated soup. I lean on tags because they're unambiguous about where one section ends and the next begins:

```typescript
const SYSTEM_PROMPT = dedent(`
  <role>
  You are the support assistant for Helpdesk, an internal tool the support
  team uses to triage and resolve customer tickets.
  </role>

  <voice>
  Be concise and professional. Lead with the answer, then the supporting
  detail. Avoid filler and apologies. Never invent ticket data.
  </voice>

  <capabilities>
  You can search tickets, read a single ticket, and summarize what you find.
  When a request needs data, call a tool rather than guessing.
  </capabilities>

  <restrictions>
  - Only discuss tickets the tools return. If a tool returns nothing, say so.
  - Never claim to have changed, closed, or assigned a ticket. You can only read.
  - If a request falls outside these capabilities, explain what you can do instead.
  </restrictions>
`).trim();
```

### Constant vs. Per-User Prompts

Sometimes a hard-coded constant like the one above is all you need. Other times the agent is far more useful if the prompt is pre-populated with data about the authenticated user, so the model starts the conversation already knowing who it's helping. In that case, build the prompt per request from the same context you already have on hand:

```typescript
interface User {
  name: string;
  team: string;
  role: string;
}

function buildSystemPrompt(user: User) {
  const userContext = dedent(`
    <current_user>
    Name: ${user.name}
    Team: ${user.team}
    Role: ${user.role}
    </current_user>
  `).trim();

  return [SYSTEM_PROMPT, userContext].join("\n\n");
}
```

Two cautions here:

1. Anything you inject becomes context the model treats as trusted, so only include data the user is already entitled to see; the system prompt is not a place to smuggle in privileged information.
2. Injected fields are still subject to prompt-injection if they contain user-controlled free text (a ticket subject line, say). Keep injected context to short, structured, low-risk fields, and rely on tools for anything substantial. The token, as covered above, never goes here.

## Building Reliable Tools

A tool can be two quite different things, and it's worth being deliberate about which you're building:

1. **An interface to an action**, like fetching a ticket or searching records. The `getTicket` tool above is this kind: it reaches out to the internal API and returns data.
2. **A deterministic utility** that takes structured input from the model and produces a correct, well-formed output. This second category is underused, and it's where you can dramatically improve reliability.

### Let Tools Do the Things LLMs Get Wrong

Here's a concrete example. Suppose the internal ticket API filters through query-string operators, the way [PostgREST](https://postgrest.org/en/stable/references/api/tables_views.html#operators) (the layer behind [Supabase](https://supabase.com/docs/guides/api)) does:

```
?status=eq.open&priority=in.(high,urgent)&assignee=eq.alice
```

You could describe this syntax in the system prompt and ask the model to construct the string itself, but I highly discourage this. Models are genuinely good at understanding _intent_ ("urgent open tickets assigned to Alice"), but they can be unreliable at emitting _exact syntax_ under pressure. They'll drop the `eq.` operator prefix, forget the parentheses around an `in.(...)` list, or fail to URL-encode a value that needs it. The failure is silent until the API rejects it or, worse, quietly returns the wrong rows.

The fix is to let the model express intent as structured parameters and do the string assembly in code, where it's deterministic. The [Zod](https://zod.dev/) schema becomes the contract: it constrains what the model can say, and the `execute` function encodes those clean inputs into syntactically perfect output every time.

```typescript
import { tool } from "ai";
import { z } from "zod";

const searchInput = z.object({
  status: z
    .enum(["open", "pending", "closed"])
    .optional()
    .describe("Filter to tickets in this status."),
  priority: z
    .array(z.enum(["low", "normal", "high", "urgent"]))
    .optional()
    .describe("Include tickets matching any of these priorities."),
  assignee: z
    .string()
    .optional()
    .describe("Username of the assigned agent, e.g. 'alice'."),
  createdAfter: z
    .string()
    .date()
    .optional()
    .describe("Only tickets created on or after this date (YYYY-MM-DD)."),
});

// Deterministic encoder: structured input in, valid query string out.
function encodeFilter(input: z.infer<typeof searchInput>): URLSearchParams {
  const params = new URLSearchParams();

  if (input.status) {
    params.set("status", `eq.${input.status}`);
  }
  if (input.priority?.length) {
    params.set("priority", `in.(${input.priority.join(",")})`);
  }
  if (input.assignee) {
    params.set("assignee", `eq.${input.assignee}`);
  }
  if (input.createdAfter) {
    params.set("created_at", `gte.${input.createdAfter}`);
  }

  return params;
}
```

The enums are doing real work here. The model literally cannot pass `priority: "critical"` because the schema won't allow it, so an entire class of "the model made up a value" bugs disappears before the request is ever sent. The `.date()` refinement does the same for date formatting. `URLSearchParams` then handles the percent-encoding so a value never breaks the query string. And because the encoder owns the grammar, the day the API renames a field or adds a new operator, you change one function instead of re-teaching a prompt.

### Descriptions Are Part of the Interface

One detail that's easy to overlook: the `.describe()` text on each field, and the tool's own `description`, are sent to the model as part of the tool definition. They're not code comments; they're prompt. Treat them as such. A field described as `"Username of the assigned agent, e.g. 'alice'."` gets used correctly far more often than a bare `assignee: z.string()`. This is the lowest-effort, highest-leverage place to improve tool-calling accuracy.

Wiring the encoder into a real tool just combines the two halves: the schema constrains the model, the encoder builds the string, and the request-scoped client carries the user's identity.

```typescript
function buildTools(ctx: RequestContext) {
  const api = createApiClient(ctx);

  return {
    searchTickets: tool({
      description:
        "Search support tickets by status, priority, assignee, or creation date. " +
        "Returns matching tickets. Omit a field to leave that dimension unfiltered.",
      inputSchema: searchInput,
      execute: async (input) => {
        const params = encodeFilter(input);
        const query = params.toString();
        return api.get(query ? `/tickets?${query}` : "/tickets");
      },
    }),
    // ...getTicket from earlier
  };
}
```

## Chaining Tool Calls

The `stepCountIs` loop from the orientation does more than guard against runaway models; it's what lets one tool's output become another tool's input. The model calls a tool, reads the result, and decides what to do next, so a multi-step plan ("build a filter, then search with it") falls out naturally as long as each tool is described well enough for the model to know the order.

That ordering matters when you split a single operation across tools. Imagine the encoded filter isn't just for search: the same string also drives a `countTickets` tool, an `exportTickets` tool, and a `subscribeToTickets` tool. Rather than duplicate the criteria inputs on every one of them, you can promote the encoder to a tool of its own that hands back a reusable filter string, then have each downstream tool accept that string:

```typescript
function buildTools(ctx: RequestContext) {
  const api = createApiClient(ctx);

  return {
    buildTicketFilter: tool({
      description:
        "Turn ticket search criteria into an encoded filter string. " +
        "Call this first, then pass its result to a tool that accepts a `filter`.",
      inputSchema: searchInput,
      execute: async (input) => {
        return { filter: encodeFilter(input).toString() };
      },
    }),

    searchTickets: tool({
      description: "Search support tickets matching an encoded filter string.",
      inputSchema: z.object({
        filter: z
          .string()
          .describe(
            "An encoded filter string returned by the `buildTicketFilter` " +
              "tool. Call `buildTicketFilter` first to obtain this value; " +
              "never construct or edit the string by hand.",
          ),
      }),
      execute: async ({ filter }) => {
        return api.get(filter ? `/tickets?${filter}` : "/tickets");
      },
    }),
  };
}
```

There is no formal way to declare "`searchTickets` depends on `buildTicketFilter`" to the SDK. The dependency lives entirely in that `filter` description: by telling the model where the value comes from and that it must not hand-write it, you steer the model toward calling the producer first and copying its output verbatim into the consumer. The filter string is opaque to the model, so it only has to forward a value it was handed, which is something models do reliably, rather than author the syntax itself, which is the thing they get wrong.

Two cautions keep this honest. First, don't split a tool in two unless the intermediate artifact is genuinely reused; a lone producer-consumer pair is just one tool wearing two hats, and the extra round trip costs latency for nothing. Second, a description is guidance, not a guarantee. A model (or a prompt-injection payload) can call `searchTickets` with a filter it invented instead of one `buildTicketFilter` produced, which sidesteps the enum constraints that made the encoder safe. If the filter feeds anything sensitive, the consuming tool should parse and re-validate the string against an allowlist of columns and operators rather than trust that it came from the producer. As with the request body earlier, the description shapes intent, but the boundary still has to enforce the rule.

## Putting It Together

The request handler is where the three pieces meet. Pull the token off the incoming request, verify it, build the per-user context, assemble the system prompt and tools from that context, and hand everything to the SDK:

```typescript
import { streamText, stepCountIs } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { apiBaseUrl } from "./env";

// The request body is untrusted, so validate its shape before use.
const chatRequest = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    }),
  ),
});

async function handleChat(req: Request) {
  const token = extractBearerToken(req); // throws/401s if missing
  const user = await verifyAndLoadUser(token); // edge validation

  const ctx: RequestContext = { apiBaseUrl, token };

  const { messages } = chatRequest.parse(await req.json());

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: buildSystemPrompt(user),
    messages,
    tools: buildTools(ctx),
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}
```

Notice how the responsibilities are cleanly split.

- Authentication and authorization live at the edge and inside the API client, never in the model.
- The incoming `messages` array is untrusted client input, so it gets parsed against a Zod schema before it reaches the model; a malformed or hostile body fails fast with a clear error instead of slipping into the conversation. (Note that this validates structure, not intent, so the system prompt and tool boundaries still have to assume the message content itself may be adversarial.)
- The system prompt shapes behavior and tone.
- The tools, constrained by Zod and backed by deterministic encoders, let the model express intent without giving it room to produce malformed or unauthorized requests.
- The model is left to do the one thing it's genuinely great at: understanding what the user wants and choosing which tool to reach for.

This handler is what the client talks to. If your frontend uses the [`useChat`](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat) hook from `@ai-sdk/react`, it posts messages to `/api/chat` by default, so mounting `handleChat` (or the `chatRequestHandler` wrapper from the next section) at that route is all the wiring it needs. To serve it from somewhere else, point the hook's transport at your path, for example:

```typescript
useChat({ transport: new DefaultChatTransport({ api: "/agent/chat" }) })
```

## Handling Errors

The happy path above ignores everything that can go wrong, and a production handler can't. The thing to internalize is that a streaming response has a hard boundary in the middle: once the first chunk is on the wire, the HTTP status line is already sent, so a failure after that point cannot become a `401` or a `500`. That splits error handling into two phases.

Everything _before_ the stream starts (pulling the token, verifying it, parsing the body) is ordinary request handling, and its failures map cleanly onto status codes. All of that work happens in `handleChat` before it ever reaches `streamText`, so rather than thread `try`/`catch` through the handler itself, I leave `handleChat` exactly as it was and wrap it in a thin outer function whose only job is to turn those exceptions into responses:

```typescript
async function chatRequestHandler(req: Request) {
  try {
    return await handleChat(req);
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid request body", issues: error.issues },
        { status: 400 },
      );
    }
    throw error; // unexpected: let the platform turn this into a 500
  }
}
```

Because `extractBearerToken`, `verifyAndLoadUser`, and the `chatRequest.parse` call all run before `handleChat` returns its streaming response, their failures propagate up to this wrapper and become a clean `401` or `400`. Anything unrecognized rethrows so the platform turns it into a `500`.

What this wrapper can't catch is anything that goes wrong once streaming begins. A `try`/`catch` won't see a provider rate limit, a model outage, or a tool that throws mid-response, because those run asynchronously as the SDK pulls the stream, after `handleChat` has already returned its `Response`. The SDK surfaces them through two separate `onError` callbacks instead.

`streamText`'s `onError` is your observability hook. It fires for provider, model, and tool failures during the run, which is where you log the real error, increment a metric, or page yourself:

```typescript
const result = streamText({
  // ...model, system, messages, tools, stopWhen
  onError: ({ error }) => {
    logger.error("chat stream failed", { error });
  },
});
```

`toUIMessageStreamResponse`'s `onError` decides what the _client_ sees in the stream. This one matters for security: by default the SDK masks streamed errors as a generic `"An error occurred."` precisely so a provider stack trace or internal message never reaches the browser. When you override it to give friendlier copy, return your own safe string and resist the urge to pass `error.message` straight through, which is the same "never leak internals" rule the token discussion started with, applied to the response body:

```typescript
return result.toUIMessageStreamResponse({
  onError: (error) => {
    if (APICallError.isInstance(error) && error.statusCode === 429) {
      return "The assistant is busy right now. Please try again shortly.";
    }
    return "Something went wrong while answering. Please try again.";
  },
});
```

`APICallError.isInstance` is one of several typed error helpers the SDK exports, so you can branch on a rate limit, a content filter, or a tool-input mismatch and respond appropriately instead of treating every failure the same.

That separation is the whole game. The Vercel AI SDK handles the streaming, the tool-call loop, and the provider plumbing, which frees you to spend your effort on the parts that make an agent safe and reliable in production rather than just impressive in a demo.

import { createAnthropic } from "@ai-sdk/anthropic";
import {
  APICallError,
  type ModelMessage,
  stepCountIs,
  streamText,
  type TextStreamPart,
  type ToolSet,
} from "ai";
import type { AgentEvent } from "../types";
import {
  buildTools,
  chartToolOutputSchema,
  geocodeToolOutputSchema,
  type ToolContext,
  weatherToolOutputSchema,
} from "./tools";

export const AGENT_MODELS = [
  { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
  { id: "claude-haiku-4-5", label: "Claude Haiku 4.5" },
  { id: "claude-opus-4-6", label: "Claude Opus 4.6" },
] as const;

export const DEFAULT_MODEL = AGENT_MODELS[0].id;

/** Turn an unknown error into friendly, user-safe copy (never leak internals). */
function describeError(error: unknown): string {
  if (APICallError.isInstance(error)) {
    if (error.statusCode === 401) {
      return "Your Anthropic API key was rejected (401). Double-check the key and try again.";
    }
    if (error.statusCode === 429) {
      return "Anthropic is rate-limiting this key right now (429). Please wait a moment and retry.";
    }
    if (error.statusCode === 400) {
      return "Anthropic rejected the request (400). Try rephrasing, or pick a different model.";
    }
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Something went wrong while answering. Please try again.";
}

/** Surfaces a tool whose result failed output validation as a tool error. */
function invalidToolResult(toolCallId: string, toolName: string): AgentEvent {
  return {
    type: "tool-error",
    toolCallId,
    toolName,
    error: `The ${toolName} tool returned data in an unexpected shape.`,
  };
}

/**
 * Validate a tool's output at the boundary where we receive it, the way you
 * would validate a response from a remote service. Each tool returns its raw
 * result (it stands in for the server); here we parse that result against the
 * tool's schema, and only a well-formed one becomes a typed tool-result event.
 * The per-tool switch narrows `toolName` to a literal, so each branch is fully
 * typed with no casts.
 */
function toToolResultEvent(toolCallId: string, toolName: string, output: unknown): AgentEvent {
  switch (toolName) {
    case "geocodeLocation": {
      const parsed = geocodeToolOutputSchema.safeParse(output);
      return parsed.success
        ? { type: "tool-result", toolCallId, toolName, output: parsed.data }
        : invalidToolResult(toolCallId, toolName);
    }
    case "getWeather": {
      const parsed = weatherToolOutputSchema.safeParse(output);
      return parsed.success
        ? { type: "tool-result", toolCallId, toolName, output: parsed.data }
        : invalidToolResult(toolCallId, toolName);
    }
    case "buildChartSpec": {
      const parsed = chartToolOutputSchema.safeParse(output);
      return parsed.success
        ? { type: "tool-result", toolCallId, toolName, output: parsed.data }
        : invalidToolResult(toolCallId, toolName);
    }
    default:
      return invalidToolResult(toolCallId, toolName);
  }
}

function buildTriggerEvent(onEvent: (event: AgentEvent) => void) {
  const triggerEvent = (part: TextStreamPart<ToolSet>) => {
    switch (part.type) {
      case "text-delta":
        onEvent({ type: "text-delta", text: part.text });
        break;
      case "tool-call":
        onEvent({
          type: "tool-call",
          toolCallId: part.toolCallId,
          toolName: part.toolName,
          input: part.input,
        });
        break;
      case "tool-result":
        onEvent(toToolResultEvent(part.toolCallId, part.toolName, part.output));
        break;
      case "tool-error":
        onEvent({
          type: "tool-error",
          toolCallId: part.toolCallId,
          toolName: part.toolName,
          error: describeError(part.error),
        });
        break;
      case "error":
        onEvent({ type: "error", message: describeError(part.error) });
        break;
      default:
        break;
    }
  };

  return triggerEvent;
}

export interface RunAgentParams {
  apiKey: string;
  model: string;
  system: string;
  messages: ModelMessage[];
  ctx: ToolContext;
  onEvent: (event: AgentEvent) => void;
  signal?: AbortSignal;
}

/**
 * Run one turn of the agent entirely in the browser. Builds an Anthropic
 * provider from the user-supplied key (opting into direct browser access),
 * streams the response, forwards stream parts to the UI as events, and returns
 * the new messages so the caller can thread them into the next turn.
 */
export async function runAgent({
  apiKey,
  model,
  system,
  messages,
  ctx,
  onEvent,
  signal,
}: RunAgentParams): Promise<ModelMessage[]> {
  const anthropic = createAnthropic({
    apiKey,
    headers: { "anthropic-dangerous-direct-browser-access": "true" },
  });

  const tools = buildTools(ctx);

  const result = streamText({
    model: anthropic(model),
    system,
    messages,
    tools,
    stopWhen: stepCountIs(5),
    abortSignal: signal,
    onError: ({ error }) => onEvent({ type: "error", message: describeError(error) }),
  });

  const triggerEvent = buildTriggerEvent(onEvent);

  for await (const part of result.fullStream) {
    triggerEvent(part);
  }

  const response = await result.response;
  return response.messages;
}

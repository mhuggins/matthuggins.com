import type { AgentEvent, DatasetRow, ThreadItem } from "../types";

/**
 * The chat thread plus the small bit of streaming bookkeeping it needs. The
 * thread is what the UI renders; `openTextId` tracks the assistant text bubble
 * currently being streamed into so consecutive text deltas coalesce into one
 * bubble, while a tool call closes it so following text starts a fresh bubble.
 */
export interface ThreadState {
  items: ThreadItem[];
  openTextId: string | null;
}

export const initialThreadState: ThreadState = { items: [], openTextId: null };

export interface ThreadReducerCtx {
  /** Mint a unique id for a new thread item. */
  nextId: () => string;
  /** Resolve a dataRef to its rows so a chart can be rendered inline. */
  getRows: (dataRef: string) => DatasetRow[];
}

/** Append a user message and close any open assistant text bubble. */
export function appendUserMessage(state: ThreadState, id: string, text: string): ThreadState {
  return { items: [...state.items, { kind: "user", id, text }], openTextId: null };
}

/**
 * Fold a single agent event into the thread. Pure given its ctx, so the whole
 * streaming-to-UI mapping can be unit-tested without React. `error` events don't
 * touch the thread (the caller surfaces them in a banner), so they pass through.
 */
export function reduceThread(
  state: ThreadState,
  event: AgentEvent,
  ctx: ThreadReducerCtx,
): ThreadState {
  switch (event.type) {
    case "text-delta": {
      if (state.openTextId === null) {
        const id = ctx.nextId();
        return {
          items: [...state.items, { kind: "text", id, text: event.text }],
          openTextId: id,
        };
      }
      return {
        ...state,
        items: state.items.map((item) =>
          item.kind === "text" && item.id === state.openTextId
            ? { ...item, text: `${item.text}${event.text}` }
            : item,
        ),
      };
    }
    case "tool-call":
      return {
        items: [
          ...state.items,
          {
            kind: "tool",
            id: ctx.nextId(),
            toolCallId: event.toolCallId,
            toolName: event.toolName,
            input: event.input,
            status: "running",
          },
        ],
        openTextId: null,
      };
    case "tool-result": {
      const items = state.items.map((item) =>
        item.kind === "tool" && item.toolCallId === event.toolCallId
          ? { ...item, status: "success" as const, output: event.output }
          : item,
      );
      // A buildChartSpec result carries the spec to render; its rows are resolved
      // from the data store and never re-enter the model's context.
      if (event.toolName === "buildChartSpec") {
        items.push({
          kind: "chart",
          id: ctx.nextId(),
          spec: event.output.spec,
          rows: ctx.getRows(event.output.dataRef),
        });
      }
      return { ...state, items };
    }
    case "tool-error":
      return {
        ...state,
        items: state.items.map((item) =>
          item.kind === "tool" && item.toolCallId === event.toolCallId
            ? { ...item, status: "error" as const, error: event.error }
            : item,
        ),
      };
    default:
      return state;
  }
}

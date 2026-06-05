import { describe, expect, it } from "vitest";
import type { AgentEvent } from "../types";
import {
  appendUserMessage,
  initialThreadState,
  reduceThread,
  type ThreadReducerCtx,
  type ThreadState,
} from "./thread";

/** A ctx with a deterministic id sequence and a fixed row resolver. */
function makeCtx(rows: { date: string }[] = []): ThreadReducerCtx {
  let n = 0;
  return {
    nextId: () => `m${++n}`,
    getRows: () => rows,
  };
}

/** Fold a sequence of events into a starting state. */
function run(state: ThreadState, events: AgentEvent[], ctx: ThreadReducerCtx): ThreadState {
  return events.reduce((acc, event) => reduceThread(acc, event, ctx), state);
}

describe("reduceThread", () => {
  it("coalesces consecutive text deltas into one bubble", () => {
    const ctx = makeCtx();
    const state = run(
      initialThreadState,
      [
        { type: "text-delta", text: "Hello" },
        { type: "text-delta", text: " world" },
      ],
      ctx,
    );

    expect(state.items).toEqual([{ kind: "text", id: "m1", text: "Hello world" }]);
    expect(state.openTextId).toBe("m1");
  });

  it("a tool call closes the open text bubble so following text starts a new one", () => {
    const ctx = makeCtx();
    const state = run(
      initialThreadState,
      [
        { type: "text-delta", text: "before" },
        { type: "tool-call", toolCallId: "t1", toolName: "geocodeLocation", input: {} },
        { type: "text-delta", text: "after" },
      ],
      ctx,
    );

    expect(state.items.map((i) => i.kind)).toEqual(["text", "tool", "text"]);
    const [first, , third] = state.items;
    expect(first).toMatchObject({ kind: "text", text: "before" });
    expect(third).toMatchObject({ kind: "text", text: "after" });
    expect(third.id).not.toBe(first.id);
  });

  it("marks the matching tool success and appends a chart for buildChartSpec", () => {
    const rows = [{ date: "2023-01-01" }];
    const ctx = makeCtx(rows);
    const spec = { mark: "line" as const };
    const state = run(
      initialThreadState,
      [
        { type: "tool-call", toolCallId: "t1", toolName: "buildChartSpec", input: {} },
        {
          type: "tool-result",
          toolCallId: "t1",
          toolName: "buildChartSpec",
          output: { dataRef: "ds_1", mark: "line", spec },
        },
      ],
      ctx,
    );

    const tool = state.items.find((i) => i.kind === "tool");
    expect(tool).toMatchObject({ status: "success" });
    const chart = state.items.find((i) => i.kind === "chart");
    expect(chart).toMatchObject({ kind: "chart", spec, rows });
  });

  it("marks the matching tool as errored", () => {
    const ctx = makeCtx();
    const state = run(
      initialThreadState,
      [
        { type: "tool-call", toolCallId: "t1", toolName: "getWeather", input: {} },
        { type: "tool-error", toolCallId: "t1", toolName: "getWeather", error: "boom" },
      ],
      ctx,
    );

    expect(state.items.find((i) => i.kind === "tool")).toMatchObject({
      status: "error",
      error: "boom",
    });
  });

  it("leaves the thread untouched for error events", () => {
    const ctx = makeCtx();
    const start = appendUserMessage(initialThreadState, "u1", "hi");
    const next = reduceThread(start, { type: "error", message: "nope" }, ctx);
    expect(next).toBe(start);
  });
});

describe("appendUserMessage", () => {
  it("appends the user message and closes any open text bubble", () => {
    const open: ThreadState = {
      items: [{ kind: "text", id: "m1", text: "streaming" }],
      openTextId: "m1",
    };
    const next = appendUserMessage(open, "u1", "next question");
    expect(next.openTextId).toBeNull();
    expect(next.items.at(-1)).toEqual({ kind: "user", id: "u1", text: "next question" });
  });
});

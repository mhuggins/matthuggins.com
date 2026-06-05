import { cn } from "@matthuggins/ui";
import {
  CaretRightIcon,
  CheckCircleIcon,
  SpinnerIcon,
  WarningCircleIcon,
  WrenchIcon,
} from "@phosphor-icons/react";
import { useState } from "react";
import type { ToolStatus, ToolThreadItem } from "../types";

function pretty(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function StatusIcon({ status }: { status: ToolStatus }) {
  if (status === "running") {
    return <SpinnerIcon className="size-4 animate-spin text-amber-500" weight="bold" />;
  }
  if (status === "error") {
    return <WarningCircleIcon className="size-4 text-red-500" weight="fill" />;
  }
  return <CheckCircleIcon className="size-4 text-primary" weight="fill" />;
}

function Pane({
  label,
  body,
  tone,
}: {
  label: string;
  body: string;
  tone: "intent" | "output" | "error";
}) {
  const toneColor =
    tone === "intent"
      ? "text-amber-600 dark:text-amber-400"
      : tone === "error"
        ? "text-red-600 dark:text-red-400"
        : "text-primary";
  return (
    <div className="flex flex-col gap-1">
      <span className={cn("font-semibold text-[0.6rem] uppercase tracking-wide", toneColor)}>
        {label}
      </span>
      <pre className="max-h-48 overflow-auto rounded bg-gray-900 p-2 text-[0.7rem] text-gray-100 leading-relaxed dark:bg-black/40">
        <code className="p-0">{body}</code>
      </pre>
    </div>
  );
}

/** Renders a single tool call inline in the chat thread: the model's intent
 * beside the deterministic output (or error), collapsible to keep the thread tidy. */
export function ToolMessage({ item }: { item: ToolThreadItem }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="w-[85%] shrink-0 self-start overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-white/5">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full cursor-pointer items-center gap-1.5 px-3 py-2 text-left"
      >
        <CaretRightIcon
          className={cn("size-3 shrink-0 text-gray-400 transition-transform", open && "rotate-90")}
          weight="bold"
        />
        <WrenchIcon className="size-4 shrink-0 text-primary" weight="bold" />
        <span className="font-medium font-mono text-gray-800 text-xs dark:text-white/85">
          {item.toolName}
        </span>
        <span className="ml-auto">
          <StatusIcon status={item.status} />
        </span>
      </button>

      {open && (
        <div className="flex flex-col gap-2 px-3 pb-3">
          <Pane label="intent (model)" body={pretty(item.input)} tone="intent" />
          {item.status === "error" ? (
            <Pane label="error" body={item.error ?? "Tool failed."} tone="error" />
          ) : item.status === "success" ? (
            <Pane label="output (code)" body={pretty(item.output)} tone="output" />
          ) : (
            <span className="text-gray-500 text-xs dark:text-white/40">Running…</span>
          )}
        </div>
      )}
    </div>
  );
}

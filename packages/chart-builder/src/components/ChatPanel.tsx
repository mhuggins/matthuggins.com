import { Form, withForm } from "@matthuggins/form";
import { cn } from "@matthuggins/ui";
import { PaperPlaneRightIcon } from "@phosphor-icons/react";
import { useEffect, useRef } from "react";
import type { ThreadItem } from "../types";
import { ChartView } from "./ChartView";
import { Markdown } from "./Markdown";
import { ToolMessage } from "./ToolMessage";

interface ChatThreadProps {
  thread: ThreadItem[];
  examples: string[];
  disabled: boolean;
  onPickExample: (example: string) => void;
}

/**
 * The scrollable message list. It follows new and streaming content by pinning
 * to the bottom, but only while the user is already at the bottom. If they
 * scroll up to read earlier messages, auto-scroll pauses so it doesn't yank them
 * back down, and resumes once they scroll to the bottom again.
 */
function ChatThread({ thread, examples, disabled, onPickExample }: ChatThreadProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const pinnedRef = useRef(true);
  const lastScrollTopRef = useRef(0);

  // Only a deliberate scroll *up* unpins. Content growing (e.g. a chart that
  // sizes itself after Vega embeds) and our own scroll-to-bottom calls move
  // scrollTop down or leave it, so they never get misread as "scrolled away" —
  // which is what previously stopped auto-scroll partway through a tall chart.
  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) {
      return;
    }
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceFromBottom < 24) {
      pinnedRef.current = true;
    } else if (el.scrollTop < lastScrollTopRef.current - 1) {
      pinnedRef.current = false;
    }
    lastScrollTopRef.current = el.scrollTop;
  };

  // Re-pin to the bottom whenever the content's size changes — new items,
  // streaming text, and charts that grow asynchronously after Vega embeds —
  // but only while the view is still pinned to the bottom.
  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) {
      return;
    }
    const observer = new ResizeObserver(() => {
      if (pinnedRef.current) {
        container.scrollTop = container.scrollHeight;
      }
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={cn("h-[480px]", thread.length > 0 && "overflow-y-auto")}
    >
      <div ref={contentRef} className="flex h-full min-h-[1px] flex-col gap-3">
        {thread.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2">
            <p className="text-gray-500 text-sm dark:text-white/50">
              Ask for a weather chart in plain language. Try:
            </p>
            <div className="flex flex-col items-center justify-center gap-1">
              {examples.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  disabled={disabled}
                  onClick={() => onPickExample(ex)}
                  className="cursor-pointer rounded-full border border-gray-300 bg-primary/10 px-3 py-1 text-gray-600 text-xs transition not-disabled:hover:border-primary not-disabled:hover:text-primary disabled:cursor-not-allowed disabled:bg-black/10 disabled:opacity-50 dark:border-white/15 dark:bg-white/5 dark:text-white/60 dark:disabled:bg-black/30 dark:not-disabled:hover:border-white/40 dark:not-disabled:hover:bg-black/30 dark:not-disabled:hover:text-white/80"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        ) : (
          thread.map((item) => {
            if (item.kind === "tool") {
              return <ToolMessage key={item.id} item={item} />;
            }
            if (item.kind === "chart") {
              return (
                <ChartView
                  key={item.id}
                  spec={item.spec}
                  rows={item.rows}
                  className="w-full shrink-0"
                />
              );
            }
            return (
              <div
                key={item.id}
                className={cn(
                  "max-w-[85%] shrink-0 rounded-lg px-3 py-2 text-sm",
                  item.kind === "user"
                    ? "self-end bg-primary text-white"
                    : "self-start bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-white/80",
                )}
              >
                {item.text ? <Markdown>{item.text}</Markdown> : "…"}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export const ChatPanel = withForm({
  defaultValues: { message: "" },
  props: {
    thread: [] as ThreadItem[],
    examples: [] as string[],
    disabled: false,
    className: undefined as string | undefined,
  },
  render: ({ form, thread, examples, disabled, className }) => (
    <Form form={form} className={cn("flex h-full flex-col gap-3", className)}>
      <ChatThread
        thread={thread}
        examples={examples}
        disabled={disabled}
        onPickExample={(example) => form.setFieldValue("message", example)}
      />

      <div className="flex items-end gap-2">
        <form.AppField name="message">
          {(field) => (
            <field.TextField
              className="flex-1"
              placeholder={disabled ? "Add your API key to start" : "Describe a weather chart…"}
              disabled={disabled}
              iconAfter={
                <form.Subscribe selector={(state) => state.values.message.trim().length > 0}>
                  {(hasText) => (
                    <form.IconButton
                      icon={PaperPlaneRightIcon}
                      type="submit"
                      intent="inline"
                      disabled={disabled || !hasText}
                    />
                  )}
                </form.Subscribe>
              }
            />
          )}
        </form.AppField>
      </div>
    </Form>
  ),
});

import { Form, useForm } from "@matthuggins/form";
import { ClientOnly, cn } from "@matthuggins/ui";
import type { ModelMessage } from "ai";
import { type HTMLAttributes, useCallback, useEffect, useRef, useState } from "react";
import { runAgent } from "../lib/agent";
import { DEFAULT_CONFIG } from "../lib/config";
import { createDataStore } from "../lib/dataStore";
import {
  appendUserMessage,
  initialThreadState,
  reduceThread,
  type ThreadState,
} from "../lib/thread";
import { ApiKeyFields } from "./ApiKeyFields";
import { ChatPanel } from "./ChatPanel";
import { ErrorBanner } from "./ErrorBanner";
import { SystemPromptFields } from "./SystemPromptFields";

const API_KEY_STORAGE = "chart-builder:anthropic-key";

const EXAMPLES = [
  "Plot the daily high and low temperature in Tokyo for the next 7 days as a line chart",
  "Show rainfall in Seattle for the next 10 days as a bar chart",
  "Chart the max temperature in Paris for January 2023",
];

export type ChartBuilderProps = HTMLAttributes<HTMLDivElement>;

export function ChartBuilder({ className, ...props }: ChartBuilderProps) {
  const [threadState, setThreadState] = useState<ThreadState>(initialThreadState);
  const [error, setError] = useState<string | null>(null);

  const storeRef = useRef(createDataStore());
  const historyRef = useRef<ModelMessage[]>([]);

  const idRef = useRef(0);
  const nextId = useCallback(() => {
    idRef.current += 1;
    return `m${idRef.current}`;
  }, []);
  const getRows = useCallback((dataRef: string) => storeRef.current.get(dataRef)?.rows ?? [], []);

  const configForm = useForm({ defaultValues: DEFAULT_CONFIG });

  // The API key is loaded from sessionStorage *after* mount, never during render:
  // the server has no sessionStorage, so reading it while rendering makes the
  // server and client markup disagree and breaks hydration. Start from the
  // SSR-safe default (empty), then hydrate from storage and persist changes.
  useEffect(() => {
    if (typeof sessionStorage === "undefined") {
      return;
    }
    const stored = sessionStorage.getItem(API_KEY_STORAGE);
    if (stored && !configForm.state.values.apiKey) {
      configForm.setFieldValue("apiKey", stored);
    }
    const { unsubscribe } = configForm.store.subscribe(() => {
      const key = configForm.state.values.apiKey;
      if (key) {
        sessionStorage.setItem(API_KEY_STORAGE, key);
      } else {
        sessionStorage.removeItem(API_KEY_STORAGE);
      }
    });
    return unsubscribe;
  }, [configForm]);

  const chatForm = useForm({
    defaultValues: { message: "" },
    onSubmit: async ({ value, formApi }) => {
      const text = value.message.trim();
      const { apiKey, model, systemPrompt } = configForm.state.values;
      if (!text || !apiKey) {
        return;
      }

      setError(null);
      setThreadState((state) => appendUserMessage(state, nextId(), text));
      formApi.setFieldValue("message", "");

      // Stage the user turn but only commit it to history once the run succeeds,
      // so a failed turn doesn't leave a dangling user message that gets re-sent
      // on the next submit.
      const outgoing: ModelMessage[] = [...historyRef.current, { role: "user", content: text }];

      const controller = new AbortController();

      try {
        const newMessages = await runAgent({
          apiKey,
          model,
          system: systemPrompt,
          messages: outgoing,
          signal: controller.signal,
          ctx: {
            store: storeRef.current,
            today: new Date().toISOString().slice(0, 10),
          },
          onEvent: (event) => {
            if (event.type === "error") {
              setError(event.message);
              return;
            }
            setThreadState((state) => reduceThread(state, event, { nextId, getRows }));
          },
        });

        historyRef.current = [...outgoing, ...newMessages];
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      }
    },
  });

  return (
    <div className={cn("flex flex-col gap-4", className)} {...props}>
      <ClientOnly>
        {() => (
          <>
            <div className="divide-y divide-gray-200 overflow-hidden rounded-xl border border-gray-200 bg-white dark:divide-white/10 dark:border-white/10 dark:bg-slate-900">
              <Form form={configForm} className="divide-y divide-gray-200 dark:divide-white/10">
                <ApiKeyFields form={configForm} className="p-4" />

                <chatForm.Subscribe selector={(state) => state.isSubmitting}>
                  {(isRunning) => <SystemPromptFields form={configForm} disabled={isRunning} />}
                </chatForm.Subscribe>
              </Form>

              <configForm.Subscribe selector={(state) => state.values.apiKey.trim().length === 0}>
                {(noApiKey) => (
                  <ChatPanel
                    form={chatForm}
                    thread={threadState.items}
                    examples={EXAMPLES}
                    disabled={noApiKey}
                    className="p-4"
                  />
                )}
              </configForm.Subscribe>
            </div>

            {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
          </>
        )}
      </ClientOnly>
    </div>
  );
}

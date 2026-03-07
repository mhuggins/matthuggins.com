import { cn } from "@matthuggins/ui";
import Editor from "@monaco-editor/react";
import type * as Monaco from "monaco-editor";

interface StrategyEditorProps {
  defaultValue: string;
  disabled: boolean;
  onBeforeMount: (monaco: typeof Monaco) => void;
  onMount: (editor: Monaco.editor.IStandaloneCodeEditor, monaco: typeof Monaco) => void;
}

export function StrategyEditor({
  defaultValue,
  disabled,
  onBeforeMount,
  onMount,
}: StrategyEditorProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border border-gray-300",
        disabled ? "opacity-70" : "",
      )}
    >
      <Editor
        height="420px"
        path="file:///strategy.ts"
        defaultLanguage="typescript"
        defaultValue={defaultValue}
        beforeMount={onBeforeMount}
        onMount={onMount}
        options={{
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 13,
          lineHeight: 20,
          readOnly: disabled,
          wordWrap: "on",
          padding: { top: 10, bottom: 10 },
          automaticLayout: true,
          tabSize: 2,
          renderLineHighlight: "none",
          overviewRulerLanes: 0,
          fixedOverflowWidgets: true,
        }}
      />
    </div>
  );
}

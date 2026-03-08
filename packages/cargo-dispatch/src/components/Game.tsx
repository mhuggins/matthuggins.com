import { cn } from "@matthuggins/ui";
import type * as Monaco from "monaco-editor";
import { HTMLAttributes, useCallback, useRef, useState } from "react";
import { transform } from "sucrase";
import { DEFAULT_CODE } from "../constants/code";
import { LEVELS } from "../constants/level";
import { GAME_API_TYPES } from "../generated/api";
import { useWorkerGameLoop } from "../hooks/useWorkerGameLoop";
import { calculateScore } from "../lib/calculateScore";
import { createWorld } from "../lib/createWorld";
import type { GameStatus, WorldState } from "../types";
import { APIReference } from "./APIReference";
import { CompletionOverlay } from "./CompletionOverlay";
import { ControlsBar } from "./ControlsBar";
import { ErrorPanel } from "./ErrorPanel";
import { GameView } from "./GameView";
import { LevelTimeline } from "./LevelTimeline";
import { StatusBar } from "./StatusBar";
import { StrategyEditor } from "./StrategyEditor";

export function CargoDispatch({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const [status, setStatus] = useState<GameStatus>("idle");
  const [world, setWorld] = useState<WorldState>(() => createWorld(LEVELS[0]!));
  const [errors, setErrors] = useState<string[]>([]);
  const [speed, setSpeed] = useState(1);
  const [view, setView] = useState<"game" | "code">("game");
  const [code, setCode] = useState(DEFAULT_CODE);
  const [levelIndex, setLevelIndex] = useState(0);
  const [levelResults, setLevelResults] = useState<(boolean | null)[]>(LEVELS.map(() => null));

  const monacoRef = useRef<typeof Monaco | null>(null);

  const handleMount = useCallback(
    (_editor: Monaco.editor.IStandaloneCodeEditor, monacoInstance: typeof Monaco) => {
      monacoRef.current = monacoInstance;
    },
    [],
  );

  const { boot, pause, resume, stop } = useWorkerGameLoop({
    speed,
    onBootResult: (errs) => {
      if (errs.length > 0) {
        setErrors(errs);
        setStatus("idle");
      } else {
        setErrors([]);
        setStatus("running");
        resume();
      }
    },
    onTickResult: (newWorld, errs, completed) => {
      setWorld(newWorld);
      setErrors(errs);
      if (completed) {
        const success = newWorld.completedAt! <= newWorld.level.time;
        setLevelResults((prev) => {
          const next = [...prev];
          next[levelIndex] = success;
          return next;
        });
        setStatus("completed");
        stop();
      }
    },
    onTimeout: () => {
      setErrors(["Timed out — code may contain an infinite loop."]);
      setStatus("idle");
    },
  });

  const bootLevel = useCallback(
    (index: number) => {
      let runCode: string;
      try {
        runCode = transpile(code);
      } catch (err) {
        setErrors([err instanceof Error ? err.message : String(err)]);
        return;
      }
      const newWorld = createWorld(LEVELS[index]!);
      boot(runCode, newWorld);
      setWorld(newWorld);
      setErrors([]);
    },
    [code, boot],
  );

  const handleRun = useCallback(() => {
    setView("game");
    bootLevel(levelIndex);
  }, [levelIndex, bootLevel]);

  const handlePause = useCallback(() => {
    pause();
    setStatus("paused");
  }, [pause]);

  const handleResume = useCallback(() => {
    setStatus("running");
    resume();
  }, [resume]);

  const handleReset = useCallback(() => {
    stop();
    setWorld(createWorld(LEVELS[levelIndex]!));
    setErrors([]);
    setStatus("idle");
  }, [stop, levelIndex]);

  const handleNextLevel = useCallback(() => {
    const nextIndex = levelIndex + 1;
    setLevelIndex(nextIndex);
    setStatus("idle");
    bootLevel(nextIndex);
    setView("game");
  }, [levelIndex, bootLevel]);

  const handleContinue = useCallback(() => {
    stop();
    setWorld(createWorld(LEVELS[levelIndex]!));
    setErrors([]);
    setStatus("idle");
  }, [stop, levelIndex]);

  const handleEditStrategy = useCallback(() => {
    setStatus("idle");
    setWorld(createWorld(LEVELS[levelIndex]!));
    setErrors([]);
    setView("code");
  }, [levelIndex]);

  const handleViewChange = useCallback((nextView: "game" | "code") => {
    setView(nextView);
  }, []);

  const handleEditCode = useCallback(() => {
    if (status === "running" || status === "paused") {
      handleReset();
    }
    handleViewChange("code");
  }, [status, handleReset, handleViewChange]);

  const score = status === "completed" ? calculateScore(world) : null;
  const isEditorDisabled = status === "running" || status === "paused";
  const canRun = status === "idle" || status === "completed";

  const overlay =
    score !== null ? (
      <CompletionOverlay
        score={score}
        hasNextLevel={levelIndex < LEVELS.length - 1}
        onNextLevel={handleNextLevel}
        onContinue={handleContinue}
        onEditStrategy={handleEditStrategy}
      />
    ) : null;

  return (
    <div {...props} className={cn("flex flex-col gap-2", className)}>
      <ControlsBar
        status={status}
        speed={speed}
        canRun={canRun}
        onRun={handleRun}
        onPause={handlePause}
        onResume={handleResume}
        onReset={handleReset}
        onSpeedChange={setSpeed}
        onEdit={view === "game" ? handleEditCode : undefined}
      />

      {view === "game" && (
        <>
          <LevelTimeline
            levels={LEVELS}
            currentLevelIndex={levelIndex}
            results={levelResults}
            status={status}
            className="my-2"
          />

          <StatusBar world={world} />
        </>
      )}

      <ErrorPanel errors={errors} />

      <div>
        {view === "game" ? (
          <GameView world={world} overlay={overlay} />
        ) : (
          <StrategyEditor
            value={code}
            disabled={isEditorDisabled}
            onChange={setCode}
            onBeforeMount={handleBeforeMount}
            onMount={handleMount}
          />
        )}

        <APIReference levels={LEVELS} currentLevelIndex={levelIndex} />
      </div>
    </div>
  );
}

function transpile(code: string): string {
  return transform(code, { transforms: ["typescript"], disableESTransforms: true }).code;
}

function handleBeforeMount(monacoInstance: typeof Monaco) {
  monacoInstance.languages.typescript.typescriptDefaults.setCompilerOptions({
    target: monacoInstance.languages.typescript.ScriptTarget.ES2020,
    module: monacoInstance.languages.typescript.ModuleKind.None,
    strict: false,
    allowJs: true,
    checkJs: false,
    allowNonTsExtensions: true,
    noUnusedLocals: false,
    noUnusedParameters: false,
  });

  monacoInstance.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: false,
    noSyntaxValidation: false,
    diagnosticCodesToIgnore: [6133, 6196],
  });

  monacoInstance.languages.typescript.typescriptDefaults.addExtraLib(
    GAME_API_TYPES,
    "file:///api.d.ts",
  );
}

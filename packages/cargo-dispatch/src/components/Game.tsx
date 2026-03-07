import type * as Monaco from "monaco-editor";
import { HTMLAttributes, useCallback, useRef, useState } from "react";
import { transform } from "sucrase";
import { GAME_API_TYPES } from "../generated/api";
import { useWorkerGameLoop } from "../hooks/useWorkerGameLoop";
import { calculateScore } from "../lib/calculateScore";
import { createWorld } from "../lib/createWorld";
import { LEVEL_1 } from "../lib/level";
import type { GameStatus, WorldState } from "../types";
import { APIReference } from "./APIReference";
import { CompletionPanel } from "./CompletionPanel";
import { ControlsBar } from "./ControlsBar";
import { ErrorPanel } from "./ErrorPanel";
import { GameView } from "./GameView";
import { StrategyEditor } from "./StrategyEditor";

const DEFAULT_CODE = `function init(robots: RobotController[], world: WorldAPI): void {
  robots.forEach((robot, index) => {
    robot.setLabel(\`Bot \${index + 1}\`);

    robot.onIdle(() => assignWork(robot));

    robot.onStop((stop) => {
      robot.dropOff();
      robot.pickUp();
      assignWork(robot);
    });

    world.onCargoReady((_cargo) => {
      if (robot.isIdle()) {
        assignWork(robot);
      }
    });

    function assignWork(robot: RobotController): void {
      if (robot.hasCargo()) {
        const next = robot.nextDeliveryStop();
        if (next !== null) {
          robot.goTo(next);
          return;
        }
      }

      const aisle = world.getNearestAisleWithWaiting(robot.getCurrentStop() ?? 0);
      if (aisle) {
        robot.goTo(aisle.stop);
      }
    }
  });
}`;

export function CargoDispatch(props: HTMLAttributes<HTMLDivElement>) {
  const [status, setStatus] = useState<GameStatus>("idle");
  const [world, setWorld] = useState<WorldState>(() => createWorld(LEVEL_1));
  const [errors, setErrors] = useState<string[]>([]);
  const [speed, setSpeed] = useState(1);
  const [view, setView] = useState<"game" | "code">("game");
  const [code, setCode] = useState(DEFAULT_CODE);

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
        setStatus("completed");
        stop();
      }
    },
    onTimeout: () => {
      setErrors(["Timed out — code may contain an infinite loop."]);
      setStatus("idle");
    },
  });

  const handleRun = useCallback(() => {
    let runCode: string;
    try {
      runCode = transpile(code);
      setErrors([]);
    } catch (err) {
      setErrors([err instanceof Error ? err.message : String(err)]);
      return;
    }

    const newWorld = createWorld(LEVEL_1);
    boot(runCode, newWorld);
    setWorld(newWorld);
    setView("game");
  }, [code, boot]);

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
    setWorld(createWorld(LEVEL_1));
    setErrors([]);
    setStatus("idle");
  }, [stop]);

  const handleViewChange = useCallback((nextView: "game" | "code") => {
    setView(nextView);
  }, []);

  const handleEditCode = useCallback(() => {
    if (status === "running" || status === "paused") {
      handleReset();
    }
    handleViewChange("code");
  }, [status, handleReset, handleViewChange]);

  const score = calculateScore(world);
  const isEditorDisabled = status === "running" || status === "paused";
  const canRun = status === "idle" || status === "completed";

  return (
    <div {...props}>
      <ControlsBar
        status={status}
        speed={speed}
        world={world}
        canRun={canRun}
        onRun={handleRun}
        onPause={handlePause}
        onResume={handleResume}
        onReset={handleReset}
        onSpeedChange={setSpeed}
        onEdit={view === "game" ? handleEditCode : undefined}
      />

      <ErrorPanel errors={errors} />

      {view === "game" && (
        <>
          <GameView world={world} />
          {status === "completed" && score && <CompletionPanel score={score} />}
        </>
      )}

      {view === "code" && (
        <>
          <StrategyEditor
            value={code}
            disabled={isEditorDisabled}
            onChange={setCode}
            onBeforeMount={handleBeforeMount}
            onMount={handleMount}
          />
          <APIReference />
        </>
      )}
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

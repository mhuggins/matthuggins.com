import type * as Monaco from "monaco-editor";
import { useCallback, useRef, useState } from "react";
import { GAME_API_TYPES } from "../generated/api";
import { useGameLoop } from "../hooks/useGameLoop";
import { calculateScore } from "../lib/calculateScore";
import { createWorld } from "../lib/createWorld";
import { LEVEL_1 } from "../lib/level";
import { Sandbox } from "../lib/Sandbox";
import { type EngineEvent, updateWorld } from "../lib/updateWorld";
import type { WorldState } from "../types";
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
    robot.onStop(() => assignWork(robot));

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

type GameStatus = "idle" | "running" | "paused" | "completed";

export function CargoDispatch() {
  const [status, setStatus] = useState<GameStatus>("idle");
  const [world, setWorld] = useState<WorldState | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [speed, setSpeed] = useState(1);
  const [isMonacoReady, setIsMonacoReady] = useState(false);

  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof Monaco | null>(null);
  const worldRef = useRef<WorldState | null>(null);
  const sandboxRef = useRef<Sandbox | null>(null);

  const handleMount = useCallback(
    (editor: Monaco.editor.IStandaloneCodeEditor, monacoInstance: typeof Monaco) => {
      editorRef.current = editor;
      monacoRef.current = monacoInstance;
      setIsMonacoReady(true);
    },
    [],
  );

  const handleEvent = useCallback((event: EngineEvent) => {
    const sandbox = sandboxRef.current;
    if (!sandbox) return;
    if (event.type === "robotIdle") {
      sandbox.fireRobotIdle(event.robotId);
    } else if (event.type === "robotStop") {
      sandbox.fireRobotStop(event.robotId, event.stop);
    } else if (event.type === "cargoSpawned") {
      sandbox.fireCargoReady({ aisle: event.aisle, destination: event.destination });
    }
  }, []);

  const onTick = useCallback(
    (dt: number) => {
      if (!worldRef.current) return false;
      updateWorld(worldRef.current, dt, handleEvent);

      const errs = sandboxRef.current?.getErrors() ?? [];
      if (errs.length > 0) setErrors(errs);

      setWorld({ ...worldRef.current });

      if (worldRef.current.completedAt !== null) {
        setStatus("completed");
        return false;
      }

      return true;
    },
    [handleEvent],
  );

  const { start, pause, resume, stop } = useGameLoop(speed, onTick);

  const handleRun = useCallback(async () => {
    const editor = editorRef.current;
    const monacoInstance = monacoRef.current;
    if (!editor || !monacoInstance) return;

    const sourceCode = editor.getValue();
    let runCode = sourceCode;

    const model = editor.getModel();
    if (model) {
      try {
        const getWorker = await monacoInstance.languages.typescript.getTypeScriptWorker();
        const tsWorker = await getWorker(model.uri);
        const output = await tsWorker.getEmitOutput(model.uri.toString());
        const jsFile = output.outputFiles.find((f) => f.name.endsWith(".js"));
        if (jsFile) {
          runCode = jsFile.text;
        } else {
          setErrors(["TypeScript compilation produced no output"]);
          return;
        }
      } catch (err) {
        setErrors([
          `TypeScript compilation error: ${err instanceof Error ? err.message : String(err)}`,
        ]);
        return;
      }
    }

    const newWorld = createWorld(LEVEL_1);
    const sandbox = new Sandbox();
    sandbox.boot(runCode, newWorld);

    const bootErrors = sandbox.getErrors();
    if (bootErrors.length > 0) {
      setErrors(bootErrors);
      return;
    }

    worldRef.current = newWorld;
    sandboxRef.current = sandbox;
    setErrors([]);
    setWorld({ ...newWorld });
    setStatus("running");
    start();
  }, [start]);

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
    worldRef.current = null;
    sandboxRef.current = null;
    setWorld(null);
    setErrors([]);
    setStatus("idle");
  }, [stop]);

  const score = world ? calculateScore(world) : null;
  const isEditorDisabled = status === "running" || status === "paused";
  const canRun = (status === "idle" || status === "completed") && isMonacoReady;

  return (
    <div className="mx-auto max-w-[960px] p-6 font-sans">
      <div className="mb-5">
        <h2 className="mt-0 mb-1 font-bold text-[22px] text-gray-900">Cargo Dispatch</h2>
        <p className="m-0 text-[13px] text-gray-500">
          Write a strategy to route robots through the warehouse. Level 1: {LEVEL_1.totalPackages}{" "}
          packages, {LEVEL_1.robotCount} robots, {LEVEL_1.aisleCount} aisles, {LEVEL_1.truckCount}{" "}
          trucks.
        </p>
      </div>

      <ControlsBar
        status={status}
        speed={speed}
        world={world}
        canRun={canRun}
        onRun={() => void handleRun()}
        onPause={handlePause}
        onResume={handleResume}
        onReset={handleReset}
        onSpeedChange={setSpeed}
      />

      <GameView world={world} />

      {status === "completed" && score && <CompletionPanel score={score} />}

      <ErrorPanel errors={errors} />

      <StrategyEditor
        defaultValue={DEFAULT_CODE}
        disabled={isEditorDisabled}
        onBeforeMount={handleBeforeMount}
        onMount={handleMount}
      />

      <APIReference />
    </div>
  );
}

const handleBeforeMount = (monacoInstance: typeof Monaco) => {
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
};

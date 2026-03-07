import Editor from "@monaco-editor/react";
import type * as Monaco from "monaco-editor";
import { useCallback, useEffect, useRef, useState } from "react";
import { GAME_API_TYPES } from "./api-types";
import type { EngineEvent } from "./engine";
import { updateWorld } from "./engine";
import { LEVEL_1 } from "./level";
import { GameRenderer } from "./renderer";
import { Sandbox } from "./sandbox";
import { calculateScore } from "./scoring";
import type { WorldState } from "./types";
import { createWorld } from "./world";

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
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const speedRef = useRef(1);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  const handleBeforeMount = useCallback((monacoInstance: typeof Monaco) => {
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

    // Disable validation warnings for unused vars
    monacoInstance.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
      diagnosticCodesToIgnore: [6133, 6196], // Unused variable/parameter warnings
    });

    monacoInstance.languages.typescript.typescriptDefaults.addExtraLib(
      GAME_API_TYPES,
      "file:///api.d.ts",
    );
  }, []);

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

  const tick = useCallback(
    (timestamp: number) => {
      if (!worldRef.current) return;
      if (lastTimeRef.current === null) lastTimeRef.current = timestamp;
      const rawDt = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      const dt = Math.min(rawDt, 0.1) * speedRef.current;
      updateWorld(worldRef.current, dt, handleEvent);

      const errs = sandboxRef.current?.getErrors() ?? [];
      if (errs.length > 0) {
        setErrors(errs);
      }

      setWorld({ ...worldRef.current });

      if (worldRef.current.completedAt !== null) {
        setStatus("completed");
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    },
    [handleEvent],
  );

  const handleRun = useCallback(async () => {
    const editor = editorRef.current;
    const monacoInstance = monacoRef.current;
    if (!editor || !monacoInstance) {
      return;
    }

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
    lastTimeRef.current = null;
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const handlePause = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setStatus("paused");
  }, []);

  const handleResume = useCallback(() => {
    setStatus("running");
    lastTimeRef.current = null;
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const handleReset = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    worldRef.current = null;
    sandboxRef.current = null;
    setWorld(null);
    setErrors([]);
    setStatus("idle");
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const score = world ? calculateScore(world) : null;
  const isEditorDisabled = status === "running" || status === "paused";
  const canRun = (status === "idle" || status === "completed") && isMonacoReady;

  return (
    <div
      style={{ fontFamily: "system-ui, sans-serif", maxWidth: 960, margin: "0 auto", padding: 24 }}
    >
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 700, color: "#111827" }}>
          Cargo Dispatch
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
          Write a strategy to route robots through the warehouse. Level 1: {LEVEL_1.totalPackages}{" "}
          packages, {LEVEL_1.robotCount} robots, {LEVEL_1.aisleCount} aisles, {LEVEL_1.truckCount}{" "}
          trucks.
        </p>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center" }}>
        {(status === "idle" || status === "completed") && (
          <button
            onClick={() => void handleRun()}
            disabled={!canRun}
            style={{
              padding: "6px 16px",
              background: canRun ? "#2563eb" : "#93c5fd",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: canRun ? "pointer" : "default",
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            ▶ Run
          </button>
        )}
        {status === "running" && (
          <button
            onClick={handlePause}
            style={{
              padding: "6px 16px",
              background: "#f59e0b",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            ⏸ Pause
          </button>
        )}
        {status === "paused" && (
          <button
            onClick={handleResume}
            style={{
              padding: "6px 16px",
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            ▶ Resume
          </button>
        )}
        {status !== "idle" && (
          <button
            onClick={handleReset}
            style={{
              padding: "6px 12px",
              background: "#f3f4f6",
              color: "#374151",
              border: "1px solid #d1d5db",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            ↺ Reset
          </button>
        )}

        {/* Speed control */}
        {(status === "running" || status === "paused") && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 8 }}>
            <span style={{ fontSize: 12, color: "#6b7280" }}>Speed:</span>
            {[0.5, 1, 2, 4].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                style={{
                  padding: "3px 8px",
                  fontSize: 12,
                  background: speed === s ? "#1e3a5f" : "#f3f4f6",
                  color: speed === s ? "#fff" : "#374151",
                  border: `1px solid ${speed === s ? "#1e3a5f" : "#d1d5db"}`,
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                {s}&#x00d7;
              </button>
            ))}
          </div>
        )}

        {/* Stats */}
        {world && (
          <div style={{ marginLeft: "auto", fontSize: 13, color: "#374151" }}>
            <span style={{ marginRight: 16 }}>
              <strong>{world.time.toFixed(1)}s</strong>
            </span>
            <span>
              {world.deliveredCount}/{world.level.totalPackages} delivered
            </span>
            {world.spawnedCount < world.level.totalPackages && (
              <span style={{ marginLeft: 12, color: "#6b7280", fontSize: 12 }}>
                ({world.spawnedCount} spawned)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Game view */}
      {world ? (
        <div
          style={{
            marginBottom: 16,
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <GameRenderer world={world} />
        </div>
      ) : (
        <div
          style={{
            marginBottom: 16,
            border: "1px dashed #d1d5db",
            borderRadius: 8,
            padding: 32,
            textAlign: "center",
            color: "#9ca3af",
            fontSize: 13,
          }}
        >
          Press Run to start the simulation
        </div>
      )}

      {/* Completion screen */}
      {status === "completed" && score && (
        <div
          style={{
            marginBottom: 16,
            padding: 16,
            background: "#f0fdf4",
            border: "1px solid #86efac",
            borderRadius: 8,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 15, color: "#166534", marginBottom: 8 }}>
            Level Complete!
          </div>
          <div style={{ display: "flex", gap: 24, fontSize: 13, color: "#166534" }}>
            <span>
              Time: <strong>{score.completionTime.toFixed(1)}s</strong>
            </span>
            <span>
              Avg wait: <strong>{score.averageWaitTime.toFixed(1)}s</strong>
            </span>
            <span>
              Longest wait: <strong>{score.longestWaitTime.toFixed(1)}s</strong>
            </span>
          </div>
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            background: "#fef2f2",
            border: "1px solid #fca5a5",
            borderRadius: 8,
            fontSize: 12,
            color: "#991b1b",
            fontFamily: "monospace",
          }}
        >
          {errors.map((e, i) => (
            <div key={i}>{e}</div>
          ))}
        </div>
      )}

      {/* Code editor */}
      <div
        style={{
          border: "1px solid #d1d5db",
          borderRadius: 6,
          overflow: "hidden",
          opacity: isEditorDisabled ? 0.7 : 1,
        }}
      >
        <Editor
          height="420px"
          path="file:///strategy.ts"
          defaultLanguage="typescript"
          defaultValue={DEFAULT_CODE}
          beforeMount={handleBeforeMount}
          onMount={handleMount}
          options={{
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 13,
            lineHeight: 20,
            readOnly: isEditorDisabled,
            wordWrap: "on",
            padding: { top: 10, bottom: 10 },
            automaticLayout: true,
            tabSize: 2,
            renderLineHighlight: "none",
            overviewRulerLanes: 0,
          }}
        />
      </div>

      {/* API reference */}
      <details style={{ marginTop: 12 }}>
        <summary style={{ fontSize: 12, color: "#6b7280", cursor: "pointer", userSelect: "none" }}>
          API Reference
        </summary>
        <div
          style={{
            marginTop: 8,
            padding: 12,
            background: "#f9fafb",
            borderRadius: 6,
            fontSize: 12,
            fontFamily: "monospace",
            color: "#374151",
            lineHeight: 1.8,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4 }}>robot</div>
          <div style={{ color: "#6b7280" }}>
            robot.onIdle(callback) — called when robot has no queued stops
            <br />
            robot.onStop(callback) — called after robot arrives + auto pickup/dropoff
            <br />
            robot.goTo(stop) — queue a stop to visit
            <br />
            robot.clearQueue() — remove queued stops
            <br />
            robot.getCurrentStop() → StopId | null
            <br />
            robot.hasCargo() → boolean
            <br />
            robot.getCargoCount() → number
            <br />
            robot.nextDeliveryStop() → StopId | null
            <br />
            robot.getDeliveryStops() → StopId[]
            <br />
            robot.getCargoSummary() → {"{ total, byTruck }"}
            <br />
            robot.getQueuedStops() → StopId[]
            <br />
            robot.isIdle() → boolean
            <br />
            robot.getId() → number
            <br />
            robot.setLabel(text) — set display label
          </div>
          <div style={{ fontWeight: 600, margin: "8px 0 4px" }}>world</div>
          <div style={{ color: "#6b7280" }}>
            world.getBusiestAisle() → {"{ stop, waitingCount, destinations } | null"}
            <br />
            world.getNearestAisleWithWaiting(fromStop) → aisle | null
            <br />
            world.getTotalWaitingCount() → number
            <br />
            world.getWaitingCount(stop) → number
            <br />
            world.getAisles() → aisle[]
            <br />
            world.getTrucks() → truck[]
            <br />
            world.getRobots() → robot summary[]
            <br />
            world.onCargoReady(callback) — called when cargo spawns, receives{" "}
            {"{ aisle, destination }"}
            <br />
            world.getTime() → number
          </div>
          <div style={{ fontWeight: 600, margin: "8px 0 4px" }}>Stop layout</div>
          <div style={{ color: "#6b7280" }}>
            Stops 0-{LEVEL_1.truckCount - 1}: trucks
            <br />
            Stops {LEVEL_1.truckCount}-{LEVEL_1.truckCount + LEVEL_1.aisleCount - 1}: aisles
          </div>
        </div>
      </details>
    </div>
  );
}

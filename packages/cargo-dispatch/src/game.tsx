import { useCallback, useEffect, useRef, useState } from "react";
import type { EngineEvent } from "./engine.js";
import { updateWorld } from "./engine.js";
import { LEVEL_1 } from "./level.js";
import { GameRenderer } from "./renderer.js";
import { Sandbox } from "./sandbox.js";
import { calculateScore } from "./scoring.js";
import type { WorldState } from "./types.js";
import { createWorld } from "./world.js";

const DEFAULT_CODE = `function init(robots, world) {
  robots.forEach(function(robot, index) {
    robot.setLabel("Bot " + (index + 1));

    function assignWork() {
      if (robot.hasCargo()) {
        var next = robot.nextDeliveryStop();
        if (next !== null) {
          robot.goTo(next);
          return;
        }
      }

      var aisle = world.getNearestAisleWithWaiting(robot.getCurrentStop() ?? 0);
      if (aisle) {
        robot.goTo(aisle.stop);
      }
    }

    robot.onIdle(assignWork);
    robot.onStop(assignWork);
  });
}`;

type GameStatus = "idle" | "running" | "paused" | "completed";

export function CargoDispatch() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [status, setStatus] = useState<GameStatus>("idle");
  const [world, setWorld] = useState<WorldState | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [speed, setSpeed] = useState(1);

  const worldRef = useRef<WorldState | null>(null);
  const sandboxRef = useRef<Sandbox | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const speedRef = useRef(1);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  const handleEvent = useCallback((event: EngineEvent) => {
    const sandbox = sandboxRef.current;
    if (!sandbox) return;
    if (event.type === "robotIdle") {
      sandbox.fireIdle(event.robotId);
    } else {
      sandbox.fireStop(event.robotId, event.stop);
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
      if (errs.length > 0) setErrors(errs);

      setWorld({ ...worldRef.current });

      if (worldRef.current.completedAt !== null) {
        setStatus("completed");
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    },
    [handleEvent],
  );

  const handleRun = useCallback(() => {
    const newWorld = createWorld(LEVEL_1);
    const sandbox = new Sandbox();
    sandbox.boot(code, newWorld);

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
  }, [code, tick]);

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
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const score = world ? calculateScore(world) : null;
  const isEditorDisabled = status === "running" || status === "paused";

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
            onClick={handleRun}
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
                {s}×
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
      <div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "#374151",
            marginBottom: 6,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>Strategy Code</span>
          {isEditorDisabled && (
            <span style={{ fontWeight: 400, color: "#9ca3af" }}>Reset to edit</span>
          )}
        </div>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          rows={22}
          disabled={isEditorDisabled}
          spellCheck={false}
          style={{
            width: "100%",
            fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
            fontSize: 13,
            lineHeight: 1.6,
            padding: 12,
            border: "1px solid #d1d5db",
            borderRadius: 6,
            resize: "vertical",
            background: isEditorDisabled ? "#f9fafb" : "#fff",
            color: "#1f2937",
            boxSizing: "border-box",
            outline: "none",
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
            world.getTime() → number
          </div>
          <div style={{ fontWeight: 600, margin: "8px 0 4px" }}>Stop layout</div>
          <div style={{ color: "#6b7280" }}>
            Stops 0–{LEVEL_1.truckCount - 1}: trucks | Stops {LEVEL_1.truckCount}–
            {LEVEL_1.truckCount + LEVEL_1.aisleCount - 1}: aisles
          </div>
        </div>
      </details>
    </div>
  );
}

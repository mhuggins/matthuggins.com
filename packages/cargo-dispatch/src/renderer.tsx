import type { WorldState } from "./types";

const ROW_HEIGHT = 64;
const STOP_PANEL_WIDTH = 340;
const ROBOT_LANE_WIDTH = 72;

interface Props {
  world: WorldState;
}

export function GameRenderer({ world }: Props) {
  const { trucks, aisles, robots } = world;
  const totalStops = trucks.length + aisles.length;
  const trackHeight = totalStops * ROW_HEIGHT;

  return (
    <div style={{ display: "flex", background: "#fff", minHeight: trackHeight }}>
      {/* Stop panel */}
      <div style={{ position: "relative", width: STOP_PANEL_WIDTH, flexShrink: 0 }}>
        {/* Truck rows */}
        {trucks.map((truck) => (
          <div
            key={truck.stop}
            style={{
              position: "absolute",
              top: truck.stop * ROW_HEIGHT,
              left: 0,
              right: 0,
              height: ROW_HEIGHT,
              display: "flex",
              alignItems: "center",
              padding: "0 16px",
              borderBottom: "1px solid #e5e7eb",
              background: "#f9fafb",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: truck.color,
                marginRight: 8,
                flexShrink: 0,
                boxShadow: `0 0 0 2px ${truck.color}33`,
              }}
            />
            <span style={{ fontWeight: 600, fontSize: 13, color: "#111827", minWidth: 72 }}>
              {truck.name}
            </span>
            <span style={{ fontSize: 12, color: "#6b7280", marginLeft: "auto" }}>
              {truck.deliveredCount > 0 ? `✓ ${truck.deliveredCount}` : ""}
            </span>
          </div>
        ))}

        {/* Divider between trucks and aisles */}
        <div
          style={{
            position: "absolute",
            top: trucks.length * ROW_HEIGHT,
            left: 0,
            right: 0,
            height: 3,
            background: "#d1d5db",
            zIndex: 1,
          }}
        />

        {/* Aisle rows */}
        {aisles.map((aisle, i) => (
          <div
            key={aisle.stop}
            style={{
              position: "absolute",
              top: aisle.stop * ROW_HEIGHT,
              left: 0,
              right: 0,
              height: ROW_HEIGHT,
              display: "flex",
              alignItems: "center",
              padding: "0 16px",
              borderBottom: "1px solid #f3f4f6",
              background: i % 2 === 0 ? "#fff" : "#fafafa",
            }}
          >
            <span style={{ fontSize: 13, color: "#374151", minWidth: 72 }}>Aisle {i + 1}</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 3, flex: 1, margin: "0 8px" }}>
              {aisle.waiting.slice(0, 14).map((pkg) => {
                const truck = world.trucks.find((t) => t.stop === pkg.to);
                return (
                  <div
                    key={pkg.id}
                    title={truck?.name}
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      background: pkg.color,
                      border: "1px solid rgba(0,0,0,0.12)",
                    }}
                  />
                );
              })}
              {aisle.waiting.length > 14 && (
                <span style={{ fontSize: 10, color: "#9ca3af", lineHeight: "10px" }}>
                  +{aisle.waiting.length - 14}
                </span>
              )}
            </div>
            {aisle.waiting.length > 0 && (
              <span style={{ fontSize: 11, color: "#9ca3af", flexShrink: 0 }}>
                {aisle.waiting.length}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Robot lane */}
      <div
        style={{
          position: "relative",
          width: ROBOT_LANE_WIDTH,
          flexShrink: 0,
          background: "#f3f4f6",
          borderLeft: "2px solid #d1d5db",
          borderRight: "2px solid #d1d5db",
        }}
      >
        {/* Center track */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            bottom: 0,
            width: 2,
            background: "#d1d5db",
            transform: "translateX(-50%)",
          }}
        />

        {/* Stop markers */}
        {Array.from({ length: totalStops }, (_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: "50%",
              top: i * ROW_HEIGHT + ROW_HEIGHT / 2,
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#9ca3af",
              transform: "translate(-50%, -50%)",
            }}
          />
        ))}

        {/* Robots */}
        {robots.map((robot, idx) => {
          const yPx = robot.position * ROW_HEIGHT + ROW_HEIGHT / 2;
          const xOffset = idx % 2 === 0 ? -14 : 14;
          return (
            <div
              key={robot.id}
              title={`${robot.label} | ${robot.cargo.length}/${robot.capacity} packages`}
              style={{
                position: "absolute",
                left: "50%",
                top: yPx,
                transform: `translate(calc(-50% + ${xOffset}px), -50%)`,
                zIndex: 10,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 4,
                  background: robot.state === "moving" ? "#1d4ed8" : "#1e3a5f",
                  border: `2px solid ${robot.state === "moving" ? "#60a5fa" : "#3b82f6"}`,
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                  padding: 3,
                  boxSizing: "border-box",
                  boxShadow: robot.state === "moving" ? "0 0 6px #60a5fa66" : "none",
                  transition: "background 0.1s, border-color 0.1s",
                }}
              >
                {robot.cargo.slice(0, 4).map((pkg) => (
                  <div
                    key={pkg.id}
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: 1,
                      background: pkg.color,
                      flexShrink: 0,
                    }}
                  />
                ))}
              </div>
              <div
                style={{
                  fontSize: 9,
                  color: "#6b7280",
                  marginTop: 2,
                  maxWidth: 32,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  textAlign: "center",
                }}
              >
                {robot.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Info panel */}
      <div
        style={{
          flex: 1,
          padding: "12px 16px",
          fontSize: 12,
          color: "#374151",
          borderLeft: "1px solid #e5e7eb",
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>Trucks</div>
        {trucks.map((truck) => (
          <div
            key={truck.stop}
            style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: truck.color,
                display: "inline-block",
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 11 }}>
              {truck.name}: <strong>{truck.deliveredCount}</strong>
            </span>
          </div>
        ))}

        <div style={{ fontWeight: 600, margin: "12px 0 8px", fontSize: 13 }}>Robots</div>
        {robots.map((robot) => (
          <div key={robot.id} style={{ marginBottom: 6 }}>
            <div style={{ fontSize: 11, fontWeight: 500 }}>{robot.label}</div>
            <div style={{ fontSize: 10, color: "#6b7280" }}>
              {robot.state === "idle" ? "idle" : `moving → ${robot.targetStop ?? "?"}`}
              {" | "}cargo: {robot.cargo.length}/{robot.capacity}
            </div>
            {robot.cargo.length > 0 && (
              <div style={{ display: "flex", gap: 2, marginTop: 2 }}>
                {robot.cargo.map((pkg) => (
                  <div
                    key={pkg.id}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 1,
                      background: pkg.color,
                      border: "1px solid rgba(0,0,0,0.1)",
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

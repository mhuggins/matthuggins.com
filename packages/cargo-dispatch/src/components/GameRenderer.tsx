import { cn } from "@matthuggins/ui";
import { PackageIcon, RobotIcon, TruckIcon, WarehouseIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { memo, useLayoutEffect, useRef } from "react";
import { ensureGameAnimations } from "../lib/gameAnimations";
import { playDeliverSound, playPickupSound, playSpawnSound } from "../lib/soundEffects";
import type { AisleData, GamePackage, RobotData, TruckData, WorldState } from "../types";

ensureGameAnimations();

const ROW_HEIGHT = 64;
const ROBOT_LANE_WIDTH = 56; // per robot
const ROBOT_ICON_SIZE = 32;

interface Props {
  world: WorldState;
}

export function GameRenderer({ world }: Props) {
  const { trucks, aisles, robots } = world;
  const totalStops = trucks.length + aisles.length;
  const trackHeight = totalStops * ROW_HEIGHT;

  return (
    <div className="flex bg-white" style={{ minHeight: trackHeight }}>
      {/* Stop panel */}
      <div className="relative flex-1">
        <div>
          {trucks.map((truck) => (
            <TruckRow key={truck.stop} truck={truck} />
          ))}
        </div>

        <div>
          {aisles.map((aisle, i) => (
            <AisleRow key={aisle.stop} aisle={aisle} index={i} trucks={trucks} />
          ))}
        </div>

        {/* Divider between trucks and aisles — rendered last to paint above rows */}
        <div
          className="absolute right-0 left-0 bg-gray-300"
          style={{ top: trucks.length * ROW_HEIGHT, height: 3 }}
        />
      </div>

      {/* Robot lane */}
      <div
        className="relative shrink-0 border-gray-300 border-l-2 bg-gray-100"
        style={{ width: ROBOT_LANE_WIDTH * robots.length }}
      >
        <RobotLane robots={robots} totalStops={totalStops} />

        {robots.map((robot, idx) => (
          <RobotMarker key={robot.id} robot={robot} idx={idx} />
        ))}
      </div>
    </div>
  );
}

// ─── Truck row ────────────────────────────────────────────────────────────────

function TruckRow({ truck }: { truck: TruckData }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(truck.deliveredCount);

  useLayoutEffect(() => {
    const prev = prevCountRef.current;
    prevCountRef.current = truck.deliveredCount;
    if (truck.deliveredCount <= prev) return;

    playDeliverSound();

    // Restart the CSS animation by clearing it, forcing a reflow, then re-applying
    const el = rowRef.current;
    if (el) {
      el.style.animation = "none";
      void el.offsetHeight;
      el.style.animation = "truck-flash 0.6s ease-out";
    }
  }, [truck.deliveredCount]);

  return (
    <div
      ref={rowRef}
      className="absolute right-0 left-0 flex items-center border-gray-200 bg-gray-50 px-4 [&:not(:last-child)]:border-b"
      style={{ top: truck.stop * ROW_HEIGHT, height: ROW_HEIGHT }}
    >
      <TruckIcon weight="fill" size={24} className="mr-2 shrink-0" style={{ color: truck.color }} />
      <span className="min-w-[72px] font-semibold text-[13px] text-gray-900">{truck.name}</span>
      {truck.deliveredCount > 0 && (
        <motion.span
          key={truck.deliveredCount}
          className="ml-auto flex items-center gap-1 text-gray-500 text-sm"
          initial={{ scale: 1.5 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 15 }}
        >
          <PackageIcon size={24} />
          {truck.deliveredCount}
        </motion.span>
      )}
    </div>
  );
}

// ─── Aisle row ────────────────────────────────────────────────────────────────

function AisleRow({
  aisle,
  index,
  trucks,
}: {
  aisle: AisleData;
  index: number;
  trucks: TruckData[];
}) {
  const prevWaitingRef = useRef<GamePackage[]>([]);

  useLayoutEffect(() => {
    const prev = prevWaitingRef.current;
    prevWaitingRef.current = aisle.waiting;

    const currentIds = new Set(aisle.waiting.map((p) => p.id));
    const prevIds = new Set(prev.map((p) => p.id));

    // New packages → spawn sound (one sound per batch)
    if (aisle.waiting.some((p) => !prevIds.has(p.id))) {
      playSpawnSound();
    }

    // Picked-up packages → staggered pickup sounds
    const removedCount = prev.filter((p) => !currentIds.has(p.id)).length;
    for (let i = 0; i < removedCount; i++) playPickupSound(i * 80);
  }, [aisle.waiting]);

  return (
    <div
      className={cn(
        "absolute right-0 left-0 flex items-center border-gray-200 px-4 [&:not(:last-child)]:border-b",
        index % 2 === 0 ? "bg-white" : "bg-[#fafafa]",
      )}
      style={{ top: aisle.stop * ROW_HEIGHT, height: ROW_HEIGHT }}
    >
      <WarehouseIcon weight="fill" size={24} className="mr-2 shrink-0 text-gray-600" />
      <span className="min-w-[72px] text-[13px] text-gray-700">Aisle {index + 1}</span>
      <div className="mx-2 flex flex-1 flex-wrap justify-end gap-[3px]">
        <AnimatePresence mode="popLayout">
          {aisle.waiting
            .slice(0, 16)
            .reverse()
            .map((pkg, i) => {
              const truck = trucks.find((t) => t.stop === pkg.destination);
              return (
                <motion.div
                  key={pkg.id}
                  custom={i}
                  style={{ display: "flex" }}
                  variants={{
                    hidden: { opacity: 0, scale: 0.2, rotate: -15 },
                    visible: {
                      opacity: 1,
                      scale: 1,
                      rotate: 0,
                      transition: { type: "spring", stiffness: 400, damping: 15 },
                    },
                    exit: (i: number) => ({
                      opacity: 0,
                      scale: 0.1,
                      rotate: -35,
                      transition: { duration: 0.35, ease: "easeOut", delay: i * 0.08 },
                    }),
                  }}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <PackageIcon
                    weight="fill"
                    size={24}
                    aria-label={truck?.name}
                    style={{ color: pkg.color }}
                  />
                </motion.div>
              );
            })}
        </AnimatePresence>
        {aisle.waiting.length > 16 && (
          <span className="text-[10px] text-gray-400 leading-[12px]">
            +{aisle.waiting.length - 16}
          </span>
        )}
      </div>
      {aisle.waiting.length > 0 && (
        <span className="shrink-0 text-gray-400 text-sm">{aisle.waiting.length}</span>
      )}
    </div>
  );
}

// ─── Robot lane ───────────────────────────────────────────────────────────────

// Static lane infrastructure: labels, tracks, stop markers — never changes during play
const RobotLane = memo(function RobotLane({
  robots,
  totalStops,
}: {
  robots: RobotData[];
  totalStops: number;
}) {
  return (
    <>
      {robots.map((robot, idx) => {
        const colCenter = (idx + 0.5) * ROBOT_LANE_WIDTH;
        return (
          <div
            key={robot.id}
            className="-translate-x-1/2 absolute top-0 bottom-0 w-0.5 bg-gray-300"
            style={{ left: colCenter }}
          />
        );
      })}

      {robots.map((robot, robotIdx) => {
        const colCenter = (robotIdx + 0.5) * ROBOT_LANE_WIDTH;
        return Array.from({ length: totalStops }, (_, i) => (
          <div
            key={`${robot.id}-${i}`}
            className="-translate-x-1/2 -translate-y-1/2 absolute h-1.5 w-1.5 rounded-full bg-gray-400"
            style={{ left: colCenter, top: i * ROW_HEIGHT + ROW_HEIGHT / 2 }}
          />
        ));
      })}

      {/* Header rendered last to paint above tracks and stop markers */}
      <div className="absolute top-0 right-0 left-0 flex border-gray-300 border-b bg-gray-200 py-0.5">
        {robots.map((robot) => (
          <span
            key={robot.id}
            className="overflow-hidden text-ellipsis whitespace-nowrap text-center text-[9px] text-gray-500"
            style={{ width: ROBOT_LANE_WIDTH, minWidth: ROBOT_LANE_WIDTH }}
          >
            {robot.label}
          </span>
        ))}
      </div>
    </>
  );
});

function RobotMarker({ robot, idx }: { robot: RobotData; idx: number }) {
  const colCenter = (idx + 0.5) * ROBOT_LANE_WIDTH;
  const iconSize = ROBOT_ICON_SIZE;
  const yPx = robot.position * ROW_HEIGHT + ROW_HEIGHT / 2;
  const atCapacity = robot.cargo.length >= robot.capacity;

  const cargoGroups: { color: string; count: number }[] = [];
  const seen = new Map<string, number>();
  for (const pkg of robot.cargo) {
    const existing = seen.get(pkg.color);
    if (existing !== undefined) {
      cargoGroups[existing]!.count++;
    } else {
      seen.set(pkg.color, cargoGroups.length);
      cargoGroups.push({ color: pkg.color, count: 1 });
    }
  }

  return (
    <div
      title={`${robot.label} | ${robot.cargo.length}/${robot.capacity} packages`}
      className="-translate-x-1/2 -translate-y-1/2 absolute"
      style={{ left: colCenter, top: yPx, width: iconSize, height: iconSize }}
    >
      <RobotIcon
        weight="duotone"
        size={iconSize}
        className={cn("text-[#1e3a5f]", atCapacity && "text-red-500")}
        style={
          robot.state === "idle" ? { animation: "robot-idle 2s ease-in-out infinite" } : undefined
        }
      />
      {cargoGroups.length > 0 && (
        <div className="-translate-x-1/2 absolute top-full left-1/2 mt-0.5 flex flex-wrap justify-center gap-x-1.5 gap-y-0.5 rounded bg-white/80 px-1 py-0.5 shadow-sm ring-1 ring-gray-200">
          {cargoGroups.map(({ color, count }) => (
            <span key={color} className="flex items-center gap-[3px]">
              <PackageIcon size={14} weight="fill" style={{ color }} />
              <span className="font-medium text-gray-600 text-sm leading-none">{count}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

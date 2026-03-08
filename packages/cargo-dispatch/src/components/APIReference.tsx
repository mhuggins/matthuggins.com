import { cn } from "@matthuggins/ui";
import { CaretUpIcon } from "@phosphor-icons/react";
import { useState } from "react";

interface APIMethod {
  name: string;
  args: string;
  returns: string;
  description: string;
}

interface TypeField {
  name: string;
  type: string;
  description?: string;
}

interface APIType {
  name: string;
  description?: string;
  fields: TypeField[];
}

const apiTypes: APIType[] = [
  {
    name: "AisleSummary",
    fields: [
      { name: "stop", type: "StopId" },
      { name: "waitingCount", type: "number", description: "Total packages waiting" },
      {
        name: "destinations",
        type: "Record<StopId, number>",
        description: "Package count per destination truck stop",
      },
    ],
  },
  {
    name: "CargoInfo",
    description: "Passed to onCargoReady callbacks",
    fields: [
      { name: "aisle", type: "StopId", description: "The aisle stop where the cargo spawned" },
      {
        name: "destination",
        type: "StopId",
        description: "The truck stop this cargo needs to be delivered to",
      },
    ],
  },
  {
    name: "CargoSummary",
    fields: [
      { name: "total", type: "number" },
      {
        name: "destinations",
        type: "Record<StopId, number>",
        description: "Package count per destination truck stop",
      },
    ],
  },
  {
    name: "RobotSummary",
    fields: [
      { name: "id", type: "number" },
      { name: "currentStop", type: "StopId | null" },
      { name: "targetStop", type: "StopId | null" },
      { name: "cargoCount", type: "number" },
      {
        name: "destinations",
        type: "Record<StopId, number>",
        description: "Onboard cargo count per destination",
      },
      { name: "queuedStops", type: "StopId[]" },
      { name: "idle", type: "boolean" },
      { name: "moving", type: "boolean" },
    ],
  },
  {
    name: "StopId",
    description: "A number identifying a stop — trucks are 0..truckCount-1, aisles follow",
    fields: [{ name: "(alias)", type: "number" }],
  },
  {
    name: "TruckSummary",
    fields: [
      { name: "stop", type: "StopId" },
      { name: "name", type: "string" },
      { name: "color", type: "string" },
    ],
  },
  {
    name: "WaitingPackage",
    description: "A package waiting at an aisle stop",
    fields: [
      { name: "destination", type: "StopId" },
      { name: "color", type: "string" },
    ],
  },
];

const robotMethods: APIMethod[] = [
  { name: "clearQueue", args: "", returns: "void", description: "Remove all future queued stops" },
  {
    name: "dropOff",
    args: "",
    returns: "void",
    description: "Deliver all cargo destined for the current truck stop",
  },
  {
    name: "getAvailableCapacity",
    args: "",
    returns: "number",
    description: "Remaining cargo slots",
  },
  {
    name: "getCapacity",
    args: "",
    returns: "number",
    description: "Maximum packages the robot can carry",
  },
  {
    name: "getCargoCount",
    args: "",
    returns: "number",
    description: "Number of packages currently onboard",
  },
  {
    name: "getCargoSummary",
    args: "",
    returns: "CargoSummary",
    description: "Onboard cargo grouped by destination truck stop",
  },
  {
    name: "getCurrentStop",
    args: "",
    returns: "StopId | null",
    description: "Current stop number, otherwise null when moving",
  },
  {
    name: "getDeliveryStops",
    args: "",
    returns: "StopId[]",
    description: "All unique truck stops with cargo onboard",
  },
  { name: "getId", args: "", returns: "number", description: "Unique robot ID" },
  {
    name: "getNextDeliveryStop",
    args: "",
    returns: "StopId | null",
    description: "Next truck stop to deliver to, or null if no cargo",
  },
  {
    name: "getQueuedStops",
    args: "",
    returns: "StopId[]",
    description: "Currently queued stops, not including the in-progress target",
  },
  {
    name: "getTargetStop",
    args: "",
    returns: "StopId | null",
    description: "The stop currently traveling toward, or null if idle",
  },
  {
    name: "goTo",
    args: "stop: StopId",
    returns: "void",
    description: "Queue a stop to visit; robot begins moving immediately if idle",
  },
  {
    name: "hasCargo",
    args: "",
    returns: "boolean",
    description: "Whether the robot is carrying any packages",
  },
  {
    name: "isIdle",
    args: "",
    returns: "boolean",
    description: "Whether the robot has no queued stops",
  },
  {
    name: "isMoving",
    args: "",
    returns: "boolean",
    description: "Whether the robot is currently traveling between stops",
  },
  {
    name: "onIdle",
    args: "callback: () => void",
    returns: "void",
    description: "Called when the robot has no queued stops and is ready for work",
  },
  {
    name: "onStop",
    args: "callback: (stop: StopId) => void",
    returns: "void",
    description: "Called after the robot arrives at a stop — call dropOff() and/or pickUp() here",
  },
  {
    name: "pickUp",
    args: "filter?: (pkg: WaitingPackage) => boolean",
    returns: "void",
    description: "Pick up packages at the current aisle, up to remaining capacity",
  },
  {
    name: "setLabel",
    args: "text: string",
    returns: "void",
    description: "Set a display label shown on the robot in the UI",
  },
];

const worldMethods: APIMethod[] = [
  {
    name: "getAisles",
    args: "",
    returns: "AisleSummary[]",
    description: "All aisles in the level",
  },
  {
    name: "getBusiestAisle",
    args: "",
    returns: "AisleSummary | null",
    description: "Aisle with the highest waiting package count, or null if none waiting",
  },
  {
    name: "getNearestAisleWithWaiting",
    args: "fromStop: StopId",
    returns: "AisleSummary | null",
    description: "Nearest aisle with waiting packages relative to fromStop",
  },
  {
    name: "getRobots",
    args: "",
    returns: "RobotSummary[]",
    description: "Read-only summaries of all robots",
  },
  {
    name: "getTime",
    args: "",
    returns: "number",
    description: "Current simulation time in seconds",
  },
  {
    name: "getTotalWaitingCount",
    args: "",
    returns: "number",
    description: "Total waiting packages across all aisles",
  },
  {
    name: "getTrucks",
    args: "",
    returns: "TruckSummary[]",
    description: "All trucks in the level",
  },
  {
    name: "getWaitingCount",
    args: "stop: StopId",
    returns: "number",
    description: "Waiting package count at a specific stop",
  },
  {
    name: "getWaitingPackages",
    args: "stop: StopId",
    returns: "WaitingPackage[]",
    description: "Packages waiting at a given aisle stop",
  },
  {
    name: "onCargoReady",
    args: "callback: (cargo: CargoInfo) => void",
    returns: "void",
    description: "Called whenever new cargo spawns into an aisle",
  },
];

type Section = "robot" | "world" | "types";

export function APIReference({ className }: { className?: string }) {
  const [open, setOpen] = useState<Section | null>(null);

  function toggle(section: Section) {
    setOpen((prev) => (prev === section ? null : section));
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-gray-300 bg-gray-100 p-4",
        className,
      )}
    >
      <div className="font-semibold text-gray-500 text-sm">API Reference</div>
      <div className="overflow-hidden rounded-md border border-gray-200 bg-white font-mono text-xs">
        <AccordionSection title="Robot" isOpen={open === "robot"} onToggle={() => toggle("robot")}>
          <MethodList prefix="robot" methods={robotMethods} />
        </AccordionSection>
        <AccordionSection title="World" isOpen={open === "world"} onToggle={() => toggle("world")}>
          <MethodList prefix="world" methods={worldMethods} />
        </AccordionSection>
        <AccordionSection
          title="Types"
          isOpen={open === "types"}
          onToggle={() => toggle("types")}
          last
        >
          <TypeList types={apiTypes} />
        </AccordionSection>
      </div>
    </div>
  );
}

function AccordionSection({
  title,
  isOpen,
  onToggle,
  last,
  children,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  last?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn(!last && "border-gray-200 border-b")}>
      <button
        onClick={onToggle}
        className="flex w-full cursor-pointer select-none items-center justify-between px-3 py-2 text-left text-gray-600 hover:bg-gray-50"
      >
        <span className="font-semibold">{title}</span>
        <span className="text-gray-400">
          <CaretUpIcon
            weight="bold"
            className={cn("transition-transform duration-300", isOpen && "rotate-180")}
          />
        </span>
      </button>
      {isOpen && <div className="px-6 py-3 text-gray-700 leading-[1.8]">{children}</div>}
    </div>
  );
}

function TypeList({ types }: { types: APIType[] }) {
  return (
    <div className="text-gray-500">
      {types.map((t) => (
        <div key={t.name} className="mb-2">
          <div className="text-gray-800">{t.name}</div>
          {t.description && <div className="ml-3 text-gray-400">{t.description}</div>}
          <div className="ml-3">
            {t.fields.map((f) => (
              <div key={f.name}>
                <span>{f.name}</span>
                <span className="text-gray-400">: {f.type}</span>
                {f.description && <span className="text-gray-400 italic"> — {f.description}</span>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MethodList({ prefix, methods }: { prefix: string; methods: APIMethod[] }) {
  return (
    <div className="text-gray-500">
      {methods.map((m) => (
        <div key={m.name} className="mb-2">
          <div>
            <span className="text-gray-800">
              {prefix}.{m.name}
            </span>
            <span>(</span>
            <span>{m.args}</span>
            <span>)</span>
            {m.returns !== "void" && <span className="text-gray-400">: {m.returns}</span>}
          </div>
          <div className="ml-3 text-gray-400">{m.description}</div>
        </div>
      ))}
    </div>
  );
}

import { cn } from "@matthuggins/ui";
import { CaretUpIcon } from "@phosphor-icons/react";
import { useState } from "react";

type APIMember = APIMethod | APIProperty;

interface APIMethod {
  type: "method";
  name: string;
  args: string;
  returns: string;
  description: string;
}

interface APIProperty {
  type: "property";
  name: string;
  returns: string;
  description: string;
}

interface APIType {
  name: string;
  description?: string;
  fields: APIProperty[];
}

const truckMembers: APIMember[] = [
  {
    type: "property",
    name: "id",
    returns: "StopId",
    description: "The stop number for this truck",
  },
  {
    type: "property",
    name: "color",
    returns: "string",
    description: "Truck color (hex)",
  },
  { type: "property", name: "name", returns: "string", description: "Truck name" },
];

const aisleMembers: APIMember[] = [
  {
    type: "property",
    name: "id",
    returns: "StopId",
    description: "The stop number for this aisle",
  },
  {
    type: "method",
    name: "getDestinations",
    args: "",
    returns: "Record<StopId, number>",
    description: "Package count per destination truck stop",
  },
  {
    type: "method",
    name: "getWaitingCount",
    args: "",
    returns: "number",
    description: "Total packages waiting",
  },
  {
    type: "method",
    name: "getWaitingPackages",
    args: "",
    returns: "WaitingPackage[]",
    description: "All packages currently waiting at this aisle",
  },
];

const apiTypes: APIType[] = [
  {
    name: "CargoInfo",
    description: "Passed to onCargoReady callbacks",
    fields: [
      {
        type: "property",
        name: "aisle",
        returns: "Aisle",
        description: "The aisle where the cargo spawned",
      },
      {
        type: "property",
        name: "destination",
        returns: "StopId",
        description: "The truck stop this cargo needs to be delivered to",
      },
    ],
  },
  {
    name: "CargoSummary",
    fields: [
      {
        type: "property",
        name: "total",
        returns: "number",
        description: "Number of packages ready for an aisle",
      },
      {
        type: "property",
        name: "destinations",
        returns: "Record<StopId, number>",
        description: "Package count per destination truck stop",
      },
    ],
  },
  {
    name: "StopId",
    description: "A number identifying a stop — trucks are 0..truckCount-1, aisles follow",
    fields: [],
  },
  {
    name: "WaitingPackage",
    description: "A package waiting at an aisle stop",
    fields: [
      {
        type: "property",
        name: "destination",
        returns: "StopId",
        description: "The truck stop this package needs to be delivered to",
      },
      { type: "property", name: "color", returns: "string", description: "Package color (hex)" },
    ],
  },
];

const robotMembers: APIMember[] = [
  { type: "property", name: "id", returns: "number", description: "Unique robot ID" },
  {
    type: "method",
    name: "clearQueue",
    args: "",
    returns: "void",
    description: "Remove all future queued stops",
  },
  {
    type: "method",
    name: "dropOff",
    args: "",
    returns: "void",
    description: "Deliver all cargo destined for the current truck stop",
  },
  {
    type: "method",
    name: "getAvailableCapacity",
    args: "",
    returns: "number",
    description: "Remaining cargo slots",
  },
  {
    type: "method",
    name: "getCapacity",
    args: "",
    returns: "number",
    description: "Maximum packages the robot can carry",
  },
  {
    type: "method",
    name: "getCargoCount",
    args: "",
    returns: "number",
    description: "Number of packages currently onboard",
  },
  {
    type: "method",
    name: "getCargoSummary",
    args: "",
    returns: "CargoSummary",
    description: "Onboard cargo grouped by destination truck stop",
  },
  {
    type: "method",
    name: "getCurrentStop",
    args: "",
    returns: "StopId | null",
    description: "Current stop number, otherwise null when moving",
  },
  {
    type: "method",
    name: "getDeliveryStops",
    args: "",
    returns: "StopId[]",
    description: "All unique truck stops with cargo onboard",
  },
  {
    type: "method",
    name: "getNextDeliveryStop",
    args: "",
    returns: "StopId | null",
    description: "Next truck stop to deliver to, or null if no cargo",
  },
  {
    type: "method",
    name: "getQueuedStops",
    args: "",
    returns: "StopId[]",
    description: "Currently queued stops, not including the in-progress target",
  },
  {
    type: "method",
    name: "getTargetStop",
    args: "",
    returns: "StopId | null",
    description: "The stop currently traveling toward, or null if idle",
  },
  {
    type: "method",
    name: "goTo",
    args: "stop: StopId",
    returns: "void",
    description: "Queue a stop to visit; robot begins moving immediately if idle",
  },
  {
    type: "method",
    name: "hasCargo",
    args: "",
    returns: "boolean",
    description: "Whether the robot is carrying any packages",
  },
  {
    type: "method",
    name: "isIdle",
    args: "",
    returns: "boolean",
    description: "Whether the robot has no queued stops",
  },
  {
    type: "method",
    name: "isMoving",
    args: "",
    returns: "boolean",
    description: "Whether the robot is currently traveling between stops",
  },
  {
    type: "method",
    name: "onIdle",
    args: "callback: () => void",
    returns: "void",
    description: "Called when the robot has no queued stops and is ready for work",
  },
  {
    type: "method",
    name: "onStop",
    args: "callback: (stop: StopId) => void",
    returns: "void",
    description: "Called after the robot arrives at a stop — call dropOff() and/or pickUp() here",
  },
  {
    type: "method",
    name: "pickUp",
    args: "filter?: (pkg: WaitingPackage) => boolean",
    returns: "void",
    description: "Pick up packages at the current aisle, up to remaining capacity",
  },
  {
    type: "method",
    name: "setLabel",
    args: "text: string",
    returns: "void",
    description: "Set a display label shown on the robot in the UI",
  },
];

const worldMembers: APIMethod[] = [
  {
    type: "method",
    name: "getAisles",
    args: "",
    returns: "Aisle[]",
    description: "All aisles in the level",
  },
  {
    type: "method",
    name: "getBusiestAisle",
    args: "",
    returns: "Aisle | null",
    description: "Aisle with the highest waiting package count, or null if none waiting",
  },
  {
    type: "method",
    name: "getNearestAisleWithWaiting",
    args: "fromStop: StopId",
    returns: "Aisle | null",
    description: "Nearest aisle with waiting packages relative to fromStop",
  },
  {
    type: "method",
    name: "getRobots",
    args: "",
    returns: "Robot[]",
    description: "Read-only summaries of all robots",
  },
  {
    type: "method",
    name: "getTime",
    args: "",
    returns: "number",
    description: "Current simulation time in seconds",
  },
  {
    type: "method",
    name: "getTrucks",
    args: "",
    returns: "Truck[]",
    description: "All trucks in the level",
  },
  {
    type: "method",
    name: "getWaitingCount",
    args: "",
    returns: "number",
    description: "Total waiting packages across all aisles",
  },
  {
    type: "method",
    name: "onCargoReady",
    args: "callback: (cargo: CargoInfo) => void",
    returns: "void",
    description: "Called whenever new cargo spawns into an aisle",
  },
];

type Section = "aisle" | "robot" | "truck" | "world" | "types";

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
        <AccordionSection title="Aisle" isOpen={open === "aisle"} onToggle={() => toggle("aisle")}>
          <MemberList prefix="aisle" members={aisleMembers} />
        </AccordionSection>
        <AccordionSection title="Robot" isOpen={open === "robot"} onToggle={() => toggle("robot")}>
          <MemberList prefix="robot" members={robotMembers} />
        </AccordionSection>
        <AccordionSection title="Truck" isOpen={open === "truck"} onToggle={() => toggle("truck")}>
          <MemberList prefix="truck" members={truckMembers} />
        </AccordionSection>
        <AccordionSection title="World" isOpen={open === "world"} onToggle={() => toggle("world")}>
          <MemberList prefix="world" members={worldMembers} />
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

function MemberList({ prefix, members }: { prefix: string; members: APIMember[] }) {
  return (
    <div className="text-gray-500">
      {members.map((m) => (
        <div key={m.name} className="mb-2">
          <div>
            <span className="text-gray-800">
              {prefix}.{m.name}
            </span>
            {m.type === "method" && <span>({m.args})</span>}
            {m.returns !== "void" && <span className="text-gray-400">: {m.returns}</span>}
          </div>
          <div className="ml-3 text-gray-400">{m.description}</div>
        </div>
      ))}
    </div>
  );
}

import { ArrowRightIcon } from "@phosphor-icons/react";
import { Quantity } from "measurable";
import { kilogram, liter, pound, usQuart } from "measurable/dimensions";
import { imperial, metric, usCustomary } from "measurable/systems";
import { useState } from "react";
import { formatDecimal } from "../lib/format";
import { Button } from "./Button";

const SYSTEMS = [
  { id: "metric", label: "Metric", system: metric },
  { id: "imperial", label: "Imperial", system: imperial },
  { id: "us", label: "US customary", system: usCustomary },
] as const;

type SystemId = (typeof SYSTEMS)[number]["id"];

const SAMPLES = [
  new Quantity(1.5, liter),
  new Quantity(2, usQuart),
  new Quantity(2.5, kilogram),
  new Quantity(3, pound),
];

export function SystemToggle() {
  const [systemId, setSystemId] = useState<SystemId>("metric");
  const active = SYSTEMS.find((entry) => entry.id === systemId) ?? SYSTEMS[0];

  return (
    <div className="not-prose flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium text-gray-500 text-xs uppercase tracking-wide">
          Express in
        </span>
        {SYSTEMS.map((entry) => (
          <Button
            key={entry.id}
            active={systemId === entry.id}
            onClick={() => setSystemId(entry.id)}
          >
            {entry.label}
          </Button>
        ))}
      </div>

      <ul className="flex flex-col gap-1.5 text-gray-800">
        {SAMPLES.map((sample) => (
          <li key={sample.unit.name} className="flex items-center gap-2">
            <span className="w-24 shrink-0 text-gray-500">{formatDecimal(sample)}</span>
            <ArrowRightIcon className="shrink-0 text-gray-400" size={14} />
            <span className="font-semibold tabular-nums">
              {formatDecimal(active.system.express(sample))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

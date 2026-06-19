import { ArrowRightIcon } from "@phosphor-icons/react";
import { type FormatOptions, Quantity } from "measurable";
import { cup, gram, kilometer, liter, ounce, tablespoon } from "measurable/dimensions";
import { useState } from "react";
import { keys } from "remeda";
import { Button } from "./Button";
import { Stepper } from "./Stepper";

const SAMPLE_UNITS = [gram, kilometer, cup, liter, tablespoon, ounce];

type Format = NonNullable<FormatOptions["unit"]>;

const HINTS: Record<Format, string> = {
  auto: "singular at exactly 1 (or -1), otherwise plural",
  name: "always the singular name",
  plural: "always the plural name",
  symbol: "the unit's symbol, falling back to its name (cup has none)",
};

export function FormatPlayground() {
  const [format, setFormat] = useState<Format>("auto");
  const [magnitude, setMagnitude] = useState(2);

  return (
    <div className="not-prose flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="w-20 shrink-0 font-medium text-gray-500 text-xs uppercase tracking-wide">
          Format
        </span>
        {keys(HINTS).map((option) => (
          <Button key={option} active={format === option} onClick={() => setFormat(option)}>
            {option}
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <span className="w-20 shrink-0 font-medium text-gray-500 text-xs uppercase tracking-wide">
          Magnitude
        </span>
        <Stepper value={magnitude} min={0} onChange={setMagnitude} label="magnitude" />
        <span className="text-gray-400 text-xs">{HINTS[format]}</span>
      </div>

      <ul className="flex flex-col gap-1 font-mono text-gray-800">
        {SAMPLE_UNITS.map((unit) => {
          const quantity = new Quantity(magnitude, unit);
          return (
            <li key={unit.name} className="flex items-center gap-2">
              <span className="w-32 shrink-0 text-gray-500">
                {quantity.format({ unit: "name" })}
              </span>
              <ArrowRightIcon className="shrink-0 text-gray-400" size={14} />
              <span className="font-semibold">{quantity.format({ unit: format })}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

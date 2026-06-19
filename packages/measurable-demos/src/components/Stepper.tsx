import { MinusIcon, PlusIcon } from "@phosphor-icons/react";

interface StepperProps {
  value: number;
  min?: number;
  step?: number;
  onChange: (value: number) => void;
  label?: string;
}

export function Stepper({ value, min = 1, step = 1, onChange, label }: StepperProps) {
  const clamp = (next: number) => Math.max(min, next);

  return (
    <div className="flex items-center rounded-md ring ring-gray-300">
      <button
        type="button"
        aria-label={label ? `Decrease ${label}` : "Decrease"}
        onClick={() => onChange(clamp(value - step))}
        className="px-1.5 py-1 text-gray-500 hover:text-gray-800"
      >
        <MinusIcon size={13} weight="bold" />
      </button>
      <input
        type="number"
        min={min}
        step={step}
        value={value}
        onChange={(event) => onChange(clamp(Number(event.target.value) || min))}
        className="w-12 border-gray-300 border-x bg-transparent py-1 text-center text-sm outline-none [appearance:textfield]"
      />
      <button
        type="button"
        aria-label={label ? `Increase ${label}` : "Increase"}
        onClick={() => onChange(clamp(value + step))}
        className="px-1.5 py-1 text-gray-500 hover:text-gray-800"
      >
        <PlusIcon size={13} weight="bold" />
      </button>
    </div>
  );
}

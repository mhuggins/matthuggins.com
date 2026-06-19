import { Rational } from "measurable";
import { useState } from "react";
import { formatQuantity } from "../lib/format";
import { SERVINGS_RECIPE } from "../lib/recipes";
import { Button } from "./Button";

const MULTIPLIERS = [
  { label: "½×", value: new Rational(1, 2) },
  { label: "1×", value: new Rational(1) },
  { label: "2×", value: new Rational(2) },
  { label: "3×", value: new Rational(3) },
  { label: "4×", value: new Rational(4) },
];

export function RecipeServings() {
  const [factor, setFactor] = useState<Rational>(MULTIPLIERS[1].value);

  const servings = Math.round(SERVINGS_RECIPE.servings * factor.toNumber());

  return (
    <div className="not-prose flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="font-semibold text-gray-900">{SERVINGS_RECIPE.title}</span>
          <span className="text-gray-500 text-xs">makes {servings} servings</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {MULTIPLIERS.map((multiplier) => (
            <Button
              key={multiplier.label}
              active={multiplier.value.equals(factor)}
              onClick={() => setFactor(multiplier.value)}
            >
              {multiplier.label}
            </Button>
          ))}
        </div>
      </div>

      <ul className="flex flex-col gap-1 text-gray-800">
        {SERVINGS_RECIPE.ingredients.map((ingredient) => (
          <li key={ingredient.name} className="flex items-baseline gap-2">
            <span className="w-24 shrink-0 font-semibold tabular-nums">
              {formatQuantity(ingredient.amount.times(factor))}
            </span>
            <span className="text-gray-600">{ingredient.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

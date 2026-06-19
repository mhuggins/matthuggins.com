import { useState } from "react";
import { formatDecimal } from "../lib/format";
import { combineSelected, GROCERY_RECIPES, prettyTotal } from "../lib/recipes";
import { Button } from "./Button";

export function GroceryList() {
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set());

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const chosen = GROCERY_RECIPES.filter((recipe) => selected.has(recipe.id));
  const combined = combineSelected(chosen);

  return (
    <div className="not-prose grid gap-5 rounded-lg border border-gray-200 bg-white p-4 text-sm md:grid-cols-2">
      <div className="flex flex-col gap-2">
        <span className="font-medium text-gray-500 text-xs uppercase tracking-wide">Recipes</span>
        <div className="flex flex-col gap-1.5">
          {GROCERY_RECIPES.map((recipe) => (
            <Button
              key={recipe.id}
              active={selected.has(recipe.id)}
              onClick={() => toggle(recipe.id)}
              className="w-full justify-between"
            >
              <span>{recipe.title}</span>
              <span className="text-xs opacity-70">serves {recipe.servings}</span>
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="font-medium text-gray-500 text-xs uppercase tracking-wide">
          Shopping list
        </span>
        {combined.length === 0 ? (
          <p className="text-gray-400">Select some recipes to build the list.</p>
        ) : (
          <ul className="flex flex-col gap-1 text-gray-800">
            {combined.map((ingredient) => (
              <li key={ingredient.name} className="flex items-baseline gap-2">
                <span className="w-20 shrink-0 font-semibold tabular-nums">
                  {formatDecimal(prettyTotal(ingredient.amount))}
                </span>
                <span className="text-gray-600">{ingredient.name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

import { Quantity, Rational, type Unit } from "measurable";
import { cup, gram, kilogram, liter, mass, milliliter, teaspoon } from "measurable/dimensions";
import { count, dozen, each } from "./count";

export interface Ingredient {
  readonly name: string;
  /** Every amount is a quantity, including counts (eggs are measured in `each`). */
  readonly amount: Quantity;
}

export interface Recipe {
  readonly id: string;
  readonly title: string;
  readonly servings: number;
  readonly ingredients: readonly Ingredient[];
}

const qty = (magnitude: number | Rational, unit: Unit): Quantity => new Quantity(magnitude, unit);

/**
 * A single recipe written in US cooking units (cups, teaspoons), so scaling it
 * shows off exact fractions: ¾ cup tripled is exactly 2¼ cups.
 */
export const SERVINGS_RECIPE: Recipe = {
  id: "cookies",
  title: "Chocolate chip cookies",
  servings: 24,
  ingredients: [
    { name: "all-purpose flour", amount: qty(new Rational(9, 4), cup) },
    { name: "baking soda", amount: qty(1, teaspoon) },
    { name: "salt", amount: qty(1, teaspoon) },
    { name: "butter", amount: qty(1, cup) },
    { name: "granulated sugar", amount: qty(new Rational(3, 4), cup) },
    { name: "brown sugar", amount: qty(new Rational(3, 4), cup) },
    { name: "eggs", amount: qty(2, each) },
    { name: "vanilla extract", amount: qty(1, teaspoon) },
    { name: "chocolate chips", amount: qty(2, cup) },
  ],
};

/**
 * Three breakfast recipes that deliberately overlap. Shared ingredients use the
 * same dimension but different units and magnitudes (flour in grams vs.
 * kilograms, milk in milliliters vs. cups), so a combined list has to convert
 * before it can add.
 */
export const GROCERY_RECIPES: readonly Recipe[] = [
  {
    id: "pancakes",
    title: "Pancakes",
    servings: 4,
    ingredients: [
      { name: "all-purpose flour", amount: qty(200, gram) },
      { name: "milk", amount: qty(300, milliliter) },
      { name: "eggs", amount: qty(2, each) },
      { name: "butter", amount: qty(30, gram) },
      { name: "sugar", amount: qty(25, gram) },
      { name: "baking powder", amount: qty(2, teaspoon) },
    ],
  },
  {
    id: "waffles",
    title: "Waffles",
    servings: 6,
    ingredients: [
      { name: "all-purpose flour", amount: qty(0.3, kilogram) },
      { name: "milk", amount: qty(1, cup) },
      { name: "eggs", amount: qty(3, each) },
      { name: "butter", amount: qty(100, gram) },
      { name: "sugar", amount: qty(50, gram) },
      { name: "vanilla extract", amount: qty(1, teaspoon) },
    ],
  },
  {
    id: "crepes",
    title: "Crêpes",
    servings: 4,
    ingredients: [
      { name: "all-purpose flour", amount: qty(150, gram) },
      { name: "milk", amount: qty(500, milliliter) },
      { name: "eggs", amount: qty(2, each) },
      { name: "butter", amount: qty(40, gram) },
      { name: "sugar", amount: qty(20, gram) },
      { name: "salt", amount: qty(1, teaspoon) },
    ],
  },
  {
    id: "quiche",
    title: "Quiche",
    servings: 6,
    ingredients: [
      { name: "all-purpose flour", amount: qty(175, gram) },
      { name: "milk", amount: qty(200, milliliter) },
      { name: "eggs", amount: qty(5, each) },
      { name: "butter", amount: qty(75, gram) },
      { name: "salt", amount: qty(1, teaspoon) },
    ],
  },
];

/**
 * Merge the ingredients of several recipes into one list, summing any that share
 * a name. First-seen order is preserved, and each running total stays in the
 * first contributor's unit. `plus` converts the operand first, so grams and
 * kilograms (or cups and milliliters) add without any special handling.
 */
export function combineSelected(recipes: readonly Recipe[]): Ingredient[] {
  const result: Ingredient[] = [];
  const indexByName = new Map<string, number>();

  for (const recipe of recipes) {
    for (const ingredient of recipe.ingredients) {
      const at = indexByName.get(ingredient.name);
      if (at === undefined) {
        indexByName.set(ingredient.name, result.length);
        result.push(ingredient);
      } else {
        result[at] = {
          name: ingredient.name,
          amount: result[at].amount.plus(ingredient.amount),
        };
      }
    }
  }

  return result;
}

const METRIC_VOLUME = new Set([milliliter, liter]);

/**
 * Tidy a summed quantity for display: grams roll up to kilograms past 1000 g,
 * metric volumes to liters past 1000 mL, and a dozen or more eggs to dozens.
 * Hand measures like teaspoons are left as-is. `best` picks the unit; we only
 * decide which candidates to offer.
 */
export function prettyTotal(quantity: Quantity): Quantity {
  const { dimension } = quantity.unit;

  if (dimension === count) {
    return quantity.best(each, dozen);
  }

  if (dimension === mass) {
    return quantity.best(gram, kilogram);
  }

  if (METRIC_VOLUME.has(quantity.unit)) {
    return quantity.best(milliliter, liter);
  }

  return quantity;
}

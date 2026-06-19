import { lazy } from "react";

export const FormatPlayground = lazy(async () => ({
  default: (await import("@matthuggins/measurable-demos")).FormatPlayground,
}));

export const RecipeServings = lazy(async () => ({
  default: (await import("@matthuggins/measurable-demos")).RecipeServings,
}));

export const SystemToggle = lazy(async () => ({
  default: (await import("@matthuggins/measurable-demos")).SystemToggle,
}));

export const GroceryList = lazy(async () => ({
  default: (await import("@matthuggins/measurable-demos")).GroceryList,
}));

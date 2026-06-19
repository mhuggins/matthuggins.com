import { Dimension, MeasurementSystem } from "measurable";

/**
 * A dimension for things you tally rather than measure, like eggs or slices.
 * Modeling counts as a real dimension means a counted ingredient is just a
 * `Quantity` like any other: it scales, sums, and formats through the exact
 * same code paths, with no separate "count" branch to maintain.
 */
export const count = new Dimension("count");

/**
 * The base count unit. Its symbol is intentionally empty so a count renders as a
 * bare magnitude ("7", not "7 each") and the ingredient name carries the noun.
 */
export const each = count.base("each", { symbol: "" });

/** Twelve of a thing. Lets a count roll up: 12 eggs reads as "1 dozen". */
export const dozen = count.unit("dozen", 12, { plural: "dozen" });

/**
 * A measurement system holding the count units, for parity with metric /
 * imperial / US. `express` uses it to pick the best-fit unit, so a tally of 12
 * or more comes back in dozens.
 */
export const countSystem = new MeasurementSystem("count").add(each, dozen);

import { string, oneOf, shape } from "prop-types";

const NUMERIC_VALUES = ["numeric", "2-digit"];
const WORD_VALUES = ["long", "short", "narrow"];
const MIXED_VALUES = [...NUMERIC_VALUES, ...WORD_VALUES];

// Option values can be found here:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleDateString#Parameters
const dateFormatShape = shape({
  day: oneOf(NUMERIC_VALUES),
  era: oneOf(WORD_VALUES),
  hour: oneOf(NUMERIC_VALUES),
  minute: oneOf(NUMERIC_VALUES),
  month: oneOf(MIXED_VALUES),
  second: oneOf(NUMERIC_VALUES),
  weekday: oneOf(WORD_VALUES),
  year: oneOf(NUMERIC_VALUES),
});

export default dateFormatShape;

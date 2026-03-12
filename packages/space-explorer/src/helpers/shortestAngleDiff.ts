import { wrapAngle } from "./wrapAngle";

export function shortestAngleDiff(from: number, to: number) {
  return wrapAngle(to - from);
}

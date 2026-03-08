import { cn } from "@matthuggins/ui";
import { CheckIcon, StarIcon, XIcon } from "@phosphor-icons/react";
import { Fragment } from "react";
import type { GameStatus, LevelConfig, StarRating } from "../types";

interface LevelTimelineProps {
  levels: LevelConfig[];
  currentLevelIndex: number;
  results: (StarRating | null)[];
  status: GameStatus;
  className?: string;
}

const STAR_BADGE: Record<StarRating, string> = {
  bronze: cn("text-amber-600"),
  silver: cn("text-slate-400"),
  gold: cn("text-yellow-400"),
};

export function LevelTimeline({
  levels,
  currentLevelIndex,
  results,
  status,
  className,
}: LevelTimelineProps) {
  const isActive = status === "running" || status === "paused";

  return (
    <div className={cn("mx-6 flex items-start justify-center", className)}>
      {levels.map((level, i) => {
        const result = results[i];
        const isCurrent = i === currentLevelIndex;
        const passed = result !== null;
        const failed = result === null && status === "completed" && currentLevelIndex >= i;

        let nodeClass: string;
        let labelClass: string;

        if (passed) {
          nodeClass = "border-green-400 bg-green-100 text-green-700";
          labelClass = "text-green-700";
        } else if (failed) {
          nodeClass = "border-red-400 bg-red-100 text-red-700";
          labelClass = "text-red-700";
        } else if (isCurrent) {
          nodeClass = "border-blue-500 bg-blue-100 text-blue-700";
          labelClass = "text-blue-700";
        } else {
          nodeClass = "border-gray-300 bg-gray-100 text-gray-400";
          labelClass = "text-gray-400";
        }

        return (
          <Fragment key={i}>
            {i > 0 && (
              <div
                className={cn(
                  "mt-4 h-0.5 flex-1",
                  i <= currentLevelIndex ? "bg-gray-400" : "bg-gray-200",
                )}
              />
            )}
            <div className="flex shrink-0 flex-col items-center">
              <div className="relative">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 font-bold text-xs",
                    nodeClass,
                    isCurrent &&
                      result === null &&
                      isActive &&
                      "ring-2 ring-blue-400 ring-offset-1",
                  )}
                >
                  {passed ? (
                    <CheckIcon size={14} weight="bold" />
                  ) : failed ? (
                    <XIcon size={14} weight="bold" />
                  ) : (
                    String(level.day)
                  )}
                </div>

                {/* Star count badge — shown for all completed (passed) levels */}
                {passed && result !== null && (
                  <StarIcon
                    weight="fill"
                    className={cn(
                      "-top-2 -right-2 absolute flex h-5 w-5 items-center justify-center rounded-full font-bold text-[9px] leading-none",
                      "drop-shadow-gray-500 drop-shadow-xs",
                      STAR_BADGE[result],
                    )}
                  />
                )}
              </div>
              <span className={cn("mt-1 text-[10px]", labelClass)}>Day {level.day}</span>
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}

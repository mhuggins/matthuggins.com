import { cn } from "@matthuggins/ui";
import { ArrowRightIcon, CodeIcon } from "@phosphor-icons/react";
import type { Score } from "../lib/calculateScore";
import { Button } from "./Button";

interface CompletionOverlayProps {
  score: Score;
  hasNextLevel: boolean;
  onNextLevel: () => void;
  onContinue: () => void;
  onEditStrategy: () => void;
}

export function CompletionOverlay({
  score,
  hasNextLevel,
  onNextLevel,
  onContinue,
  onEditStrategy,
}: CompletionOverlayProps) {
  const { success } = score;

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "repeating-conic-gradient(rgba(255,255,255,0.04) 0% 25%, transparent 0% 50%)",
          backgroundSize: "6px 6px",
          backgroundColor: "rgba(0,0,0,0.75)",
        }}
      />

      <div
        className={cn(
          "relative min-w-[260px] rounded-xl border-2 p-6 shadow-xl",
          success ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50",
        )}
      >
        <h3 className={cn("mb-3 font-bold text-lg", success ? "text-green-800" : "text-red-800")}>
          {success ? "Day Complete!" : "Over Time"}
        </h3>

        <dl className={cn("mb-4 space-y-1 text-sm", success ? "text-green-800" : "text-red-800")}>
          <div>
            Time:{" "}
            <strong>
              {score.completionTime.toLocaleString(undefined, {
                maximumFractionDigits: 1,
                roundingMode: "ceil",
              })}
              s
            </strong>{" "}
            <span className="opacity-60">/ goal {score.timeGoal.toFixed(0)}s</span>
          </div>
          <div>
            Avg wait: <strong>{score.averageWaitTime.toFixed(1)}s</strong>
          </div>
          <div>
            Longest wait: <strong>{score.longestWaitTime.toFixed(1)}s</strong>
          </div>
        </dl>

        <div className="text-center">
          {success ? (
            <Button
              intent="success"
              icon={ArrowRightIcon}
              onClick={hasNextLevel ? onNextLevel : onContinue}
            >
              {hasNextLevel ? "Next Day" : "Continue Tinkering"}
            </Button>
          ) : (
            <Button intent="error" icon={CodeIcon} onClick={onEditStrategy}>
              Edit Strategy
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

import { cn } from "@matthuggins/ui";
import {
  ArrowCounterClockwiseIcon,
  ArrowRightIcon,
  CodeIcon,
  StarIcon,
} from "@phosphor-icons/react";
import type { Score } from "../lib/calculateScore";
import { StarRating } from "../types";
import { Button } from "./Button";

interface CompletionOverlayProps {
  score: Score;
  hasNextLevel: boolean;
  onNextLevel: () => void;
  onContinue: () => void;
  onRetry: () => void;
  onEditStrategy: () => void;
}

interface TierStyle {
  star: string;
  card: string;
  heading: string;
  body: string;
  title: string;
}

const TIER_STYLES: Record<StarRating | "none", TierStyle> = {
  gold: {
    star: "text-yellow-400",
    card: "border-yellow-400 bg-yellow-50",
    heading: "text-yellow-800",
    body: "text-yellow-800",
    title: "Gold Star!",
  },
  silver: {
    star: "text-slate-400",
    card: "border-slate-400 bg-slate-50",
    heading: "text-slate-700",
    body: "text-slate-700",
    title: "Silver Star!",
  },
  bronze: {
    star: "text-amber-600",
    card: "border-amber-400 bg-amber-50",
    heading: "text-amber-800",
    body: "text-amber-800",
    title: "Bronze Star!",
  },
  none: {
    star: "",
    card: "border-red-300 bg-red-50",
    heading: "text-red-800",
    body: "text-red-800",
    title: "Over Time",
  },
} as const;

function Stars({ rating }: { rating: StarRating | null }) {
  return (
    <div className="mb-3 flex gap-1">
      {(["bronze", "silver", "gold"] satisfies StarRating[]).map((r) => {
        const passed = rating !== null && didSurpassRating(r, rating);

        return (
          <StarIcon
            key={r}
            size={22}
            weight={passed ? "fill" : "regular"}
            className={cn(passed ? TIER_STYLES[rating].star : "text-gray-300")}
          />
        );
      })}
    </div>
  );
}

function didSurpassRating(targetRating: StarRating, achievedRating: StarRating): boolean {
  if (targetRating === "gold") {
    return achievedRating === "gold";
  } else if (targetRating === "silver") {
    return achievedRating === "gold" || achievedRating === "silver";
  } else if (targetRating === "bronze") {
    return achievedRating === "gold" || achievedRating === "silver" || achievedRating === "bronze";
  }
  return false;
}

export function CompletionOverlay({
  score,
  hasNextLevel,
  onNextLevel,
  onContinue,
  onRetry,
  onEditStrategy,
}: CompletionOverlayProps) {
  const { starRating, completionTime, bronzeTime, silverTime, goldTime } = score;
  const passed = starRating !== null;
  const styles = TIER_STYLES[starRating ?? "none"];

  // Higher tiers that weren't achieved
  const nextTiers = [
    starRating === null && { label: "Bronze", time: bronzeTime },
    starRating === "bronze" && { label: "Silver", time: silverTime },
    starRating === "silver" && { label: "Gold", time: goldTime },
  ].filter(Boolean) as { label: string; time: number }[];

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

      <div className={cn("relative min-w-[260px] rounded-xl border-2 p-6 shadow-xl", styles.card)}>
        <h3 className={cn("mb-1 font-bold text-lg", styles.heading)}>
          {passed ? "Day Complete!" : styles.title}
        </h3>

        {passed && (
          <p className={cn("mb-1 font-semibold text-sm", styles.heading)}>{styles.title}</p>
        )}

        <Stars rating={starRating} />

        <dl className={cn("mb-4 space-y-1 text-sm", styles.body)}>
          <div>
            Time:{" "}
            <strong>
              {completionTime.toLocaleString(undefined, {
                maximumFractionDigits: 1,
                roundingMode: "ceil",
              })}
              s
            </strong>
          </div>
          <div>
            Avg wait: <strong>{score.averageWaitTime.toFixed(1)}s</strong>
          </div>
          <div>
            Longest wait: <strong>{score.longestWaitTime.toFixed(1)}s</strong>
          </div>
        </dl>

        {/* Goals for tiers not yet reached */}
        {nextTiers.length > 0 && (
          <div className={cn("mb-4 space-y-0.5 text-xs opacity-70", styles.body)}>
            {nextTiers.map(({ label, time }) => (
              <div key={label}>
                {label}: finish in <strong>&lt;{time}s</strong>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-center gap-2">
          {passed ? (
            <>
              <Button
                intent="success"
                icon={ArrowRightIcon}
                onClick={hasNextLevel ? onNextLevel : onContinue}
              >
                {hasNextLevel ? "Next Day" : "Continue Tinkering"}
              </Button>
              <Button intent="secondary" icon={ArrowCounterClockwiseIcon} onClick={onRetry}>
                Retry
              </Button>
            </>
          ) : (
            <>
              <Button intent="error" icon={CodeIcon} onClick={onEditStrategy}>
                Edit Strategy
              </Button>
              <Button intent="secondary" icon={ArrowCounterClockwiseIcon} onClick={onRetry}>
                Retry
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

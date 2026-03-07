import type { Score } from "../lib/calculateScore";

interface CompletionPanelProps {
  score: Score;
}

export function CompletionPanel({ score }: CompletionPanelProps) {
  return (
    <div className="mb-4 rounded-lg border border-green-300 bg-green-50 p-4">
      <div className="mb-2 font-bold text-[15px] text-green-800">Day Complete!</div>
      <div className="flex gap-6 text-[13px] text-green-800">
        <span>
          Time: <strong>{score.completionTime.toFixed(1)}s</strong>
        </span>
        <span>
          Avg wait: <strong>{score.averageWaitTime.toFixed(1)}s</strong>
        </span>
        <span>
          Longest wait: <strong>{score.longestWaitTime.toFixed(1)}s</strong>
        </span>
      </div>
    </div>
  );
}

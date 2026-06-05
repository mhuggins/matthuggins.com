import { WarningCircleIcon, XIcon } from "@phosphor-icons/react";

interface ErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-red-300 bg-red-50 p-3 text-red-800 text-sm dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
      <WarningCircleIcon className="mt-0.5 size-4 shrink-0" weight="bold" />
      <span className="flex-1">{message}</span>
      <button type="button" onClick={onDismiss} aria-label="Dismiss error">
        <XIcon className="size-4" weight="bold" />
      </button>
    </div>
  );
}

import { cn } from "@matthuggins/ui";
import { type FC, type ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface TooltipProps {
  children: ReactNode;
  content: string;
  position?: "top" | "bottom" | "left" | "right";
  delay?: number;
  className?: string;
  anchor?: HTMLElement | null;
}

export const Tooltip: FC<TooltipProps> = ({
  children,
  content,
  position = "top",
  delay = 0,
  className = "",
  anchor,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const updateTooltipPosition = () => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    let top = 0;
    let left = 0;

    switch (position) {
      case "top":
        top = rect.top + scrollTop - 8; // 8px offset for spacing
        left = rect.left + scrollLeft + rect.width / 2;
        break;
      case "bottom":
        top = rect.bottom + scrollTop + 8; // 8px offset for spacing
        left = rect.left + scrollLeft + rect.width / 2;
        break;
      case "left":
        top = rect.top + scrollTop + rect.height / 2;
        left = rect.left + scrollLeft - 8; // 8px offset for spacing
        break;
      case "right":
        top = rect.top + scrollTop + rect.height / 2;
        left = rect.right + scrollLeft + 8; // 8px offset for spacing
        break;
    }

    setTooltipPosition({ top, left });
  };

  const showTooltip = () => {
    updateTooltipPosition();
    const showTooltip = () => setIsVisible(true);
    if (delay <= 0) {
      showTooltip();
    } else {
      setTimeoutId(setTimeout(showTooltip, delay));
    }
  };

  const hideTooltip = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  const tooltipElement = isVisible ? (
    <div
      ref={tooltipRef}
      className={cn(
        "pointer-events-none fixed z-20 w-max max-w-64 transform break-words rounded bg-slate-800 px-2 py-1 text-center text-white text-xs",
        position === "top" && "-translate-x-1/2 -translate-y-full",
        position === "bottom" && "-translate-x-1/2",
        position === "left" && "-translate-x-full -translate-y-1/2",
        position === "right" && "-translate-y-1/2",
      )}
      style={{
        top: tooltipPosition.top,
        left: tooltipPosition.left,
      }}
      role="tooltip"
    >
      {content}
      <div
        className={cn(
          "absolute border-4 border-transparent",
          position === "top" && "-translate-x-1/2 top-full left-1/2 border-t-slate-800",
          position === "bottom" && "-translate-x-1/2 bottom-full left-1/2 border-b-slate-800",
          position === "left" && "-translate-y-1/2 top-1/2 left-full border-l-slate-800",
          position === "right" && "-translate-y-1/2 right-full bottom-1/2 border-r-slate-800",
        )}
      />
    </div>
  ) : null;

  return (
    <>
      <div
        ref={triggerRef}
        className={cn("relative inline-block", className)}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        aria-label={content}
      >
        {children}
      </div>
      {tooltipElement && createPortal(tooltipElement, anchor ?? document.body)}
    </>
  );
};

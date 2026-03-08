import { cn } from "@matthuggins/ui";
import assertNever from "assert-never";
import {
  Children,
  cloneElement,
  type FocusEventHandler,
  type MouseEventHandler,
  type ReactElement,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

interface ChildProps {
  "aria-label"?: string;
  onMouseEnter?: MouseEventHandler;
  onMouseLeave?: MouseEventHandler;
  onFocus?: FocusEventHandler;
  onBlur?: FocusEventHandler;
}

export interface TooltipProps {
  children: ReactElement<ChildProps>;
  content: string;
  position?: "top" | "bottom" | "left" | "right";
  delay?: number;
  className?: string;
  anchor?: HTMLElement | null;
}

export function Tooltip({ children, content, position = "top", delay = 0, anchor }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  const updateTooltipPosition = (target: Element) => {
    const rect = target.getBoundingClientRect();

    let top = 0;
    let left = 0;

    switch (position) {
      case "top": {
        top = rect.top - 8;
        left = rect.left + rect.width / 2;
        break;
      }
      case "bottom": {
        top = rect.bottom + 8;
        left = rect.left + rect.width / 2;
        break;
      }
      case "left": {
        top = rect.top + rect.height / 2;
        left = rect.left - 8;
        break;
      }
      case "right": {
        top = rect.top + rect.height / 2;
        left = rect.right + 8;
        break;
      }
      default:
        return assertNever(position);
    }

    setTooltipPosition({ top, left });
  };

  const showTooltip = (target: Element) => {
    updateTooltipPosition(target);
    const doShow = () => setIsVisible(true);
    if (delay <= 0) {
      doShow();
    } else {
      setTimeoutId(setTimeout(doShow, delay));
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

  // Cast to ChildProps to enable typed prop access and cloneElement merging.
  // The constraint is minimal — any element with standard HTML attributes qualifies.
  const child = Children.only(children);

  const childWithHandlers = cloneElement(child, {
    "aria-label": content,
    onMouseEnter: (e) => {
      showTooltip(e.currentTarget);
      child.props.onMouseEnter?.(e);
    },
    onMouseLeave: (e) => {
      hideTooltip();
      child.props.onMouseLeave?.(e);
    },
    onFocus: (e) => {
      showTooltip(e.currentTarget);
      child.props.onFocus?.(e);
    },
    onBlur: (e) => {
      hideTooltip();
      child.props.onBlur?.(e);
    },
  });

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
      {childWithHandlers}
      {tooltipElement && createPortal(tooltipElement, anchor ?? document.body)}
    </>
  );
}

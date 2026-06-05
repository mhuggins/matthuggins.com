import {
  arrow,
  autoUpdate,
  FloatingArrow,
  flip,
  offset,
  type Placement,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useRole,
} from "@floating-ui/react";
import { type ReactNode, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "../utils/cn";

export interface TooltipProps {
  trigger: ReactNode;
  children: ReactNode;
  placement?: Placement;
  className?: string;
}

const ARROW_HEIGHT = 8;
const ARROW_WIDTH = 16;

export function Tooltip({ trigger, children, placement = "bottom-end", className }: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  const arrowRef = useRef<SVGSVGElement>(null);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement,
    middleware: [
      offset(ARROW_HEIGHT + 4),
      flip(),
      shift({ padding: 8 }),
      arrow({ element: arrowRef }),
    ],
    whileElementsMounted: autoUpdate,
  });

  const click = useClick(context);
  const focus = useFocus(context);
  const hover = useHover(context, { delay: 100 });
  const dismiss = useDismiss(context);
  const role = useRole(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    focus,
    hover,
    dismiss,
    role,
  ]);

  return (
    <>
      <div ref={refs.setReference} tabIndex={0} className="inline-flex" {...getReferenceProps()}>
        {trigger}
      </div>
      {isOpen &&
        createPortal(
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            className={cn(
              "dark rounded-xl border border-white/10 bg-black/90 p-2 text-gray-300 text-sm shadow-2xl backdrop-blur-xl",
              className,
            )}
            {...getFloatingProps()}
          >
            <FloatingArrow
              ref={arrowRef}
              context={context}
              width={ARROW_WIDTH}
              height={ARROW_HEIGHT}
              fill="rgba(0, 0, 0, 0.9)"
              strokeWidth={1}
              stroke="rgba(255, 255, 255, 0.1)"
            />
            {children}
          </div>,
          document.body,
        )}
    </>
  );
}

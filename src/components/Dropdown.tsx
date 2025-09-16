import { ReactNode, RefObject, useCallback, useEffect, useState } from "react";
import { Portal } from "./Portal";

interface DropdownProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  triggerRef?: RefObject<HTMLElement | null>;
  gap?: number;
  preventScroll?: boolean;
}

interface Position {
  placement: "left" | "right";
  x: number;
  y: number;
}

export const Dropdown = ({
  isOpen,
  onClose,
  children,
  triggerRef,
  gap = 8,
  preventScroll = true,
}: DropdownProps) => {
  const [position, setPosition] = useState<Position | null>(null);

  const calculatePosition = useCallback((): Position => {
    if (triggerRef?.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const screenWidth = window.innerWidth;
      const triggerCenter = rect.left + rect.width / 2;

      // Align dropdown to the left or right depending on trigger position
      const placement = triggerCenter > screenWidth / 2 ? "left" : "right";
      const x = placement === "left" ? screenWidth - rect.right : rect.left;
      const y = rect.bottom + gap;

      return { placement, x, y };
    }

    return { placement: "right", x: 0, y: 0 };
  }, [triggerRef, gap]);

  useEffect(() => {
    if (isOpen) {
      const newPosition = calculatePosition();
      setPosition(newPosition);
    } else {
      setPosition(null);
    }
  }, [isOpen, calculatePosition]);

  useEffect(() => {
    const handleResize = () => {
      if (isOpen && triggerRef?.current) {
        const newPosition = calculatePosition();
        setPosition(newPosition);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen, calculatePosition, triggerRef]);

  const shouldRenderDropdown = isOpen && !!position;

  return (
    <Portal isOpen={shouldRenderDropdown} onClose={onClose} preventScroll={preventScroll}>
      {position && (
        <div
          className="fixed"
          style={
            position.placement === "left"
              ? { top: `${position.y}px`, right: `${position.x}px` }
              : { top: `${position.y}px`, left: `${position.x}px` }
          }
        >
          {children}
        </div>
      )}
    </Portal>
  );
};

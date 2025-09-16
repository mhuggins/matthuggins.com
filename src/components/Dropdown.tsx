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
  top: number;
  right: number;
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

  const calculatePosition = useCallback(() => {
    if (triggerRef?.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      return {
        top: rect.bottom + gap,
        right: window.innerWidth - rect.right,
      };
    }
    return { top: 0, right: 0 };
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
      <div
        className="fixed"
        style={{
          top: `${position?.top ?? 0}px`,
          right: `${position?.right ?? 0}px`,
        }}
      >
        {children}
      </div>
    </Portal>
  );
};

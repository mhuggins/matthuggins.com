import { ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";

interface PortalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  preventScroll?: boolean;
}

export const Portal = ({ isOpen, onClose, children, preventScroll = true }: PortalProps) => {
  // Prevent body scroll when portal is open
  useEffect(() => {
    if (isOpen && preventScroll) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, preventScroll]);

  if (!isOpen) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 touch-none overscroll-none bg-black/20" onClick={onClose} />
      {children}
    </>,
    document.body,
  );
};

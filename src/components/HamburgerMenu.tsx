import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/utils/cn";
import { ContactLinks } from "./ContactLinks";
import { Profile } from "./Profile";

export const HamburgerMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: buttonRect.bottom + 8, // 8px gap (mt-2)
        right: window.innerWidth - buttonRect.right,
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (isOpen && buttonRef.current) {
        const buttonRect = buttonRef.current.getBoundingClientRect();
        setMenuPosition({
          top: buttonRect.bottom + 8,
          right: window.innerWidth - buttonRect.right,
        });
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex flex-col gap-1 p-2"
        aria-label="Toggle menu"
      >
        <span
          className={cn(
            "h-0.5 w-6 bg-white transition-all duration-200",
            isOpen && "translate-y-1.5 rotate-45",
          )}
        />
        <span
          className={cn("h-0.5 w-6 bg-white transition-all duration-200", isOpen && "opacity-0")}
        />
        <span
          className={cn(
            "h-0.5 w-6 bg-white transition-all duration-200",
            isOpen && "-rotate-45 -translate-y-1.5",
          )}
        />
      </button>

      {/* Portal the menu to document.body */}
      {isOpen &&
        createPortal(
          <>
            <div className="fixed inset-0 bg-black/20" onClick={() => setIsOpen(false)} />
            <div
              className="fixed w-64 rounded-lg bg-[#42A8C0] shadow-lg"
              style={{
                top: `${menuPosition.top}px`,
                right: `${menuPosition.right}px`,
              }}
            >
              <Profile className="rounded-t-lg p-4" />
              <ContactLinks className="p-4" />
            </div>
          </>,
          document.body,
        )}
    </div>
  );
};

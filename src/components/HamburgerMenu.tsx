import { useCallback, useRef, useState } from "react";
import { cn } from "@/utils/cn";
import { ContactLinks } from "./ContactLinks";
import { Dropdown } from "./Dropdown";
import { Profile } from "./Profile";

export const HamburgerMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleToggle = useCallback(() => {
    setIsOpen(!isOpen);
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <div className="md:hidden">
      <button
        type="button"
        ref={buttonRef}
        onClick={handleToggle}
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

      <Dropdown isOpen={isOpen} onClose={handleClose} triggerRef={buttonRef}>
        <div className="w-64 rounded-lg bg-[#42A8C0] opacity-100 shadow-lg">
          <Profile className="rounded-t-lg p-4" />
          <ContactLinks className="p-4" />
        </div>
      </Dropdown>
    </div>
  );
};

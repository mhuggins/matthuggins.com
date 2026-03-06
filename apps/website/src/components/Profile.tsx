import { cn } from "@/utils/cn";

export interface ProfileProps {
  className?: string;
}

export const Profile = ({ className }: ProfileProps) => (
  <div className={cn("bg-primary p-6 text-center text-white print:py-0", className)}>
    <div className="mx-auto mt-2 mb-4 size-16 overflow-hidden rounded-full border-2 border-gray-100 bg-gray-100 shadow-md md:mt-0 md:size-32 md:border-4">
      <img
        src="https://github.com/mhuggins.png"
        alt="Matt Huggins"
        className="size-full object-cover"
      />
    </div>
    <h1 className="mb-1/2 font-bold text-lg md:mb-1 md:text-3xl">Matt Huggins</h1>
    <p className="font-light text-sm text-white/60 md:text-base print:text-gray-900/60">
      Web &amp; Mobile Developer
    </p>
  </div>
);

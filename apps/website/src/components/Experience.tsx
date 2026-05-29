import { BuildingIcon } from "@phosphor-icons/react";

interface Role {
  title: string;
  startDate: string;
  endDate?: string;
  tasks: string[];
}

interface ExperienceProps {
  company: string;
  location: string;
  description?: string;
  roles: Role[];
}

const RoleTasks = ({ tasks }: { tasks: string[] }) => (
  <ul className="my-2 ml-6 list-disc">
    {tasks.map((task, i) => (
      <li key={i}>{task}</li>
    ))}
  </ul>
);

const DateRange = ({ startDate, endDate }: { startDate: string; endDate?: string }) => (
  <div className="text-gray-400">
    {startDate} - {endDate ?? "Present"}
  </div>
);

// Line spans top-3.5 (dot bottom, y=14) to -bottom-5.5 (gap-3 to next dot center).
const TimelineRole = ({ role, isLast }: { role: Role; isLast: boolean }) => (
  <div className="relative ml-4 pl-5">
    <div aria-hidden className="absolute top-1.5 left-0 h-2 w-2 rounded-full bg-gray-400" />
    {!isLast && (
      <div aria-hidden className="-bottom-5.5 absolute top-3.5 left-[3.5px] w-px bg-gray-300" />
    )}
    <div className="flex items-center justify-between gap-3">
      <div>{role.title}</div>
      <DateRange startDate={role.startDate} endDate={role.endDate} />
    </div>
    <RoleTasks tasks={role.tasks} />
  </div>
);

export const Experience = ({
  company,
  location,
  description,
  roles,
  ...props
}: ExperienceProps) => {
  if (roles.length === 1) {
    const [{ title, startDate, endDate, tasks }] = roles;
    return (
      <div {...props}>
        <div className="flex items-center">
          <BuildingIcon aria-hidden size={20} className="mx-2 shrink-0 text-gray-400" />
          <div className="flex flex-1 items-center justify-between gap-3">
            <div className="text-base">{title}</div>
            <DateRange startDate={startDate} endDate={endDate} />
          </div>
        </div>
        <div className="ml-9 text-gray-400">
          {company} • {location}
        </div>
        {description && <div className="mt-3 ml-9">{description}</div>}
        <div className="ml-9">
          <RoleTasks tasks={tasks} />
        </div>
      </div>
    );
  }

  return (
    <div {...props}>
      <div className="flex items-center">
        <BuildingIcon aria-hidden size={20} className="mx-2 shrink-0 text-gray-400" />
        <div className="text-base">{company}</div>
      </div>
      <div className="ml-9 text-gray-400">{location}</div>
      {description && <div className="mt-3 ml-9">{description}</div>}
      <div className="mt-3 flex flex-col gap-3">
        {roles.map((role, i) => (
          <TimelineRole key={i} role={role} isLast={i === roles.length - 1} />
        ))}
      </div>
    </div>
  );
};

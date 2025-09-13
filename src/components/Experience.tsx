interface ExperienceProps {
  role: string;
  company: string;
  location: string;
  startDate: string;
  endDate?: string;
  tasks: string[];
}

export const Experience = ({
  role,
  company,
  location,
  startDate,
  endDate,
  tasks,
  ...props
}: ExperienceProps) => (
  <div {...props}>
    <div className="flex items-center justify-between gap-3">
      <div className="text-base">{role}</div>
      <div className="text-[#97AAC3]">
        {startDate} - {endDate ?? "Present"}
      </div>
    </div>
    <div className="text-[#97AAC3]">
      {company}, {location}
    </div>
    <ul className="my-2 ml-6 list-disc">
      {tasks.map((task, i) => (
        <li key={i}>{task}</li>
      ))}
    </ul>
  </div>
);

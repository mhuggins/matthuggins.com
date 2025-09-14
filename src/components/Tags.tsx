export interface TagsProps {
  tags: string[];
}

export const Tags = ({ tags }: TagsProps) => (
  <div className="flex flex-wrap gap-2">
    {tags.map((tag) => (
      <span
        key={tag}
        className="rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-700 text-xs"
      >
        {tag}
      </span>
    ))}
  </div>
);

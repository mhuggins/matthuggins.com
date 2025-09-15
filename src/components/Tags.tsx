import { Link } from "@/components/Link";

export interface TagsProps {
  tags: string[];
}

export const Tags = ({ tags }: TagsProps) => (
  <div className="flex flex-wrap gap-2">
    {tags.map((tag) => (
      <Link
        key={tag}
        to="/blog/tags/$tag"
        params={{ tag }}
        className="rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-700 text-xs transition-colors hover:bg-gray-200 hover:text-gray-800"
      >
        {tag}
      </Link>
    ))}
  </div>
);

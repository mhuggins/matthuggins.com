import Link from 'next/link';
import { Post } from '../../constants/blog';
import { getSlug } from '../../helpers/getSlug';

export interface Props {
  posts: Post[];
}

const BlogPosts = ({ posts }: Props) => (
  <ul>
    {posts.map((post) => (
      <li key={`${post.date}/${post.slug}`}>
        <Link href={`/blog/${getSlug(post)}`}>{post.title}</Link>
        {' '}
        ({post.date})
      </li>
    ))}
  </ul>
);

export default BlogPosts;

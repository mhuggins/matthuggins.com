import { Post } from '../constants/blog';

export const getTags = (posts: Post[]) =>
  Array.from(new Set(posts.flatMap((post) => post.tags))).sort();

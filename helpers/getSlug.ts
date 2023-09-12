import { Post } from '../constants/blog';

export const getSlug = (post: Post) => [post.date, post.slug].join('/');

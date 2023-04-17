import { Post } from '../constants/posts';

export const getSlug = (post: Post) => [post.date, post.slug].join('/');

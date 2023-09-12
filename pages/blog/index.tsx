import { Card, CardContent } from '@mui/material';
import Link from 'next/link';
import BlogPosts from '../../components/BlogPosts/BlogPosts';
import Page from '../../components/Page/Page';
import { POSTS, TAGS } from '../../constants/blog';

const allPosts = POSTS.sort((a, b) => a.date < b.date ? 1 : -1);

const BlogTags = ({ tags }: { tags: string[] }) => (
  <ul>
    {tags.map((tag) => (
      <li key={tag}>
        <Link href={`/blog/tags/${tag}`}>{tag}</Link>
      </li>
    ))}
  </ul>
);

const PostsPage = () => (
  <Page title="Blog">
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <h2>Posts</h2>
        <BlogPosts posts={allPosts} />
      </CardContent>
    </Card>
    <Card>
      <CardContent>
        <h2>Tags</h2>
        <BlogTags tags={TAGS} />
      </CardContent>
    </Card>
  </Page>
);

export default PostsPage;

import BlogPosts from '../../components/BlogPosts/BlogPosts';
import Page from '../../components/Page/Page';
import { POSTS } from '../../constants/posts';

const PostsPage = () => (
  <Page title="Blog">
    <BlogPosts posts={POSTS} />
  </Page>
);

export default PostsPage;

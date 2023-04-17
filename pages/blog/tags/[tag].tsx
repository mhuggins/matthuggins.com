import { GetStaticPaths, GetStaticProps } from 'next';
import { useMemo } from 'react';
import BlogPosts from '../../../components/BlogPosts';
import Page from '../../../components/Page/Page';
import { POSTS } from '../../../constants/posts';
import { toArray } from '../../../helpers/toArray';

interface Props {
  tag: string;
}

const TAGS = Array.from(new Set(POSTS.flatMap((post) => post.tags))).sort();

export const getStaticPaths: GetStaticPaths = () => {
  if (process.env.SKIP_BUILD_STATIC_GENERATION) {
    return { paths: [], fallback: 'blocking' };
  }

  const paths = TAGS.map((tag) => ({ params: { tag } }));
  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps = (context) => {
  const tag = toArray(context.params?.tag ?? '').join('-');

  if (!TAGS.includes(tag)) {
    return { notFound: true };
  }

  return {
    props: { tag },
  };
};

const PostsByTag = ({ tag }: Props) => {
  const posts = useMemo(() => POSTS.filter((p) => p.tags.includes(tag)), [tag]);

  return (
    <Page title={`Blog Posts tagged "${tag}"`}>
      <BlogPosts posts={posts} />
    </Page>
  );
};

export default PostsByTag;

import { Card, CardContent } from '@mui/material';
import { GetStaticPaths, GetStaticProps } from 'next';
import React from 'react';
import Page from '../../components/Page';
import PostContent from '../../components/PostContent';
import Tags from '../../components/Tags';
import { POSTS } from '../../constants/blog';
import { getSlug } from '../../helpers/getSlug';
import { toArray } from '../../helpers/toArray';

interface Props {
  content: string;
  slug: string;
  tags: string[];
  title: string;
}

const POSTS_BY_SLUG = Object.fromEntries(POSTS.map((post) => [getSlug(post), post]));

export const getStaticPaths: GetStaticPaths = () => {
  if (process.env.SKIP_BUILD_STATIC_GENERATION) {
    return { paths: [], fallback: 'blocking' };
  }

  const paths = Object.keys(POSTS_BY_SLUG).map((slug) => ({ params: { slug: slug.split('/') } }));
  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps = async (context) => {
  const slugParts = toArray(context.params?.slug ?? []);
  const slug = slugParts.join('/');

  const post = POSTS_BY_SLUG[slug];

  if (!post) {
    return { notFound: true };
  }

  const { content: loadContent, tags, title } = post;
  const content = await loadContent();

  return {
    props: { content, slug, tags, title },
  };
};

const PostBySlug = ({ content, tags, title }: Props) => (
  <Page
    title={title}
    breadcrumbs={[
      { label: 'Matt Huggins', path: '/' },
      { label: 'Blog', path: '/blog' },
    ]}
  >
    <Card>
      <CardContent>
        <Tags tags={tags} />
        <PostContent content={content} />
      </CardContent>
    </Card>
  </Page>
);

export default PostBySlug;

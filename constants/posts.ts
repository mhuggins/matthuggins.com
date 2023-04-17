export interface Post {
  date: string;
  slug: string;
  title: string;
  tags: string[];
  content: () => Promise<string>;
}

export const POSTS: Post[] = [
  {
    slug: 'using-faux-activerecord-models-in-rails-3',
    date: '2014-01-04',
    title: 'Using Faux ActiveRecord Models in Rails 3',
    tags: ['activemodel', 'form', 'ruby-on-rails'],
    content: async () => (await import('../posts/2014-01-04/using-faux-activerecord-models-in-rails-3.md')).default,
  },
  {
    slug: 'step-by-step-guide-to-building-your-first-ruby-gem',
    date: '2014-03-06',
    tags: ['bundler', 'gem', 'open-source', 'ruby', 'tutorial'],
    title: 'Step-by-Step Guide to Building Your First Ruby Gem',
    content: async () => (await import('../posts/2014-03-06/step-by-step-guide-to-building-your-first-ruby-gem.md')).default,
  },
  {
    slug: 'april-fools-how-we-converted-our-site-to-doge-in-just-40-lines-of-code',
    date: '2014-04-01',
    tags: ['ruby', 'ruby-on-rails'],
    title: 'April Fools! How we converted our site to "doge" in just 40 lines of code',
    content: async () => (await import('../posts/2014-04-01/april-fools-how-we-converted-our-site-to-doge-in-just-40-lines-of-code.md')).default,
  },
  {
    slug: 'building-an-open-source-loader-for-react-js',
    date: '2014-09-16',
    tags: ['javascript', 'open-source', 'react'],
    title: 'Building an Open-Source Loader for React.js',
    content: async () => (await import('../posts/2014-09-16/building-an-open-source-loader-for-react-js.md')).default,
  },
  {
    slug: 'parsing-domain-names-now-in-gem-form',
    date: '2015-01-02',
    tags: ['gem', 'open-source', 'ruby'],
    title: 'Parsing Domain Names - Now in Gem Form!',
    content: async () => (await import('../posts/2015-01-02/parsing-domain-names-now-in-gem-form.md')).default,
  },
];

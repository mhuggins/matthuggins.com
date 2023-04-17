import Markdown, { MarkdownToJSX } from 'markdown-to-jsx';
import Code from '../Code';
import { ReactNode } from 'react';

interface Props {
  content: string;
}

// The markdown-to-jsx package converts code blocks wrapped in ``` into a nested
// <pre><code /></pre> hierarchy.  This will ensure that nesting is still respected while
// highlighting accordingly.
const PreTag = ({ children, ...rest }: { children: ReactNode }) => {
  if (typeof children === 'object' && children !== null && 'type' in children && children.type === 'code') {
    return <pre {...rest}>{Code(children['props'])}</pre>;
  }
  return <pre {...rest}>{children}</pre>;
};

const options: MarkdownToJSX.Options = {
  overrides: {
    pre: PreTag,
  },
};

const PostContent = ({ content }: Props) => (
  <Markdown options={options}>
    {content}
  </Markdown>
);

export default PostContent;

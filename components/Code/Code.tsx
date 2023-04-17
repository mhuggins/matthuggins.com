import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface Props {
  children: string;
  className?: string;
}

const LANGUAGE_CLASS_PREFIX = 'lang-';

const getLanguage = (className: string | undefined) => {
  if (!className) {
    return undefined;
  }
  const classes = className.split(/ +/);
  const lang = classes.find((c) => c.startsWith(LANGUAGE_CLASS_PREFIX));
  return lang?.substring(LANGUAGE_CLASS_PREFIX.length);
};

const Code = ({ children, className }: Props) => (
  <SyntaxHighlighter language={getLanguage(className)} style={vs}>
    {children}
  </SyntaxHighlighter>
);

export default Code;

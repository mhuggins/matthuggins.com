import styled from '@emotion/styled';
import Link from 'next/link';

interface Props {
  tags: string[];
}

const List = styled('ul')({
  display: 'inline',
  listStyle: 'none',
  margin: 0,
  padding: 0,
});

const Item = styled('li')({
  display: 'inline',
  ':after': {
    content: '" | "',
  },
  ':last-child:after': {
    content: '""',
  },
});

const Tags = ({ tags }: Props) => (
  <div>
    <strong>
      Tags:{' '}
      <List>
        {tags.map((tag) => (
          <Item key={tag}>
            <Link href={`/blog/tags/${tag}`}>{tag}</Link>
          </Item>
        ))}
      </List>
    </strong>
  </div>
);

export default Tags;

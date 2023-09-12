import styled from '@emotion/styled';
import pluralize from 'pluralize';

const Container = styled('div')({
  display: 'flex',
  marginBottom: '8px',
  maxWidth: '400px',
  fontSize: '14px',
});

const Item = styled('div')({
  flex: '1 0 50%',
});

const Name = styled(Item)({
  fontWeight: 600,
});

interface Props {
  name: string;
  years: number;
  proficiency: string;
}

const Skill = ({ name, years, proficiency }: Props) => (
  <Container>
    <Name>{name}</Name>
    <Item>{pluralize('yr', years, true)}</Item>
    <Item>{proficiency}</Item>
  </Container>
);

export default Skill;

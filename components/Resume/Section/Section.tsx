import styled from '@emotion/styled';
import React from 'react';

const styles = {};

const Container = styled('div')({
  margin: '0 0 48px',
  ':last-child': {
    marginBottom: 0,
  },
});

const Title = styled('div')({
  margin: '0 0 24px',
  color: '#888',
  fontFamily: '"Josefin Sans", Arial, sans-serif',
  fontSize: '14px',
  fontWeight: '600px',
  textTransform: 'uppercase',
});

interface Props {
  children: React.ReactNode;
  title: string;
}

const Section = ({ children, title }: Props) => (
  <Container>
    <Title>{title}</Title>
    {children}
  </Container>
);

export default Section;

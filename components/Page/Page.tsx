import styled from '@emotion/styled';
import Head from 'next/head';
import React from 'react';

import { siteTitle } from '../../values/siteTitle';

const Container = styled('div')({
  marginBottom: '5rem',
  padding: '100px 10%',
  background: '#fff',
  boxShadow: '0 30px 50px 0 rgba(0, 0, 0, 0.15)',
  '@media only screen and (max-width: 420px)': {
    marginBottom: 0,
  },
});

const Title = styled('h3')({
  position: 'relative',
  margin: '0 auto 20px',
  padding: '0 0 40px',
  fontSize: '15px',
  textAlign: 'center',
  textTransform: 'uppercase',
  ':after': {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    width: '50px',
    height: '1px',
    marginLeft: '-25px',
    content: '""',
    background: 'rgba(51, 51, 51, 0.2)',
  },
});

interface Props {
  children: React.ReactNode;
  title: string;
}

const Page = ({ title, children }: Props) => (
  <Container>
    <Head>
      <title>{`${title} - ${siteTitle}`}</title>
    </Head>
    <Title>{title}</Title>
    {children}
  </Container>
);

export default Page;

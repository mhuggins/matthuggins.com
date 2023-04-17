import styled from '@emotion/styled';
import { faEnvelope, faIdCard, faRss } from '@fortawesome/free-solid-svg-icons';
import { faGithub, faLinkedin } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import React from 'react';

const Container = styled('div')({
  width: '93%',
  maxWidth: '1170px',
  margin: '0 auto',
  '@media only screen and (max-width: 420px)': {
    width: 'auto',
  },
});

const HeaderBackground = styled('div')({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '210px',
  background: '#0288d1',
  zIndex: -1,
});

const Header = styled('div')({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: '110px',
  fontFamily: '"Josefin Sans", Arial, sans-serif',
  color: '#fff',
  '@media only screen and (max-width: 420px)': {
    marginLeft: '20px',
    marginRight: '20px',
  },
});

const Title = styled('div')({
  flex: '0 1 auto',
  marginRight: '20px',
});

const Links = styled('ul')({
  flex: '0 1 auto',
  margin: 0,
  padding: 0,
  listStyle: 'none',
  textAlign: 'right',
  textTransform: 'uppercase',
  'li': {
    display: 'inline-block',
    verticalAlign: 'middle',
    ':not(:first-child)': {
      marginLeft: '0.5em',
    },
  },
  'a': {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    padding: '16px 14px 13px',
    color: '#fff',
    fontFamily: '"Josefin Sans", Arial, sans-serif',
    fontSize: '11px',
    fontWeight: 600,
    textDecoration: 'none',
    transition: 'all 0.1s ease-in-out',
    ':hover': {
      background: 'rgba(255, 255, 255, 0.1)',
      boxShadow: '0 10px 15px 0 rgba(0, 0, 0, 0.15)',
    },
  },
  'svg': {
    width: '14px',
    height: '14px',
    fill: 'currentColor',
  },
});

const Name = styled('h1')({
  margin: 0,
  color: '#fff',
  lineHeight: '1.25em',
  whiteSpace: 'nowrap',
  fontSize: '24px',
  fontWeight: 600,
  textTransform: 'none',
});

const Role = styled('h2')({
  margin: 0,
  color: '#fff',
  lineHeight: '1.25em',
  whiteSpace: 'nowrap',
  fontSize: '16px',
  fontWeight: 400,
  textTransform: 'lowercase',
});

interface Props {
  children: React.ReactNode;
}

const Layout = ({ children }: Props) => (
  <Container>
    <HeaderBackground />
    <Header>
      <Title>
        <Name>Matt Huggins</Name>
        <Role>Web &amp; Mobile Developer</Role>
      </Title>
      <Links>
        <li>
          <Link href="/">
            <a>
              <FontAwesomeIcon icon={faIdCard} />
              <span>Resume</span>
            </a>
          </Link>
        </li>
        <li>
          <Link href="/blog">
            <a>
              <FontAwesomeIcon icon={faRss} />
              <span>Blog</span>
            </a>
          </Link>
        </li>
        <li>
          <a href="https://github.com/mhuggins" target="_blank" rel="noreferrer">
            <FontAwesomeIcon icon={faGithub} />
            <span>GitHub</span>
          </a>
        </li>
        <li>
          <a href="https://www.linkedin.com/in/huggie/" target="_blank" rel="noreferrer">
            <FontAwesomeIcon icon={faLinkedin} />
            <span>LinkedIn</span>
          </a>
        </li>
        <li>
          <Link href="/contact">
            <a>
              <FontAwesomeIcon icon={faEnvelope} />
              <span>Contact</span>
            </a>
          </Link>
        </li>
      </Links>
    </Header>

    {children}
  </Container>
);

export default Layout;

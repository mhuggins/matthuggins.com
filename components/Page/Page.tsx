import {
  AppBar,
  Box,
  Breadcrumbs,
  Button,
  Container,
  ContainerProps,
  CssBaseline,
  Link as MuiLink,
  Toolbar,
  Typography,
} from '@mui/material';
import Head from 'next/head';
import { ReactNode } from 'react';
import { siteTitle } from '../../values/siteTitle';
import Link from 'next/link';

interface Props {
  breadcrumbs?: Breadcrumb[];
  maxWidth?: ContainerProps['maxWidth'];
  children: ReactNode;
  title?: ReactNode;
}

interface PageLink {
  label: string;
  path: string;
}

interface Breadcrumb {
  label: string;
  path: string;
}

const pages: PageLink[] = [
  { label: 'Blog', path: '/blog' },
  { label: 'Resume', path: '/' },
  { label: 'Contact', path: '/contact' },
];

// const socials = [
//   { label: 'GitHub', url: 'https://github.com/mhuggins', icon: faGithub },
//   { label: 'LinkedIn', url: 'https://www.linkedin.com/in/huggie/', icon: faLinkedin },
//   // <li>
//   //   <a href="https://github.com/mhuggins" target="_blank" rel="noreferrer">
//   //     <FontAwesomeIcon icon={faGithub} />
//   //     <span>GitHub</span>
//   //   </a>
//   // </li>
// ];

const PageTitle = ({ children }: { children: ReactNode }) => (
  <Typography component="h1" variant="h5">
    {children}
  </Typography>
);

const Page = ({ breadcrumbs, children, maxWidth = 'lg', title }: Props) => (
  <Box sx={{ display: 'flex' }}>
    <Head>
      <title>{`${title} - ${siteTitle}`}</title>
    </Head>
    <CssBaseline />
    <AppBar position="absolute">
      <Toolbar>
        <Link href="/" passHref>
          <Typography
            variant="h6"
            noWrap
            sx={{
              mr: 2,
              display: { xs: 'flex' },
              fontWeight: 700,
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            Matt Huggins<br />
            web &amp; mobile developer
          </Typography>
        </Link>
        <Box sx={{ flexGrow: 1, display: { xs: 'flex' } }}>
          {pages.map(({ label, path }) => (
            <Link key={label} href={path} passHref>
              <Button sx={{ my: 2, color: 'white', display: 'block' }}>
                {label}
              </Button>
            </Link>
          ))}
        </Box>
      </Toolbar>
    </AppBar>
    <Box
      component="main"
      sx={{
        backgroundColor: (theme) =>
          theme.palette.mode === 'light' ? theme.palette.grey[100] : theme.palette.grey[900],
        flexGrow: 1,
        height: '100vh',
        overflow: 'auto',
      }}
    >
      <Toolbar />
      <Container maxWidth={maxWidth} sx={{ mt: 4, mb: 4 }}>
        {(title || (breadcrumbs && breadcrumbs.length > 0)) && (
          <Box width="100%" marginBottom={2}>
            {title && <PageTitle>{title}</PageTitle>}
            {breadcrumbs && breadcrumbs.length > 0 && (
              <Breadcrumbs separator="›" aria-label="breadcrumb">
                {breadcrumbs.map((breadcrumb, index) => {
                  const key = breadcrumbs.slice(0, index + 1).join('/');
                  const isLast = index === breadcrumbs.length - 1;
                  return isLast ? (
                    <Typography key={key} color="text.primary">
                      {breadcrumb.label}
                    </Typography>
                  ) : (
                    <Link key={key} href={breadcrumb.path} passHref>
                      <MuiLink underline="hover" color="inherit">
                        {breadcrumb.label}
                      </MuiLink>
                    </Link>
                  );
                })}
              </Breadcrumbs>
            )}
          </Box>
        )}
        {children}
      </Container>
    </Box>
  </Box>
);

export default Page;

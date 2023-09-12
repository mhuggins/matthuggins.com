import { AppProps } from 'next/app';
import Head from 'next/head';
import React from 'react';
import { siteTitle } from '../values/siteTitle';

const MyApp = ({ Component, pageProps }: AppProps) => (
  <>
    <Head>
      <title>{siteTitle}</title>
    </Head>
    <Component {...pageProps} />
  </>
);

export default MyApp;

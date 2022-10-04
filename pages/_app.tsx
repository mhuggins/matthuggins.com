import { AppProps } from "next/app";
import Head from 'next/head';
import React from 'react';

import Layout from "../components/Layout";
import { siteTitle } from '../values/siteTitle';

const MyApp = ({ Component, pageProps }: AppProps) => (
  <Layout>
    <Head>
      <title>{siteTitle}</title>
    </Head>
    <Component {...pageProps} />
  </Layout>
);

export default MyApp;

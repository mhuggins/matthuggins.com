import App, { Container } from "next/app";
import Head from "next/head";

import '../styles/global.scss';
import Layout from "../components/Layout";
import siteTitle from "../values/siteTitle";

class MyApp extends App {
  render() {
    const { Component, pageProps } = this.props;

    return (
      <Container>
        <Head>
          <title>{siteTitle}</title>
          <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Domine:400,600|Josefin+Sans:400,600&display=swap" />
        </Head>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </Container>
    );
  }
}

export default MyApp;

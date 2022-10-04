import { Global } from '@emotion/react';
import { Html, Head, Main, NextScript } from 'next/document';
import React from 'react';

const Document = () => (
  <Html>
    <Head>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Domine:400,600|Josefin+Sans:400,600&amp;display=swap" />
      <Global
        styles={{
          '*': {
            boxSizing: 'border-box',
            fontFamily: '"Domine", "Times New Roman", serif',
          },
          'html, a': {
            webkitFontSmoothing: 'antialiased',
          },
          'body': {
            margin: 0,
            padding: 0,
            background: '#f8f8f8',
            color: '#444',
          },
          'h1, h2, h3, h4, h5, h6': {
            marginBottom: '36px',
            color: '#333',
            fontFamily: '"Josefin Sans", Arial, sans-serif',
            textTransform: 'uppercase',
            'a': {
              color: 'inherit',
              textDecoration: 'none',
              transition: 'all .15s ease-in-out',
              ':hover': {
                color: '#039be5',
              },
            },
          },
          'h1': {
            fontSize: '48px',
          },
          'h2': {
            fontSize: '35px',
          },
          'h3': {
            fontSize: '28px',
          },
          'h4': {
            fontSize: '23px',
          },
          'h5': {
            fontSize: '18px',
          },
          'h6': {
            fontSize: '15px',
          },
          'p': {
            marginBottom: '36px',
          },
          'a': {
            color: '#039be5',
            textDecoration: 'underline',
            ':hover': {
              textDecoration: 'none',
            },
          },
        }}
      />
    </Head>
    <body>
      <Main />
      <NextScript />
    </body>
  </Html>
);

export default Document;

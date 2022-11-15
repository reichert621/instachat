import 'react-toastify/dist/ReactToastify.css';
import '../styles/globals.css';

import type {AppProps} from 'next/app';
import Head from 'next/head';
import React from 'react';
import {ToastContainer} from 'react-toastify';

import {useInit} from '@instantdb/react';

function WrappedBaseApp({Component, pageProps}: AppProps) {
  const [loading, error, auth] = useInit({
    appId: '09c1cf2d-cb78-4bac-ba31-f4417acfeff0',
    websocketURI: 'wss://instant-server-clj.herokuapp.com/api/runtime/sync',
    apiURI: 'https://instant-server-clj.herokuapp.com/api',
  });

  if (loading) {
    return null;
  }

  return (
    <>
      <Head>
        <meta name="description" content="Example chat app using InstantDB." />
        <meta
          property="og:title"
          content="InstaChat"
          key="title"
          name="title"
        />
        <meta
          property="og:description"
          content="Example chat app using InstantDB."
          key="description"
          name="description"
        />
        <meta property="og:image" content="" key="og-image" />
      </Head>

      <ToastContainer autoClose={8000} theme="dark" />
      <Component {...pageProps} />
    </>
  );
}

export default WrappedBaseApp;

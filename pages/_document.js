import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#8B1A1A" />

        {/* iOS */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Omsorg Ops" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.png" />

        {/* Android / General */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Omsorg Ops" />
        <meta name="description" content="Omsorg operational tools for field staff and coordinators" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="color-scheme" content="light" />

        {/* Icons */}
        <link rel="icon" type="image/png" sizes="96x96" href="/icons/icon-96x96.png" />

        {/* Splash screen colour on Android */}
        <meta name="msapplication-TileColor" content="#8B1A1A" />
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

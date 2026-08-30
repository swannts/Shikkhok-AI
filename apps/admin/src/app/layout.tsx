import clsx from 'clsx';
import 'src/styles/splash-screen.css';
import 'src/styles/index.css';
import generateMetadata from '../utils/generateMetadata';
import App from './App';

export const metadata = await generateMetadata({
  title: 'Shikkhok-AI Admin Console',
  description: 'Shikkhok-AI Administrative Control Panel',
  cardImage: '/card.png',
  robots: 'follow, index',
  favicon: '/favicon.ico',
  url: 'http://localhost:3001',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <meta name="theme-color" content="#000000" />
        <base href="/" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="shortcut icon" href="/favicon.ico" />

        <link
          href="/assets/fonts/material-design-icons/MaterialIconsOutlined.css"
          rel="stylesheet"
        />
        <link href="/assets/fonts/inter/inter.css" rel="stylesheet" />
        <link href="/assets/fonts/meteocons/style.css" rel="stylesheet" />
        <link href="/assets/styles/prism.css" rel="stylesheet" />
        <noscript id="emotion-insertion-point" />
      </head>
      <body id="root" className={clsx('loading')}>
        <App>{children}</App>
      </body>
    </html>
  );
}

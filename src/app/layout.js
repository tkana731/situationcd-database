// /src/app/layout.js

import { GoogleAnalytics } from '@next/third-parties/google'
import { Inter } from 'next/font/google';
import './globals.css';

const gaId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;

// Interフォントのセットアップ
const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'シチュエーションCDデータベース',
  description: '女性向けシチュエーションCDの情報サイト',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        {children}
      </body>
      {gaId && <GoogleAnalytics gaId={gaId} />}
    </html>
  );
}
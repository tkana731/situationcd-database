// /src/app/layout.js

import { GoogleAnalytics } from '@next/third-parties/google'
import { Inter } from 'next/font/google';
import './globals.css';

const gaId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;

// Interフォントのセットアップ
const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'シチュエーションCDデータベース | 女性向けシチュエーションCD・音声作品の情報サイト',
  description: '女性向けシチュエーションCDの情報サイト。最新作品、人気声優、ジャンルタグから好みの作品を簡単検索。DLsiteがるまに、ポケットドラマCD、ステラプレイヤーの作品情報を網羅。',
  keywords: 'シチュエーションCD, シチュCD, 女性向け, 声優, ドラマCD, DLsite, DLsiteがるまに, ポケットドラマCD, ポケドラ, ステラプレイヤー',
  openGraph: {
    title: 'シチュエーションCDデータベース',
    description: '女性向けシチュエーションCDの情報サイト。最新作品、人気声優、ジャンルから検索できます。',
    url: 'https://situationcd.com/',
    siteName: 'シチュエーションCDデータベース',
    images: [
      {
        url: 'https://situationcd.com/og-image.jpg', // OGP画像を用意してください
        width: 1200,
        height: 630,
        alt: 'シチュエーションCDデータベース',
      },
    ],
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'シチュエーションCDデータベース',
    description: '女性向けシチュエーションCDの情報サイト',
    images: ['https://situationcd.com/og-image.jpg'], // OGP画像を用意してください
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ],
    shortcut: '/favicon.ico',
  },
  alternates: {
    canonical: 'https://situationcd.com',
  },
  manifest: '/site.webmanifest',
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
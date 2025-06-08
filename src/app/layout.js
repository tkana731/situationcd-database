// /src/app/layout.js

import { GoogleAnalytics } from '@next/third-parties/google'
import { Inter } from 'next/font/google';
import './globals.css';
import { WishlistProvider } from '@/contexts/WishlistContext';

// 直接GA4の測定IDを使用
const gaId = process.env.NEXT_PUBLIC_GA_ID || process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;

// Interフォントのセットアップ
const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: {
    default: 'シチュエーションCDデータベース | 女性向けシチュエーションCD・音声作品の情報サイト',
    template: '%s | シチュエーションCDデータベース'
  },
  description: '女性向けシチュエーションCDの総合情報サイト。最新作品、人気声優、ジャンルタグから好みの作品を簡単検索。DLsiteがるまに、ポケットドラマCD、ステラプレイヤーの作品情報を網羅。ASMR、乙女ゲーム、BL、TLなど多彩なジャンルを収録。',
  keywords: ['シチュエーションCD', 'シチュCD', '女性向け', '声優', 'ドラマCD', 'DLsite', 'DLsiteがるまに', 'ポケットドラマCD', 'ポケドラ', 'ステラプレイヤー', 'ASMR', '乙女ゲーム', 'BL', 'TL', '音声作品'],
  authors: [{ name: 'シチュエーションCDデータベース運営チーム' }],
  creator: 'シチュエーションCDデータベース',
  publisher: 'シチュエーションCDデータベース',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://situationcd.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'シチュエーションCDデータベース',
    description: '女性向けシチュエーションCDの総合情報サイト。最新作品、人気声優、ジャンルから検索できます。',
    url: '/',
    siteName: 'シチュエーションCDデータベース',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'シチュエーションCDデータベース - 女性向けシチュエーションCD情報サイト',
      },
    ],
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@situationcd',
    creator: '@situationcd',
    title: 'シチュエーションCDデータベース',
    description: '女性向けシチュエーションCDの総合情報サイト。最新作品、人気声優、ジャンルから検索できます。',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
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
  manifest: '/site.webmanifest',
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        {/* SEO向けの追加メタタグ */}
        <meta name="google" content="notranslate" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        
        {/* X（Twitter）のクロールを促進するための追加メタタグ */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="シチュエーションCDデータベース" />
        <meta name="twitter:description" content="女性向けシチュエーションCDの情報サイト。最新作品、人気声優、ジャンルから検索できます。" />
        <meta name="twitter:image" content="https://situationcd.com/og-image.jpg" />
        
        {/* 追加のSEOメタタグ */}
        <meta name="author" content="シチュエーションCDデータベース" />
        <meta name="generator" content="Next.js" />
      </head>
      <body className={inter.className}>
        <WishlistProvider>
          {children}
        </WishlistProvider>
        {/* Google Analytics - コンポーネントの位置を変更 */}
        {gaId && <GoogleAnalytics gaId={gaId} />}
      </body>
    </html>
  );
}
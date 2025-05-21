// /src/app/page.js

import HomePage from './HomePage';
import { metadata as rootMetadata } from './layout';

export function generateMetadata() {
  // 完全なURL（絶対パス）を使用し、末尾スラッシュを確保
  const url = 'https://situationcd.com/';
  const ogImageUrl = 'https://situationcd.com/og-image.jpg';

  return {
    ...rootMetadata,
    title: 'シチュエーションCDデータベース | 女性向けシチュエーションCD・音声作品の情報サイト',
    description: '女性向けシチュエーションCDの情報サイト。最新作品、人気声優、ジャンルタグから好みの作品を簡単検索。',
    alternates: {
      canonical: url,
    },
    openGraph: {
      ...rootMetadata.openGraph,
      title: 'シチュエーションCDデータベース',
      description: '女性向けシチュエーションCDの情報サイト。最新作品、人気声優、ジャンルから検索できます。',
      url,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: 'シチュエーションCDデータベース',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'シチュエーションCDデータベース',
      description: '女性向けシチュエーションCDの情報サイト。最新作品、人気声優、ジャンルから検索できます。',
      images: [ogImageUrl],
    }
  };
}

export default function Page() {
  return <HomePage />;
}
// /src/app/page.js

import HomePage from './HomePage';

export function generateMetadata() {
  const canonicalUrl = 'https://situationcd.com';

  return {
    title: 'シチュエーションCDデータベース | 女性向けシチュエーションCD・音声作品の情報サイト',
    description: '女性向けシチュエーションCDの情報サイト。最新作品、人気声優、ジャンルタグから好みの作品を簡単検索。',
    keywords: 'シチュエーションCD,シチュCD,女性向け,声優,ドラマCD',
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: 'シチュエーションCDデータベース',
      description: '女性向けシチュエーションCDの情報サイト。最新作品、人気声優、ジャンルから検索できます。',
      url: canonicalUrl,
      siteName: 'シチュエーションCDデータベース',
      locale: 'ja_JP',
      type: 'website',
    }
  };
}

export default function Page() {
  return <HomePage />;
}
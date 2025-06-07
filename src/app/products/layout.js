// /src/app/products/layout.js

export const metadata = {
  title: '作品一覧',
  description: '女性向けシチュエーションCDの全作品一覧。最新作品から過去の人気作品まで、ジャンル・声優・発売日で並び替えて検索できます。DLsiteがるまに、ポケットドラマCD、ステラプレイヤーの作品を網羅。',
  keywords: ['シチュエーションCD一覧', '作品検索', '新着作品', '人気作品', 'ドラマCD'],
  openGraph: {
    title: 'シチュエーションCD作品一覧',
    description: '女性向けシチュエーションCDの全作品一覧。最新作品から人気作品まで検索できます。',
  },
  twitter: {
    title: 'シチュエーションCD作品一覧',
    description: '女性向けシチュエーションCDの全作品一覧。最新作品から人気作品まで検索できます。',
  },
};

export default function ProductsLayout({ children }) {
  return children;
}
// /src/app/actors/layout.js

export const metadata = {
  title: '声優一覧',
  description: 'シチュエーションCDに出演している声優一覧。人気声優から新人声優まで、出演作品数と共に紹介。お気に入りの声優から作品を探せます。',
  keywords: ['声優一覧', 'シチュCD声優', '女性向け声優', 'ドラマCD声優', '人気声優'],
  openGraph: {
    title: 'シチュエーションCD出演声優一覧',
    description: 'シチュエーションCDに出演している声優の一覧ページ。お気に入りの声優から作品を探せます。',
  },
  twitter: {
    title: 'シチュエーションCD出演声優一覧',
    description: 'シチュエーションCDに出演している声優の一覧ページ。お気に入りの声優から作品を探せます。',
  },
};

export default function ActorsLayout({ children }) {
  return children;
}
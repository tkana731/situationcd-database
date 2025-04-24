// /src/app/layout.js

import { Inter } from 'next/font/google';
import './globals.css';

// Interフォントのセットアップ
const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'シチュエーションCDデータベース',
  description: '女性向けシチュエーションCDの情報サイト',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
// /src/app/not-found.js

import Link from 'next/link';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

export const metadata = {
  title: 'ページが見つかりません',
  description: 'お探しのページは見つかりませんでした。',
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-grow flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
          <p className="text-xl text-gray-600 mb-8">ページが見つかりません</p>
          <p className="text-gray-500 mb-8">
            お探しのページは移動または削除された可能性があります。
          </p>
          <Link 
            href="/" 
            className="inline-block bg-pink-500 text-white px-6 py-3 rounded-lg hover:bg-pink-600 transition-colors"
          >
            トップページへ戻る
          </Link>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
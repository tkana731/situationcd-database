// src/app/not-found.js

import Link from 'next/link';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Header />

            <main className="flex-grow flex items-center justify-center">
                <div className="container mx-auto px-4 py-16 text-center">
                    <h1 className="text-6xl font-bold text-pink-500 mb-4">404</h1>
                    <h2 className="text-2xl font-medium text-gray-700 mb-8">ページが見つかりませんでした</h2>
                    <p className="text-gray-600 mb-8 max-w-lg mx-auto">
                        お探しのページは削除されたか、URLが変更された可能性があります。
                        または、入力したURLに誤りがあるかもしれません。
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/"
                            className="px-6 py-3 bg-pink-600 text-white font-medium rounded-lg hover:bg-pink-700 transition-colors"
                        >
                            トップページに戻る
                        </Link>
                        <Link
                            href="/actors"
                            className="px-6 py-3 bg-white border border-pink-300 text-pink-600 font-medium rounded-lg hover:bg-pink-50 transition-colors"
                        >
                            声優一覧を見る
                        </Link>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
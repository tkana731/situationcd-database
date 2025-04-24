// /src/app/components/layout/Header.js

'use client';

import Link from 'next/link';
import { Home, List, Info } from 'lucide-react';

const Header = () => {
    return (
        <header className="bg-white shadow-sm border-b border-pink-100 sticky top-0 z-10">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                <Link href="/" className="font-bold text-2xl text-pink-600">
                    シチュエーションCDデータベース
                </Link>
                <div className="flex gap-4 items-center">
                    <Link href="/" className="flex items-center gap-1 text-gray-600 hover:text-pink-600 transition-colors">
                        <Home size={18} />
                        <span>ホーム</span>
                    </Link>
                    <Link href="/products" className="flex items-center gap-1 text-gray-600 hover:text-pink-600 transition-colors">
                        <List size={18} />
                        <span>作品一覧</span>
                    </Link>
                    <Link href="/about" className="flex items-center gap-1 text-gray-600 hover:text-pink-600 transition-colors">
                        <Info size={18} />
                        <span>サイトについて</span>
                    </Link>
                </div>
            </div>
        </header>
    );
};

export default Header;
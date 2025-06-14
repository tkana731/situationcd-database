// /src/app/components/ui/SearchBox.js

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

const SearchBox = () => {
    const [query, setQuery] = useState('');
    const router = useRouter();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/search?q=${encodeURIComponent(query)}`);
        }
    };

    return (
        <div className="bg-gradient-to-r from-pink-100 to-pink-50 py-12 px-4 rounded-lg mb-10">
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-3">
                        あなたにぴったりの一本が見つかる
                    </h2>
                    <p className="text-gray-600 text-sm">
                        作品カード右上のハートをクリックして「お気に入り」に登録すると、お気に入りページの下部に「あなたへのおすすめ」が表示されます
                    </p>
                </div>
                <form onSubmit={handleSubmit} className="relative">
                    <input
                        type="text"
                        className="w-full p-4 pr-12 rounded-full border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 shadow-sm"
                        placeholder="作品名または声優名で検索..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <button
                        type="submit"
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-pink-500 text-white p-2 rounded-full hover:bg-pink-600 transition-colors"
                    >
                        <Search size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SearchBox;
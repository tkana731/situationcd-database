// /src/app/components/layout/Header.js

'use client';

import Link from 'next/link';
import { Home, List, Info, ChevronDown, Calendar, Heart } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useWishlistContext } from '@/contexts/WishlistContext';

const Header = () => {
    const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const { wishlist } = useWishlistContext();

    // 外部クリックでドロップダウンを閉じる
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsYearDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // 年のリストを生成
    const generateYearList = () => {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let y = currentYear; y >= 2010; y--) {
            years.push(y);
        }
        return years;
    };

    return (
        <header className="bg-white shadow-sm border-b border-pink-100 sticky top-0 z-10">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                {/* サイトタイトル - モバイル表示時の改行問題を修正 */}
                <Link href="/" className="font-bold text-xl md:text-2xl text-pink-600 mr-2 whitespace-nowrap">
                    <span className="hidden sm:inline">シチュエーションCDデータベース</span>
                    <span className="inline sm:hidden">シチュCD DB</span>
                </Link>
                <div className="flex gap-2 md:gap-4 items-center">
                    <Link href="/" className="flex items-center gap-1 text-gray-600 hover:text-pink-600 transition-colors p-2" title="ホーム - シチュエーションCDデータベース">
                        <Home size={18} />
                        <span className="hidden md:inline">ホーム</span>
                    </Link>
                    <Link href="/products" className="flex items-center gap-1 text-gray-600 hover:text-pink-600 transition-colors p-2" title="シチュエーションCD作品一覧">
                        <List size={18} />
                        <span className="hidden md:inline">作品一覧</span>
                    </Link>
                    <Link href="/actors" className="flex items-center gap-1 text-gray-600 hover:text-pink-600 transition-colors p-2" title="声優一覧">
                        <span className="hidden md:inline">声優</span>
                    </Link>
                    <Link href="/tags" className="flex items-center gap-1 text-gray-600 hover:text-pink-600 transition-colors p-2" title="ジャンルタグ一覧">
                        <span className="hidden md:inline">ジャンル</span>
                    </Link>

                    {/* 発売年ドロップダウン */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
                            className="flex items-center gap-1 text-gray-600 hover:text-pink-600 transition-colors p-2"
                        >
                            <Calendar size={18} />
                            <span className="hidden md:inline">発売日</span>
                            <ChevronDown size={14} className={`transform transition-transform ${isYearDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isYearDropdownOpen && (
                            <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-20 max-h-96 overflow-y-auto py-1">
                                {generateYearList().map(year => (
                                    <Link
                                        key={year}
                                        href={`/year/${year}`}
                                        className="block px-4 py-2 text-gray-700 hover:bg-pink-50 hover:text-pink-600 whitespace-nowrap"
                                        onClick={() => setIsYearDropdownOpen(false)}
                                    >
                                        {year}年
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    <Link href="/wishlist" className="relative flex items-center gap-1 text-gray-600 hover:text-pink-600 transition-colors p-2">
                        <Heart size={18} />
                        <span className="hidden md:inline">お気に入り</span>
                        {wishlist.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                {wishlist.length}
                            </span>
                        )}
                    </Link>
                    
                    <Link href="/about" className="flex items-center gap-1 text-gray-600 hover:text-pink-600 transition-colors p-2">
                        <Info size={18} />
                        <span className="hidden md:inline">サイトについて</span>
                    </Link>
                </div>
            </div>
        </header>
    );
};

export default Header;
// /src/app/components/layout/Header.js

'use client';

import Link from 'next/link';
import { Home, List, Info, ChevronDown, Calendar } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

const Header = () => {
    const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

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
                <Link href="/" className="font-bold text-xl md:text-2xl text-pink-600 mr-2">
                    <span className="hidden sm:inline">シチュエーションCDデータベース</span>
                    <span className="inline sm:hidden">シチュCDデータベース</span>
                </Link>
                <div className="flex gap-2 md:gap-4 items-center">
                    <Link href="/" className="flex items-center gap-1 text-gray-600 hover:text-pink-600 transition-colors p-2">
                        <Home size={18} />
                        <span className="hidden md:inline">ホーム</span>
                    </Link>
                    <Link href="/products" className="flex items-center gap-1 text-gray-600 hover:text-pink-600 transition-colors p-2">
                        <List size={18} />
                        <span className="hidden md:inline">作品一覧</span>
                    </Link>

                    {/* 発売年ドロップダウン */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
                            className="flex items-center gap-1 text-gray-600 hover:text-pink-600 transition-colors p-2"
                        >
                            <Calendar size={18} />
                            <span className="hidden md:inline">発売年</span>
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
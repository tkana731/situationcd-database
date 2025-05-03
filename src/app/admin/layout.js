// /src/app/admin/layout.js

'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import Link from 'next/link';
import { db, auth } from '../../lib/firebase/config'; // Firebaseの設定を一元管理するために変更
import { ChevronDown } from 'lucide-react';

export default function AdminLayout({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [productDropdownOpen, setProductDropdownOpen] = useState(false);
    const [dataDropdownOpen, setDataDropdownOpen] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);

            // ログインしていない場合、ログインページ以外にアクセスしようとした場合はリダイレクト
            if (!currentUser && pathname !== '/admin') {
                router.push('/admin');
            }
        });

        return () => unsubscribe();
    }, [router, pathname]);

    // ドロップダウンの外側をクリックしたときに閉じる
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (productDropdownOpen || dataDropdownOpen) {
                if (!event.target.closest('.dropdown-menu')) {
                    setProductDropdownOpen(false);
                    setDataDropdownOpen(false);
                }
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [productDropdownOpen, dataDropdownOpen]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push('/admin');
        } catch (err) {
            console.error('Logout error:', err);
        }
    };

    const toggleProductDropdown = (e) => {
        e.stopPropagation();
        setProductDropdownOpen(!productDropdownOpen);
        if (dataDropdownOpen) setDataDropdownOpen(false);
    };

    const toggleDataDropdown = (e) => {
        e.stopPropagation();
        setDataDropdownOpen(!dataDropdownOpen);
        if (productDropdownOpen) setProductDropdownOpen(false);
    };

    // ログインページならレイアウトなしでコンテンツを表示
    if (pathname === '/admin') {
        return children;
    }

    // ローディング中
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">読み込み中...</p>
                </div>
            </div>
        );
    }

    // 未認証
    if (!user) {
        return null; // useEffectでリダイレクトするのでここは表示されない
    }

    // 作品関連のパスかどうかをチェック
    const isProductRelatedPath = (path) => {
        return path === '/admin/products' ||
            path.startsWith('/admin/products/') ||
            path === '/admin/bonuses' ||
            path.startsWith('/admin/bonuses/');
    };

    // データ関連のパスかどうかをチェック
    const isDataRelatedPath = (path) => {
        return path === '/admin/recalculate' ||
            path === '/admin/products/bulk-edit' ||
            path === '/admin/products/import';
    };

    // 認証済み：管理画面レイアウトを表示
    return (
        <div className="min-h-screen flex flex-col bg-gray-100">
            {/* ヘッダー */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center">
                                <Link href="/admin/products" className="font-bold text-xl text-gray-800">
                                    シチュエーションCD管理
                                </Link>
                            </div>
                            <nav className="ml-6 flex items-center space-x-4">
                                {/* 作品管理ドロップダウン */}
                                <div className="relative dropdown-menu">
                                    <button
                                        onClick={toggleProductDropdown}
                                        className={`px-3 py-2 rounded-md flex items-center ${isProductRelatedPath(pathname) ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        作品管理
                                        <ChevronDown size={16} className={`ml-1 transition-transform ${productDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {productDropdownOpen && (
                                        <div className="absolute left-0 mt-2 w-56 bg-white rounded-md shadow-lg z-10 py-1">
                                            <Link
                                                href="/admin/products"
                                                className={`block px-4 py-2 text-sm ${pathname === '/admin/products' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                                                    }`}
                                                onClick={() => setProductDropdownOpen(false)}
                                            >
                                                作品一覧
                                            </Link>
                                            <Link
                                                href="/admin/products/new"
                                                className={`block px-4 py-2 text-sm ${pathname === '/admin/products/new' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                                                    }`}
                                                onClick={() => setProductDropdownOpen(false)}
                                            >
                                                新規作品登録
                                            </Link>
                                            <Link
                                                href="/admin/bonuses"
                                                className={`block px-4 py-2 text-sm ${pathname === '/admin/bonuses' || pathname.startsWith('/admin/bonuses/') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                                                    }`}
                                                onClick={() => setProductDropdownOpen(false)}
                                            >
                                                特典管理
                                            </Link>
                                        </div>
                                    )}
                                </div>

                                {/* データ管理ドロップダウン */}
                                <div className="relative dropdown-menu">
                                    <button
                                        onClick={toggleDataDropdown}
                                        className={`px-3 py-2 rounded-md flex items-center ${isDataRelatedPath(pathname) ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        データ管理
                                        <ChevronDown size={16} className={`ml-1 transition-transform ${dataDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {dataDropdownOpen && (
                                        <div className="absolute left-0 mt-2 w-56 bg-white rounded-md shadow-lg z-10 py-1">
                                            <Link
                                                href="/admin/products/bulk-edit"
                                                className={`block px-4 py-2 text-sm ${pathname === '/admin/products/bulk-edit' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                                                    }`}
                                                onClick={() => setDataDropdownOpen(false)}
                                            >
                                                一括編集
                                            </Link>
                                            <Link
                                                href="/admin/products/import"
                                                className={`block px-4 py-2 text-sm ${pathname === '/admin/products/import' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                                                    }`}
                                                onClick={() => setDataDropdownOpen(false)}
                                            >
                                                CSVインポート
                                            </Link>
                                            <Link
                                                href="/admin/recalculate"
                                                className={`block px-4 py-2 text-sm ${pathname === '/admin/recalculate' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                                                    }`}
                                                onClick={() => setDataDropdownOpen(false)}
                                            >
                                                タグ・声優再集計
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </nav>
                        </div>
                        <div className="flex items-center">
                            <span className="text-sm text-gray-500 mr-4">{user?.email}</span>
                            <button
                                onClick={handleLogout}
                                className="ml-4 px-3 py-2 rounded text-sm text-gray-700 hover:bg-gray-100"
                            >
                                ログアウト
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* メインコンテンツ */}
            <main className="flex-grow">
                <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    {children}
                </div>
            </main>

            {/* フッター */}
            <footer className="bg-white shadow-inner">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
                    <p className="text-center text-sm text-gray-500">
                        © {new Date().getFullYear()} シチュエーションCDデータベース管理システム
                    </p>
                </div>
            </footer>
        </div>
    );
}
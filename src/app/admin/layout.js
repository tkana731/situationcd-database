// /src/app/admin/layout.js

'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import Link from 'next/link';

// Firebaseの設定（既存のfirebaseConfig.jsから取得する想定）
const firebaseConfig = {
    // ここに既存のFirebase設定を入れてください
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Firebase初期化
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export default function AdminLayout({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
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

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push('/admin');
        } catch (err) {
            console.error('Logout error:', err);
        }
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
                                <Link
                                    href="/admin/products"
                                    className={`px-3 py-2 rounded-md ${pathname === '/admin/products' || pathname.startsWith('/admin/products/')
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    作品一覧
                                </Link>
                                <Link
                                    href="/admin/bonuses"
                                    className={`px-3 py-2 rounded-md ${pathname === '/admin/bonuses' || pathname.startsWith('/admin/bonuses/')
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    特典管理
                                </Link>
                                <Link
                                    href="/admin/products/bulk-edit"
                                    className={`px-3 py-2 rounded-md ${pathname === '/admin/products/bulk-edit'
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    一括編集
                                </Link>
                                <Link
                                    href="/admin/products/new"
                                    className={`px-3 py-2 rounded-md ${pathname === '/admin/products/new'
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    新規作品登録
                                </Link>
                                <Link
                                    href="/admin/migration"
                                    className={`px-3 py-2 rounded-md ${pathname === '/admin/migration'
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    データ移行
                                </Link>
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
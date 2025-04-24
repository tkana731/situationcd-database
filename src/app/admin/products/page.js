'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, deleteDoc, query, orderBy } from 'firebase/firestore';
import Link from 'next/link';

// Firebaseの設定
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
const db = getFirestore(app);

export default function ProductsAdminPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();

    // 作品リストの取得
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const productsQuery = query(collection(db, 'products'), orderBy('updatedAt', 'desc'));
                const querySnapshot = await getDocs(productsQuery);

                const productsData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    // Firestoreのタイムスタンプを日付文字列に変換
                    releaseDate: formatTimestamp(doc.data().releaseDate),
                    createdAt: formatTimestamp(doc.data().createdAt),
                    updatedAt: formatTimestamp(doc.data().updatedAt)
                }));

                setProducts(productsData);
            } catch (err) {
                console.error('Error fetching products:', err);
                setError('作品データの取得に失敗しました');
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    // Firestoreのタイムスタンプを日付文字列に変換する関数
    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '';
        if (typeof timestamp === 'string') return timestamp;

        if (timestamp.seconds) {
            const date = new Date(timestamp.seconds * 1000);
            return date.toLocaleDateString('ja-JP');
        }

        return '';
    };

    // 作品削除の確認と実行
    const handleDelete = async (id, title) => {
        if (window.confirm(`「${title}」を削除してもよろしいですか？`)) {
            try {
                await deleteDoc(doc(db, 'products', id));
                setProducts(products.filter(product => product.id !== id));
            } catch (err) {
                console.error('Error deleting product:', err);
                alert('削除に失敗しました');
            }
        }
    };

    if (loading) {
        return (
            <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">作品データを読み込み中...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded my-4">
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">作品一覧</h1>
                <Link
                    href="/admin/products/new"
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                >
                    新規作品登録
                </Link>
            </div>

            {products.length === 0 ? (
                <p className="text-gray-500 text-center py-8">登録されている作品はありません</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    サムネイル
                                </th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    タイトル
                                </th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    シリーズ
                                </th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    リリース日
                                </th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    更新日
                                </th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    操作
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {products.map((product) => (
                                <tr key={product.id} className="hover:bg-gray-50">
                                    <td className="py-3 px-4 whitespace-nowrap">
                                        {product.thumbnailUrl ? (
                                            <img
                                                src={product.thumbnailUrl}
                                                alt={product.title}
                                                className="h-16 w-16 object-cover rounded"
                                            />
                                        ) : (
                                            <div className="h-16 w-16 bg-gray-100 flex items-center justify-center rounded">
                                                <span className="text-gray-400 text-xs">画像なし</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 whitespace-nowrap">
                                        <div className="font-medium text-gray-900">{product.title}</div>
                                    </td>
                                    <td className="py-3 px-4 whitespace-nowrap">
                                        <div className="text-gray-500">{product.series || '-'}</div>
                                    </td>
                                    <td className="py-3 px-4 whitespace-nowrap">
                                        <div className="text-gray-500">{product.releaseDate || '-'}</div>
                                    </td>
                                    <td className="py-3 px-4 whitespace-nowrap">
                                        <div className="text-gray-500">{product.updatedAt || '-'}</div>
                                    </td>
                                    <td className="py-3 px-4 whitespace-nowrap">
                                        <div className="flex space-x-2">
                                            <Link
                                                href={`/admin/products/edit?id=${product.id}`}
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                編集
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(product.id, product.title)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                削除
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
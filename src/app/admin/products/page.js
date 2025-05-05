// src/app/admin/products/page.js

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { db } from '../../../lib/firebase/config'; // 共通のFirebase設定を使用
import { collection, getDocs, doc, deleteDoc, query, orderBy, where } from 'firebase/firestore';
import { getAllActors } from '../../../lib/firebase/products';
import { Search } from 'lucide-react';

export default function ProductsAdminPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false); // 初期状態をfalseに変更
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedActor, setSelectedActor] = useState('');
    const [actors, setActors] = useState([]);
    const [initialLoad, setInitialLoad] = useState(false); // 初回ロードフラグを追加
    const router = useRouter();

    // 初期データ読み込み（声優データのみ）
    useEffect(() => {
        const fetchActors = async () => {
            try {
                const actorsData = await getAllActors();
                setActors(actorsData);
            } catch (err) {
                console.error('Error fetching actors:', err);
                setError('声優データの取得に失敗しました');
            }
        };

        fetchActors();
    }, []);

    // 作品リストの取得
    const fetchProducts = async (actorFilter = null) => {
        setLoading(true);
        setError(null);

        try {
            setInitialLoad(true); // 初回ロードフラグを設定

            let productsQuery;

            if (actorFilter && actorFilter !== '') {
                // 声優でフィルタ
                productsQuery = query(
                    collection(db, 'products'),
                    where('cast', 'array-contains', actorFilter),
                    orderBy('updatedAt', 'desc')
                );
            } else {
                // 全件取得
                productsQuery = query(
                    collection(db, 'products'),
                    orderBy('updatedAt', 'desc')
                );
            }

            const querySnapshot = await getDocs(productsQuery);

            const productsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                // Firestoreのタイムスタンプを日付文字列に変換
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

    // 声優フィルタの変更処理
    const handleActorFilterChange = async (e) => {
        const actor = e.target.value;
        setSelectedActor(actor);
        await fetchProducts(actor);
    };

    // 作品一覧の読み込みボタンを追加
    const handleLoadProducts = () => {
        fetchProducts(selectedActor);
    };

    // タイトル検索フィルタ処理
    const filteredProducts = products.filter(product =>
        product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.series && product.series.toLowerCase().includes(searchQuery.toLowerCase()))
    );

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
                <div className="flex space-x-2">
                    <Link
                        href="/admin/products/new"
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                    >
                        新規作品登録
                    </Link>
                </div>
            </div>

            {/* フィルタセクション */}
            <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* タイトル検索 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            タイトル・シリーズ検索
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="タイトルまたはシリーズ名を入力..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        </div>
                    </div>

                    {/* 声優フィルタ */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            声優フィルタ
                        </label>
                        <select
                            value={selectedActor}
                            onChange={handleActorFilterChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">すべての声優</option>
                            {actors.map((actor) => (
                                <option key={actor.id} value={actor.name}>
                                    {actor.name} ({actor.count}件)
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* 初回ロード前の表示 */}
            {!initialLoad && !loading && (
                <div className="text-center py-8 bg-white rounded-lg shadow-sm border border-gray-200">
                    <p className="text-gray-600 mb-4">作品データを読み込むにはボタンをクリックしてください。</p>
                    <button
                        onClick={handleLoadProducts}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded"
                    >
                        作品一覧を読み込む
                    </button>
                </div>
            )}

            {/* ローディング表示 */}
            {loading && (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">作品データを読み込み中...</p>
                </div>
            )}

            {/* 検索結果表示 */}
            {initialLoad && !loading && (
                <>
                    <div className="mb-4 text-sm text-gray-600">
                        {selectedActor ? (
                            <p>声優「{selectedActor}」の作品: {filteredProducts.length}件</p>
                        ) : (
                            <p>全作品: {filteredProducts.length}件</p>
                        )}
                    </div>

                    {filteredProducts.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">
                            {searchQuery || selectedActor ? '条件に一致する作品はありません' : '登録されている作品はありません'}
                        </p>
                    ) : (
                        <div className="relative overflow-auto max-w-full">
                            <table className="w-full table-fixed border-collapse">
                                <colgroup>
                                    <col className="w-20" />
                                    <col className="w-64 min-w-[12rem] max-w-lg" />
                                    <col className="w-32" />
                                    <col className="w-40" />
                                    <col className="w-28" />
                                    <col className="w-28" />
                                    <col className="w-24" />
                                </colgroup>
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="py-3 px-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            サムネ
                                        </th>
                                        <th className="py-3 px-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            タイトル
                                        </th>
                                        <th className="py-3 px-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            シリーズ
                                        </th>
                                        <th className="py-3 px-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            声優
                                        </th>
                                        <th className="py-3 px-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            発売日
                                        </th>
                                        <th className="py-3 px-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            更新日
                                        </th>
                                        <th className="py-3 px-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            操作
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredProducts.map((product) => (
                                        <tr key={product.id} className="hover:bg-gray-50">
                                            <td className="py-3 px-2">
                                                {product.thumbnailUrl ? (
                                                    <img
                                                        src={product.thumbnailUrl}
                                                        alt={product.title}
                                                        className="h-12 w-12 object-cover rounded"
                                                    />
                                                ) : (
                                                    <div className="h-12 w-12 bg-gray-100 flex items-center justify-center rounded">
                                                        <span className="text-gray-400 text-xs">なし</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-3 px-2">
                                                <div
                                                    className="text-sm font-medium text-gray-900 truncate w-full block"
                                                    title={product.title}
                                                >
                                                    {product.title}
                                                </div>
                                            </td>
                                            <td className="py-3 px-2">
                                                <div className="text-sm text-gray-500 truncate w-full block" title={product.series || '-'}>
                                                    {product.series || '-'}
                                                </div>
                                            </td>
                                            <td className="py-3 px-2">
                                                <div className="text-sm text-gray-500 truncate w-full block" title={product.cast?.join(', ') || '-'}>
                                                    {product.cast && product.cast.length > 0 ? product.cast.join(', ') : '-'}
                                                </div>
                                            </td>
                                            <td className="py-3 px-2 whitespace-nowrap">
                                                <div className="text-sm text-gray-500">{product.releaseDate || '-'}</div>
                                            </td>
                                            <td className="py-3 px-2 whitespace-nowrap">
                                                <div className="text-sm text-gray-500">{product.updatedAt || '-'}</div>
                                            </td>
                                            <td className="py-3 px-2 whitespace-nowrap">
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
                </>
            )}
        </div>
    );
}
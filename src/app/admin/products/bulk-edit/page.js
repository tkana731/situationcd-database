'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, query, orderBy, limit } from 'firebase/firestore';
import Link from 'next/link';

// Firebaseの設定
const firebaseConfig = {
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

export default function BulkEditProductsPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [viewMode, setViewMode] = useState('basic'); // basic, details, sites
    const itemsPerPage = 30;
    const router = useRouter();

    // 初回データ読み込み
    useEffect(() => {
        fetchProducts();
    }, [page]);

    // 製品データの取得
    const fetchProducts = async () => {
        try {
            setLoading(true);
            const productsQuery = query(
                collection(db, 'products'),
                orderBy('updatedAt', 'desc'),
                limit(itemsPerPage)
            );

            const querySnapshot = await getDocs(productsQuery);

            // 最後のドキュメントを取得して次のページングに使用
            // 実際の実装ではstartAfterを使って続きを取得する必要があります

            const productsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                // 編集フラグを追加（変更検知用）
                isEdited: false
            }));

            setProducts(productsData);
            setHasMore(productsData.length === itemsPerPage);
        } catch (err) {
            console.error('Error fetching products:', err);
            setError('作品データの取得に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    // フィールド変更のハンドラ
    const handleChange = (index, field, value) => {
        const updatedProducts = [...products];
        updatedProducts[index][field] = value;
        updatedProducts[index].isEdited = true;
        setProducts(updatedProducts);
    };

    // タグ入力のハンドラ
    const handleTagsChange = (index, value) => {
        const tagsArray = value.split(',')
            .map(item => item.trim())
            .filter(item => item !== '');

        const updatedProducts = [...products];
        updatedProducts[index].tags = tagsArray;
        updatedProducts[index].isEdited = true;
        setProducts(updatedProducts);
    };

    // 声優入力のハンドラ
    const handleCastChange = (index, value) => {
        const castArray = value.split(',')
            .map(item => item.trim())
            .filter(item => item !== '');

        const updatedProducts = [...products];
        updatedProducts[index].cast = castArray;
        updatedProducts[index].isEdited = true;
        setProducts(updatedProducts);
    };

    // 一括保存処理
    const handleBulkSave = async () => {
        setSaving(true);
        setError(null);
        setSuccessMessage('');

        try {
            // 変更があった製品だけを保存
            const editedProducts = products.filter(product => product.isEdited);

            if (editedProducts.length === 0) {
                setSuccessMessage('変更はありませんでした');
                setSaving(false);
                return;
            }

            // 一括更新処理
            const updatePromises = editedProducts.map(product => {
                const { isEdited, ...productData } = product;
                productData.updatedAt = new Date();
                return updateDoc(doc(db, 'products', product.id), productData);
            });

            await Promise.all(updatePromises);

            setSuccessMessage(`${editedProducts.length}件の作品情報を更新しました`);

            // 変更フラグをリセット
            const updatedProducts = products.map(product => ({
                ...product,
                isEdited: false
            }));
            setProducts(updatedProducts);
        } catch (err) {
            console.error('Error saving products:', err);
            setError('保存に失敗しました');
        } finally {
            setSaving(false);
        }
    };

    // 次のページを読み込む
    const loadNextPage = () => {
        setPage(prev => prev + 1);
    };

    // 前のページに戻る
    const loadPrevPage = () => {
        if (page > 1) {
            setPage(prev => prev - 1);
        }
    };

    // 表示モード切り替えボタン
    const getViewTabs = () => {
        return (
            <div className="flex border-b mb-4">
                <button
                    onClick={() => setViewMode('basic')}
                    className={`px-4 py-2 ${viewMode === 'basic'
                        ? 'border-b-2 border-blue-500 text-blue-500 font-medium'
                        : 'text-gray-600'}`}
                >
                    基本情報
                </button>
                <button
                    onClick={() => setViewMode('details')}
                    className={`px-4 py-2 ${viewMode === 'details'
                        ? 'border-b-2 border-blue-500 text-blue-500 font-medium'
                        : 'text-gray-600'}`}
                >
                    声優・タグ
                </button>
                <button
                    onClick={() => setViewMode('sites')}
                    className={`px-4 py-2 ${viewMode === 'sites'
                        ? 'border-b-2 border-blue-500 text-blue-500 font-medium'
                        : 'text-gray-600'}`}
                >
                    販売サイト情報
                </button>
            </div>
        );
    }

    // 表示モード別のテーブル取得
    const getTableContent = () => {
        if (viewMode === 'basic') {
            return (
                <table className="min-w-full bg-white border">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="py-2 px-3 border text-left">ID</th>
                            <th className="py-2 px-3 border text-left">サムネイル</th>
                            <th className="py-2 px-3 border text-left">タイトル</th>
                            <th className="py-2 px-3 border text-left">シリーズ</th>
                            <th className="py-2 px-3 border text-left">発売日</th>
                            <th className="py-2 px-3 border text-left">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((product, index) => (
                            <tr key={product.id} className={product.isEdited ? "bg-yellow-50" : ""}>
                                <td className="py-2 px-3 border">
                                    <div className="w-16 truncate">{product.id}</div>
                                </td>
                                <td className="py-2 px-3 border">
                                    {product.thumbnailUrl ? (
                                        <img
                                            src={product.thumbnailUrl}
                                            alt={product.title}
                                            className="h-12 w-12 object-cover rounded"
                                        />
                                    ) : (
                                        <div className="h-12 w-12 bg-gray-100 flex items-center justify-center rounded">
                                            <span className="text-gray-400 text-xs">画像なし</span>
                                        </div>
                                    )}
                                </td>
                                <td className="py-2 px-3 border">
                                    <input
                                        type="text"
                                        value={product.title || ''}
                                        onChange={(e) => handleChange(index, 'title', e.target.value)}
                                        className="w-full px-2 py-1 border border-gray-300 rounded"
                                    />
                                </td>
                                <td className="py-2 px-3 border">
                                    <input
                                        type="text"
                                        value={product.series || ''}
                                        onChange={(e) => handleChange(index, 'series', e.target.value)}
                                        className="w-full px-2 py-1 border border-gray-300 rounded"
                                    />
                                </td>
                                <td className="py-2 px-3 border">
                                    <input
                                        type="text"
                                        value={product.releaseDate || ''}
                                        onChange={(e) => handleChange(index, 'releaseDate', e.target.value)}
                                        placeholder="YYYY/MM/DD"
                                        className="w-full px-2 py-1 border border-gray-300 rounded"
                                    />
                                </td>
                                <td className="py-2 px-3 border">
                                    <Link
                                        href={`/admin/products/edit?id=${product.id}`}
                                        className="text-blue-600 hover:text-blue-800 block text-center"
                                    >
                                        詳細
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        } else if (viewMode === 'details') {
            return (
                <table className="min-w-full bg-white border">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="py-2 px-3 border text-left">ID</th>
                            <th className="py-2 px-3 border text-left">タイトル</th>
                            <th className="py-2 px-3 border text-left">声優</th>
                            <th className="py-2 px-3 border text-left">タグ</th>
                            <th className="py-2 px-3 border text-left">制作会社</th>
                            <th className="py-2 px-3 border text-left">サムネイルURL</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((product, index) => (
                            <tr key={product.id} className={product.isEdited ? "bg-yellow-50" : ""}>
                                <td className="py-2 px-3 border">
                                    <div className="w-16 truncate">{product.id}</div>
                                </td>
                                <td className="py-2 px-3 border">
                                    <div className="font-medium">{product.title}</div>
                                </td>
                                <td className="py-2 px-3 border">
                                    <input
                                        type="text"
                                        value={Array.isArray(product.cast) ? product.cast.join(', ') : ''}
                                        onChange={(e) => handleCastChange(index, e.target.value)}
                                        className="w-full px-2 py-1 border border-gray-300 rounded"
                                        placeholder="声優1, 声優2"
                                    />
                                </td>
                                <td className="py-2 px-3 border">
                                    <input
                                        type="text"
                                        value={Array.isArray(product.tags) ? product.tags.join(', ') : ''}
                                        onChange={(e) => handleTagsChange(index, e.target.value)}
                                        className="w-full px-2 py-1 border border-gray-300 rounded"
                                        placeholder="タグ1, タグ2"
                                    />
                                </td>
                                <td className="py-2 px-3 border">
                                    <input
                                        type="text"
                                        value={product.maker || ''}
                                        onChange={(e) => handleChange(index, 'maker', e.target.value)}
                                        className="w-full px-2 py-1 border border-gray-300 rounded"
                                    />
                                </td>
                                <td className="py-2 px-3 border">
                                    <input
                                        type="text"
                                        value={product.thumbnailUrl || ''}
                                        onChange={(e) => handleChange(index, 'thumbnailUrl', e.target.value)}
                                        className="w-full px-2 py-1 border border-gray-300 rounded"
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        } else {
            // サイト情報表示モード
            return (
                <table className="min-w-full bg-white border">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="py-2 px-3 border text-left">タイトル</th>
                            <th className="py-2 px-3 border text-left">DLsiteがるまにURL</th>
                            <th className="py-2 px-3 border text-left">DLsite特典</th>
                            <th className="py-2 px-3 border text-left">ポケドラURL</th>
                            <th className="py-2 px-3 border text-left">ポケドラ特典</th>
                            <th className="py-2 px-3 border text-left">ステラプレイヤーURL</th>
                            <th className="py-2 px-3 border text-left">ステラプレイヤー特典</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((product, index) => (
                            <tr key={product.id} className={product.isEdited ? "bg-yellow-50" : ""}>
                                <td className="py-2 px-3 border">
                                    <div className="font-medium">{product.title}</div>
                                </td>
                                <td className="py-2 px-3 border">
                                    <input
                                        type="text"
                                        value={product.dlsiteUrl || ''}
                                        onChange={(e) => handleChange(index, 'dlsiteUrl', e.target.value)}
                                        className="w-full px-2 py-1 border border-gray-300 rounded"
                                    />
                                </td>
                                <td className="py-2 px-3 border">
                                    <textarea
                                        value={product.dlsiteBonus || ''}
                                        onChange={(e) => handleChange(index, 'dlsiteBonus', e.target.value)}
                                        className="w-full px-2 py-1 border border-gray-300 rounded"
                                        rows="2"
                                    />
                                </td>
                                <td className="py-2 px-3 border">
                                    <input
                                        type="text"
                                        value={product.pocketdramaUrl || ''}
                                        onChange={(e) => handleChange(index, 'pocketdramaUrl', e.target.value)}
                                        className="w-full px-2 py-1 border border-gray-300 rounded"
                                    />
                                </td>
                                <td className="py-2 px-3 border">
                                    <textarea
                                        value={product.pocketdramaBonus || ''}
                                        onChange={(e) => handleChange(index, 'pocketdramaBonus', e.target.value)}
                                        className="w-full px-2 py-1 border border-gray-300 rounded"
                                        rows="2"
                                    />
                                </td>
                                <td className="py-2 px-3 border">
                                    <input
                                        type="text"
                                        value={product.stellaplayerUrl || ''}
                                        onChange={(e) => handleChange(index, 'stellaplayerUrl', e.target.value)}
                                        className="w-full px-2 py-1 border border-gray-300 rounded"
                                    />
                                </td>
                                <td className="py-2 px-3 border">
                                    <textarea
                                        value={product.stellaplayerBonus || ''}
                                        onChange={(e) => handleChange(index, 'stellaplayerBonus', e.target.value)}
                                        className="w-full px-2 py-1 border border-gray-300 rounded"
                                        rows="2"
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
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

    return (
        <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">一括編集</h1>
                <div className="flex space-x-2">
                    <Link
                        href="/admin/products"
                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                    >
                        作品一覧に戻る
                    </Link>
                    <button
                        onClick={handleBulkSave}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:bg-blue-300"
                        disabled={saving}
                    >
                        {saving ? '保存中...' : '一括保存'}
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {successMessage && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                    {successMessage}
                </div>
            )}

            {/* 表示切り替えタブ */}
            {getViewTabs()}

            <div className="overflow-x-auto">
                {getTableContent()}
            </div>

            <div className="flex justify-between mt-6">
                <button
                    onClick={loadPrevPage}
                    disabled={page === 1}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
                >
                    前へ
                </button>
                <span className="py-2">ページ {page}</span>
                <button
                    onClick={loadNextPage}
                    disabled={!hasMore}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
                >
                    次へ
                </button>
            </div>
        </div>
    );
}
// src/app/admin/products/bulk-edit/page.js

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, addDoc, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
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

// ドキュメントIDに無効な文字を含む場合に安全な文字列に変換する関数
const safeDocumentId = (str) => {
    // スラッシュ(/)、ピリオド(.)、角括弧([])、二重引用符(")、アスタリスク(*)など
    // Firestoreで使用できない文字を置き換え
    return str.replace(/[\/\.\[\]\*"`]/g, '_');
};

export default function BulkEditProductsPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [viewMode, setViewMode] = useState('basic'); // basic, details, sites
    const [showAddForm, setShowAddForm] = useState(false); // 新規追加フォーム表示制御用の状態
    // 新規製品のテンプレートオブジェクト
    const newProductTemplate = {
        title: '',
        series: '',
        releaseDate: '',
        maker: '',
        cast: [],
        tags: [],
        thumbnailUrl: '',
        dlsiteUrl: '',
        dlsiteBonus: '',
        pocketdramaUrl: '',
        pocketdramaBonus: '',
        stellaplayerUrl: '',
        stellaplayerBonus: '',
        isNew: true // 新規製品を識別するフラグ
    };
    // 新規追加用のフォームデータ
    const [newProduct, setNewProduct] = useState({ ...newProductTemplate });
    // 新規追加用の配列型入力フィールド
    const [newCastInput, setNewCastInput] = useState('');
    const [newTagsInput, setNewTagsInput] = useState('');

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

    // 新規製品のフィールド変更ハンドラ
    const handleNewProductChange = (field, value) => {
        setNewProduct({
            ...newProduct,
            [field]: value
        });
    };

    // 新規製品の声優入力ハンドラ
    const handleNewCastChange = (value) => {
        setNewCastInput(value);
        const castArray = value.split(',')
            .map(item => item.trim())
            .filter(item => item !== '');

        setNewProduct({
            ...newProduct,
            cast: castArray
        });
    };

    // 新規製品のタグ入力ハンドラ
    const handleNewTagsChange = (value) => {
        setNewTagsInput(value);
        const tagsArray = value.split(',')
            .map(item => item.trim())
            .filter(item => item !== '');

        setNewProduct({
            ...newProduct,
            tags: tagsArray
        });
    };

    // 新規追加ボタンのハンドラ
    const handleAddNewProduct = () => {
        setShowAddForm(!showAddForm);
        if (!showAddForm) {
            // フォームを表示する場合、フォームデータをリセット
            setNewProduct({ ...newProductTemplate });
            setNewCastInput('');
            setNewTagsInput('');
        }
    };

    // 新規製品を一時リストに追加
    const handleAddToList = () => {
        if (!newProduct.title) {
            setError('タイトルは必須項目です');
            return;
        }

        // 新規製品を製品リストに追加
        setProducts([{
            ...newProduct,
            id: `new-${Date.now()}`, // 一時的なIDを割り当て
            isNew: true // 新規フラグを設定
        }, ...products]);

        // フォームをリセット
        setNewProduct({ ...newProductTemplate });
        setNewCastInput('');
        setNewTagsInput('');
        setShowAddForm(false);
        setSuccessMessage('新規作品を一時リストに追加しました（保存するには「一括保存」ボタンをクリックしてください）');
    };

    // 一括保存処理
    const handleBulkSave = async () => {
        setSaving(true);
        setError(null);
        setSuccessMessage('');

        try {
            // 新規製品と編集済み製品を分ける
            const newProducts = products.filter(product => product.isNew);
            const editedProducts = products.filter(product => product.isEdited && !product.isNew);

            if (newProducts.length === 0 && editedProducts.length === 0) {
                setSuccessMessage('変更はありませんでした');
                setSaving(false);
                return;
            }

            // 新規製品の追加処理
            const addPromises = newProducts.map(product => {
                // 一時IDなどの内部使用フィールドを削除
                const { isNew, isEdited, id, ...productData } = product;
                // タイムスタンプを追加
                productData.createdAt = serverTimestamp();
                productData.updatedAt = serverTimestamp();
                // Firestoreに追加
                return addDoc(collection(db, 'products'), productData);
            });

            // 既存製品の更新処理
            const updatePromises = editedProducts.map(product => {
                const { isEdited, ...productData } = product;
                productData.updatedAt = serverTimestamp();
                return updateDoc(doc(db, 'products', product.id), productData);
            });

            // すべてのPromiseを実行する前に、タグと声優のデータを更新
            // 新規タグと声優のセットを収集
            const allNewTags = new Set();
            const allNewActors = new Set();

            // 追加・更新される製品からタグと声優を収集
            const productsToUpdate = [...newProducts, ...editedProducts];
            productsToUpdate.forEach(product => {
                if (product.tags && Array.isArray(product.tags)) {
                    product.tags.forEach(tag => allNewTags.add(tag));
                }
                if (product.cast && Array.isArray(product.cast)) {
                    product.cast.forEach(actor => allNewActors.add(actor));
                }
            });

            // タグ更新バッチを作成
            const tagBatch = writeBatch(db);
            for (const tag of allNewTags) {
                const safeTagId = safeDocumentId(tag);
                const tagRef = doc(db, 'tags', safeTagId);
                const tagDoc = await getDoc(tagRef);

                if (tagDoc.exists()) {
                    // 既存のタグは更新しない（別の処理で行う）
                } else {
                    // 新しいタグを作成
                    tagBatch.set(tagRef, {
                        name: tag,
                        count: 1,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp()
                    });
                }
            }
            await tagBatch.commit();

            // 声優更新バッチを作成
            const actorBatch = writeBatch(db);
            for (const actor of allNewActors) {
                const safeActorId = safeDocumentId(actor);
                const actorRef = doc(db, 'actors', safeActorId);
                const actorDoc = await getDoc(actorRef);

                if (actorDoc.exists()) {
                    // 既存の声優は更新しない（別の処理で行う）
                } else {
                    // 新しい声優を作成
                    actorBatch.set(actorRef, {
                        name: actor,
                        count: 1,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp()
                    });
                }
            }
            await actorBatch.commit();

            // すべてのPromiseを実行
            await Promise.all([...addPromises, ...updatePromises]);

            setSuccessMessage(`${newProducts.length}件の作品を追加、${editedProducts.length}件の作品を更新しました`);

            // 変更フラグをリセットし、新規製品をリストから削除
            const updatedProducts = products
                .filter(product => !product.isNew)  // 新規製品を除外
                .map(product => ({
                    ...product,
                    isEdited: false
                }));
            setProducts(updatedProducts);

            // データを再取得
            fetchProducts();
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

    // 新規追加フォーム
    const getAddProductForm = () => {
        if (!showAddForm) return null;

        if (viewMode === 'basic') {
            return (
                <div className="bg-blue-50 p-4 rounded-lg mb-4 border border-blue-200">
                    <h3 className="text-lg font-semibold mb-4">新規作品の追加</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                タイトル <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={newProduct.title}
                                onChange={(e) => handleNewProductChange('title', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded"
                                rows="2"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                シリーズ
                            </label>
                            <input
                                type="text"
                                value={newProduct.series || ''}
                                onChange={(e) => handleNewProductChange('series', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                発売日
                            </label>
                            <input
                                type="text"
                                value={newProduct.releaseDate || ''}
                                onChange={(e) => handleNewProductChange('releaseDate', e.target.value)}
                                placeholder="YYYY/MM/DD"
                                className="w-full px-2 py-1 border border-gray-300 rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                制作会社
                            </label>
                            <input
                                type="text"
                                value={newProduct.maker || ''}
                                onChange={(e) => handleNewProductChange('maker', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                サムネイルURL
                            </label>
                            <input
                                type="text"
                                value={newProduct.thumbnailUrl || ''}
                                onChange={(e) => handleNewProductChange('thumbnailUrl', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={() => setShowAddForm(false)}
                            className="px-4 py-2 border border-gray-300 rounded mr-2 text-gray-600 hover:bg-gray-100"
                        >
                            キャンセル
                        </button>
                        <button
                            type="button"
                            onClick={handleAddToList}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            リストに追加
                        </button>
                    </div>
                </div>
            );
        } else if (viewMode === 'details') {
            return (
                <div className="bg-blue-50 p-4 rounded-lg mb-4 border border-blue-200">
                    <h3 className="text-lg font-semibold mb-4">新規作品の追加 - 声優・タグ</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                声優 (カンマ区切りで複数入力可)
                            </label>
                            <textarea
                                value={newCastInput}
                                onChange={(e) => handleNewCastChange(e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded"
                                placeholder="声優1, 声優2"
                                rows="3"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                タグ (カンマ区切りで複数入力可)
                            </label>
                            <textarea
                                value={newTagsInput}
                                onChange={(e) => handleNewTagsChange(e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded"
                                placeholder="タグ1, タグ2"
                                rows="3"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={() => setShowAddForm(false)}
                            className="px-4 py-2 border border-gray-300 rounded mr-2 text-gray-600 hover:bg-gray-100"
                        >
                            キャンセル
                        </button>
                        <button
                            type="button"
                            onClick={handleAddToList}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            リストに追加
                        </button>
                    </div>
                </div>
            );
        } else if (viewMode === 'sites') {
            return (
                <div className="bg-blue-50 p-4 rounded-lg mb-4 border border-blue-200">
                    <h3 className="text-lg font-semibold mb-4">新規作品の追加 - 販売サイト情報</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                DLsiteがるまにURL
                            </label>
                            <input
                                type="text"
                                value={newProduct.dlsiteUrl || ''}
                                onChange={(e) => handleNewProductChange('dlsiteUrl', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                DLsite特典
                            </label>
                            <textarea
                                value={newProduct.dlsiteBonus || ''}
                                onChange={(e) => handleNewProductChange('dlsiteBonus', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded"
                                rows="2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                ポケドラURL
                            </label>
                            <input
                                type="text"
                                value={newProduct.pocketdramaUrl || ''}
                                onChange={(e) => handleNewProductChange('pocketdramaUrl', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                ポケドラ特典
                            </label>
                            <textarea
                                value={newProduct.pocketdramaBonus || ''}
                                onChange={(e) => handleNewProductChange('pocketdramaBonus', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded"
                                rows="2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                ステラプレイヤーURL
                            </label>
                            <input
                                type="text"
                                value={newProduct.stellaplayerUrl || ''}
                                onChange={(e) => handleNewProductChange('stellaplayerUrl', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                ステラプレイヤー特典
                            </label>
                            <textarea
                                value={newProduct.stellaplayerBonus || ''}
                                onChange={(e) => handleNewProductChange('stellaplayerBonus', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded"
                                rows="2"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={() => setShowAddForm(false)}
                            className="px-4 py-2 border border-gray-300 rounded mr-2 text-gray-600 hover:bg-gray-100"
                        >
                            キャンセル
                        </button>
                        <button
                            type="button"
                            onClick={handleAddToList}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            リストに追加
                        </button>
                    </div>
                </div>
            );
        }
    };

    // 表示モード別のテーブル取得
    const getTableContent = () => {
        // 基本情報ビューのテーブル部分（タイトル入力をテキストエリアに変更）
        if (viewMode === 'basic') {
            return (
                <table className="min-w-full bg-white border">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="py-2 px-3 border text-left">ID</th>
                            <th className="py-2 px-3 border text-left">サムネイル</th>
                            <th className="py-2 px-3 border text-left" width="30%">タイトル</th>
                            <th className="py-2 px-3 border text-left">シリーズ</th>
                            <th className="py-2 px-3 border text-left">発売日</th>
                            <th className="py-2 px-3 border text-left">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((product, index) => (
                            <tr key={product.id} className={`${product.isEdited ? "bg-yellow-50" : ""} ${product.isNew ? "bg-green-50" : ""}`}>
                                <td className="py-2 px-3 border">
                                    <div className="w-16 truncate">{product.isNew ? "新規" : product.id}</div>
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
                                    <textarea
                                        value={product.title || ''}
                                        onChange={(e) => handleChange(index, 'title', e.target.value)}
                                        className="w-full px-2 py-1 border border-gray-300 rounded resize-y"
                                        rows="2"
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
                                    {!product.isNew && (
                                        <Link
                                            href={`/admin/products/edit?id=${product.id}`}
                                            className="text-blue-600 hover:text-blue-800 block text-center"
                                        >
                                            詳細
                                        </Link>
                                    )}
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
                            <th className="py-2 px-3 border text-left" width="25%">タイトル</th>
                            <th className="py-2 px-3 border text-left">声優</th>
                            <th className="py-2 px-3 border text-left">タグ</th>
                            <th className="py-2 px-3 border text-left">制作会社</th>
                            <th className="py-2 px-3 border text-left">サムネイルURL</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((product, index) => (
                            <tr key={product.id} className={`${product.isEdited ? "bg-yellow-50" : ""} ${product.isNew ? "bg-green-50" : ""}`}>
                                <td className="py-2 px-3 border">
                                    <div className="w-16 truncate">{product.isNew ? "新規" : product.id}</div>
                                </td>
                                <td className="py-2 px-3 border">
                                    <textarea
                                        value={product.title || ''}
                                        onChange={(e) => handleChange(index, 'title', e.target.value)}
                                        className="w-full px-2 py-1 border border-gray-300 rounded resize-y"
                                        rows="2"
                                        readOnly
                                    />
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
                            <th className="py-2 px-3 border text-left" width="25%">タイトル</th>
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
                            <tr key={product.id} className={`${product.isEdited ? "bg-yellow-50" : ""} ${product.isNew ? "bg-green-50" : ""}`}>
                                <td className="py-2 px-3 border">
                                    <textarea
                                        value={product.title || ''}
                                        className="w-full px-2 py-1 border border-gray-300 rounded resize-y bg-gray-50"
                                        rows="2"
                                        readOnly
                                    />
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

            <div className="flex justify-between items-center mb-4">
                <div>
                    <span className="text-sm text-gray-600">
                        <span className="inline-block w-3 h-3 bg-green-50 border border-green-200 mr-1"></span>
                        新規追加
                    </span>
                    <span className="text-sm text-gray-600 ml-4">
                        <span className="inline-block w-3 h-3 bg-yellow-50 border border-yellow-200 mr-1"></span>
                        編集済み
                    </span>
                </div>
                <button
                    onClick={handleAddNewProduct}
                    className="flex items-center px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                    {showAddForm ? '追加をキャンセル' : '新規作品を追加'}
                </button>
            </div>

            {/* 新規作品追加フォーム */}
            {getAddProductForm()}

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
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { initializeApp } from 'firebase/app';
import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    serverTimestamp,
    Timestamp,
    collection,
    query,
    where,
    getDocs,
    increment,
    writeBatch,
    runTransaction
} from 'firebase/firestore';

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

export default function ProductForm({ productId }) {
    const router = useRouter();
    const isNewProduct = productId === 'new';

    // 作品データの状態
    const [product, setProduct] = useState({
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
        stellaplayerBonus: ''
    });

    // 元の状態を保持（差分計算用）
    const [originalProduct, setOriginalProduct] = useState({
        cast: [],
        tags: []
    });

    // 配列型フィールドの入力値を別で管理
    const [castInput, setCastInput] = useState('');
    const [tagsInput, setTagsInput] = useState('');

    const [loading, setLoading] = useState(!isNewProduct);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    // 新規追加の場合は既存データを読み込む
    useEffect(() => {
        const fetchProduct = async () => {
            if (isNewProduct) {
                setLoading(false);
                return;
            }

            try {
                const docRef = doc(db, 'products', productId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();

                    // リリース日をフォームで扱いやすい形式に変換
                    let formattedReleaseDate = '';
                    if (data.releaseDate) {
                        if (data.releaseDate instanceof Timestamp) {
                            const date = data.releaseDate.toDate();
                            formattedReleaseDate = date.toISOString().split('T')[0]; // YYYY-MM-DD形式
                        } else if (typeof data.releaseDate === 'string') {
                            formattedReleaseDate = data.releaseDate;
                        }
                    }

                    // 配列型フィールドの処理
                    const cast = Array.isArray(data.cast) ? data.cast : [];
                    const tags = Array.isArray(data.tags) ? data.tags : [];

                    // 入力用の文字列も設定
                    setCastInput(cast.join(', '));
                    setTagsInput(tags.join(', '));

                    const processedProduct = {
                        ...data,
                        releaseDate: formattedReleaseDate,
                        cast: cast,
                        tags: tags
                    };

                    setProduct(processedProduct);
                    setOriginalProduct({
                        cast: [...cast], // 配列のコピーを作成
                        tags: [...tags]  // 配列のコピーを作成
                    });
                } else {
                    setError('指定された作品が見つかりません');
                }
            } catch (err) {
                console.error('Error fetching product:', err);
                setError('作品データの取得に失敗しました');
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [productId, isNewProduct]);

    // フィールド変更のハンドラ
    const handleChange = (e) => {
        const { name, value } = e.target;
        setProduct({
            ...product,
            [name]: value
        });
    };

    // 配列型フィールド変更のハンドラ
    const handleCastChange = (e) => {
        const value = e.target.value;
        setCastInput(value);

        const castArray = value.split(',')
            .map(item => item.trim())
            .filter(item => item !== '');

        setProduct({
            ...product,
            cast: castArray
        });
    };

    const handleTagsChange = (e) => {
        const value = e.target.value;
        setTagsInput(value);

        const tagsArray = value.split(',')
            .map(item => item.trim())
            .filter(item => item !== '');

        setProduct({
            ...product,
            tags: tagsArray
        });
    };

    // タグコレクションを更新する関数
    const updateTagsCollection = async (oldTags, newTags) => {
        try {
            const batch = writeBatch(db);

            // 削除されたタグの処理
            const removedTags = oldTags.filter(tag => !newTags.includes(tag));
            for (const tag of removedTags) {
                const tagRef = doc(db, 'tags', tag);
                const tagDoc = await getDoc(tagRef);

                if (tagDoc.exists()) {
                    const currentCount = tagDoc.data().count || 0;
                    if (currentCount <= 1) {
                        // カウントが1以下ならドキュメントを削除
                        batch.delete(tagRef);
                    } else {
                        // カウントを減らす
                        batch.update(tagRef, {
                            count: increment(-1),
                            updatedAt: serverTimestamp()
                        });
                    }
                }
            }

            // 追加されたタグの処理
            const addedTags = newTags.filter(tag => !oldTags.includes(tag));
            for (const tag of addedTags) {
                const tagRef = doc(db, 'tags', tag);
                const tagDoc = await getDoc(tagRef);

                if (tagDoc.exists()) {
                    // 既存のタグならカウントを増やす
                    batch.update(tagRef, {
                        count: increment(1),
                        updatedAt: serverTimestamp()
                    });
                } else {
                    // 新しいタグなら作成
                    batch.set(tagRef, {
                        name: tag,
                        count: 1,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp()
                    });
                }
            }

            // バッチ処理を実行
            await batch.commit();
            console.log('Tags collection updated successfully');
        } catch (err) {
            console.error('Error updating tags collection:', err);
            // エラーは表示するだけで処理は継続
            setError(prev => prev ? `${prev}、タグの更新に失敗しました` : 'タグの更新に失敗しました');
        }
    };

    // 声優コレクションを更新する関数
    const updateActorsCollection = async (oldActors, newActors) => {
        try {
            const batch = writeBatch(db);

            // 削除された声優の処理
            const removedActors = oldActors.filter(actor => !newActors.includes(actor));
            for (const actor of removedActors) {
                const actorRef = doc(db, 'actors', actor);
                const actorDoc = await getDoc(actorRef);

                if (actorDoc.exists()) {
                    const currentCount = actorDoc.data().count || 0;
                    if (currentCount <= 1) {
                        // カウントが1以下ならドキュメントを削除
                        batch.delete(actorRef);
                    } else {
                        // カウントを減らす
                        batch.update(actorRef, {
                            count: increment(-1),
                            updatedAt: serverTimestamp()
                        });
                    }
                }
            }

            // 追加された声優の処理
            const addedActors = newActors.filter(actor => !oldActors.includes(actor));
            for (const actor of addedActors) {
                const actorRef = doc(db, 'actors', actor);
                const actorDoc = await getDoc(actorRef);

                if (actorDoc.exists()) {
                    // 既存の声優ならカウントを増やす
                    batch.update(actorRef, {
                        count: increment(1),
                        updatedAt: serverTimestamp()
                    });
                } else {
                    // 新しい声優なら作成
                    batch.set(actorRef, {
                        name: actor,
                        count: 1,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp()
                    });
                }
            }

            // バッチ処理を実行
            await batch.commit();
            console.log('Actors collection updated successfully');
        } catch (err) {
            console.error('Error updating actors collection:', err);
            // エラーは表示するだけで処理は継続
            setError(prev => prev ? `${prev}、声優情報の更新に失敗しました` : '声優情報の更新に失敗しました');
        }
    };

    // 保存処理
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccessMessage('');

        try {
            const productData = {
                ...product,
                updatedAt: serverTimestamp()
            };

            // リリース日の処理
            if (product.releaseDate) {
                try {
                    const dateParts = product.releaseDate.split('-');
                    if (dateParts.length === 3) {
                        const year = parseInt(dateParts[0]);
                        const month = parseInt(dateParts[1]) - 1; // JavaScriptの月は0から始まる
                        const day = parseInt(dateParts[2]);
                        productData.releaseDate = new Date(year, month, day);
                    } else {
                        productData.releaseDate = product.releaseDate; // 文字列のまま
                    }
                } catch (err) {
                    productData.releaseDate = product.releaseDate; // 変換エラーの場合は文字列のまま
                }
            }

            if (isNewProduct) {
                // 新規作成
                productData.createdAt = serverTimestamp();
                const newDocRef = doc(collection(db, 'products'));
                await setDoc(newDocRef, productData);

                // タグと声優情報を更新
                await updateTagsCollection([], productData.tags);
                await updateActorsCollection([], productData.cast);

                setSuccessMessage('作品を新規登録しました');
                router.push('/admin/products');
            } else {
                // 更新
                const docRef = doc(db, 'products', productId);
                await updateDoc(docRef, productData);

                // タグと声優情報を更新（差分を計算）
                await updateTagsCollection(originalProduct.tags, productData.tags);
                await updateActorsCollection(originalProduct.cast, productData.cast);

                setSuccessMessage('作品情報を更新しました');
            }
        } catch (err) {
            console.error('Error saving product:', err);
            setError('保存に失敗しました');
        } finally {
            setSaving(false);
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
            <h1 className="text-2xl font-bold mb-6">
                {isNewProduct ? '新規作品登録' : '作品情報編集'}
            </h1>

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

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 基本情報 */}
                    <div className="md:col-span-2">
                        <h2 className="text-lg font-semibold mb-4 pb-2 border-b">基本情報</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                タイトル <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={product.title}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                シリーズ名
                            </label>
                            <input
                                type="text"
                                name="series"
                                value={product.series || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                制作会社
                            </label>
                            <input
                                type="text"
                                name="maker"
                                value={product.maker || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                発売日
                            </label>
                            <input
                                type="date"
                                name="releaseDate"
                                value={product.releaseDate || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                サムネイル画像URL
                            </label>
                            <input
                                type="url"
                                name="thumbnailUrl"
                                value={product.thumbnailUrl || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="https://example.com/image.jpg"
                            />
                            {product.thumbnailUrl && (
                                <div className="mt-2">
                                    <img
                                        src={product.thumbnailUrl}
                                        alt="サムネイル"
                                        className="h-20 w-20 object-cover rounded"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = '/api/placeholder/200/200';
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 声優とタグ */}
                    <div className="md:col-span-2">
                        <h2 className="text-lg font-semibold mb-4 pb-2 border-b">声優とタグ</h2>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            声優 (カンマ区切りで複数入力可)
                        </label>
                        <textarea
                            name="cast"
                            value={castInput}
                            onChange={handleCastChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="3"
                            placeholder="声優1, 声優2, 声優3"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            追加・削除を行うと声優一覧データも自動的に更新されます
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            タグ (カンマ区切りで複数入力可)
                        </label>
                        <textarea
                            name="tags"
                            value={tagsInput}
                            onChange={handleTagsChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="3"
                            placeholder="タグ1, タグ2, タグ3"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            追加・削除を行うとタグ一覧データも自動的に更新されます
                        </p>
                    </div>

                    {/* 販売情報 */}
                    <div className="md:col-span-2">
                        <h2 className="text-lg font-semibold mb-4 pb-2 border-b">販売情報</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                DLsiteがるまにURL
                            </label>
                            <input
                                type="url"
                                name="dlsiteUrl"
                                value={product.dlsiteUrl || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="https://www.dlsite.com/..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                DLsiteがるまに特典情報
                            </label>
                            <textarea
                                name="dlsiteBonus"
                                value={product.dlsiteBonus || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows="2"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                ポケットドラマCD URL
                            </label>
                            <input
                                type="url"
                                name="pocketdramaUrl"
                                value={product.pocketdramaUrl || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="https://pocketdrama.jp/..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                ポケドラ特典情報
                            </label>
                            <textarea
                                name="pocketdramaBonus"
                                value={product.pocketdramaBonus || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows="2"
                            />
                        </div>
                    </div>

                    <div className="md:col-span-2 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                ステラプレイヤー URL
                            </label>
                            <input
                                type="url"
                                name="stellaplayerUrl"
                                value={product.stellaplayerUrl || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="https://stella-player.jp/..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                ステラプレイヤー特典情報
                            </label>
                            <textarea
                                name="stellaplayerBonus"
                                value={product.stellaplayerBonus || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows="2"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                        type="button"
                        onClick={() => router.push('/admin/products')}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        disabled={saving}
                    >
                        キャンセル
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300"
                        disabled={saving}
                    >
                        {saving ? '保存中...' : (isNewProduct ? '登録する' : '更新する')}
                    </button>
                </div>
            </form>
        </div>
    );
}
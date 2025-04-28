// /src/app/components/admin/ProductForm.js

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
import { getAllBonuses, addBonus } from '../../../lib/firebase/bonuses'; // addBonusを追加
import Link from 'next/link';
import { Gift, Search, Plus, X, Check } from 'lucide-react'; // アイコンを追加

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
        pocketdramaUrl: '',
        stellaplayerUrl: ''
    });

    // 特典情報の状態 (修正)
    const [allBonuses, setAllBonuses] = useState([]);
    const [selectedBonuses, setSelectedBonuses] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredBonuses, setFilteredBonuses] = useState([]);
    const [showNewBonusForm, setShowNewBonusForm] = useState(false);
    const [newBonus, setNewBonus] = useState({
        name: '',
        type: '購入特典',
        conditions: '',
        castList: [],
        sites: {
            dlsite: false,
            pocketdrama: false,
            stellaplayer: false
        }
    });
    const [castInput, setCastInput] = useState('');
    const [newBonusCastInput, setNewBonusCastInput] = useState('');

    // 元の状態を保持（差分計算用）
    const [originalProduct, setOriginalProduct] = useState({
        cast: [],
        tags: []
    });

    // 配列型フィールドの入力値を別で管理
    const [tagsInput, setTagsInput] = useState('');

    const [loading, setLoading] = useState(!isNewProduct);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    // 新規追加の場合は既存データを読み込む
    useEffect(() => {
        const fetchData = async () => {
            try {
                // 特典データの取得 (追加)
                const bonusesData = await getAllBonuses();
                setAllBonuses(bonusesData);
                setFilteredBonuses(bonusesData);

                if (isNewProduct) {
                    setLoading(false);
                    return;
                }

                const docRef = doc(db, 'products', productId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();

                    // リリース日をフォームで扱いやすい形式に変換
                    let formattedReleaseDate = '';
                    if (data.releaseDate) {
                        if (data.releaseDate instanceof Timestamp) {
                            const date = data.releaseDate.toDate();
                            // yyyy-mm-dd形式の文字列に変換
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            formattedReleaseDate = `${year}-${month}-${day}`;
                        } else if (typeof data.releaseDate === 'string') {
                            // すでに文字列の場合はそのまま使用
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

                    // 特典情報をロード (修正)
                    if (bonusesData.length > 0) {
                        const productRelatedBonuses = bonusesData
                            .filter(bonus =>
                                (bonus.relatedProducts || []).some(rp => rp.productId === productId)
                            )
                            .map(bonus => {
                                // この製品に関連付けられているサイトを取得
                                const relatedProduct = bonus.relatedProducts.find(rp => rp.productId === productId);
                                return {
                                    ...bonus,
                                    sites: {
                                        dlsite: relatedProduct.sites.includes('dlsite'),
                                        pocketdrama: relatedProduct.sites.includes('pocketdrama'),
                                        stellaplayer: relatedProduct.sites.includes('stellaplayer')
                                    }
                                };
                            });

                        setSelectedBonuses(productRelatedBonuses);
                    }
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

        fetchData();
    }, [productId, isNewProduct]);

    // 検索クエリが変更されたときにフィルタリング
    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredBonuses(allBonuses);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = allBonuses.filter(bonus =>
                bonus.name.toLowerCase().includes(query) ||
                (bonus.conditions && bonus.conditions.toLowerCase().includes(query)) ||
                (Array.isArray(bonus.castList) && bonus.castList.some(cast =>
                    cast.toLowerCase().includes(query)
                ))
            );
            setFilteredBonuses(filtered);
        }
    }, [searchQuery, allBonuses]);

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

    // 特典選択の処理 (修正)
    const handleSelectBonus = (bonus) => {
        // 既に選択されている場合は選択を解除
        const existingIndex = selectedBonuses.findIndex(b => b.id === bonus.id);
        if (existingIndex >= 0) {
            setSelectedBonuses(prev => prev.filter(b => b.id !== bonus.id));
        } else {
            // 新規に選択する場合は、デフォルトで全サイトを選択
            setSelectedBonuses(prev => [
                ...prev,
                {
                    ...bonus,
                    sites: {
                        dlsite: true,
                        pocketdrama: true,
                        stellaplayer: true
                    }
                }
            ]);
        }
    };

    // 選択済み特典のサイト切り替え
    const handleBonusSiteToggle = (bonusId, site) => {
        setSelectedBonuses(prev =>
            prev.map(bonus =>
                bonus.id === bonusId
                    ? {
                        ...bonus,
                        sites: {
                            ...bonus.sites,
                            [site]: !bonus.sites[site]
                        }
                    }
                    : bonus
            )
        );
    };

    // 特典削除
    const handleRemoveBonus = (bonusId) => {
        setSelectedBonuses(prev => prev.filter(bonus => bonus.id !== bonusId));
    };

    // 新規特典フォーム操作
    const handleNewBonusChange = (e) => {
        const { name, value } = e.target;
        setNewBonus({
            ...newBonus,
            [name]: value
        });
    };

    const handleNewBonusCastChange = (e) => {
        const value = e.target.value;
        setNewBonusCastInput(value);

        const castArray = value.split(',')
            .map(item => item.trim())
            .filter(item => item !== '');

        setNewBonus({
            ...newBonus,
            castList: castArray
        });
    };

    const handleNewBonusSiteToggle = (site) => {
        setNewBonus(prev => ({
            ...prev,
            sites: {
                ...prev.sites,
                [site]: !prev.sites[site]
            }
        }));
    };

    const handleNewBonusSubmit = async () => {
        if (!newBonus.name) {
            alert('特典名を入力してください');
            return;
        }

        // サイトを選択しているか確認
        const selectedSites = Object.entries(newBonus.sites)
            .filter(([_, isSelected]) => isSelected)
            .map(([site, _]) => site);

        if (selectedSites.length === 0) {
            alert('少なくとも1つのサイトを選択してください');
            return;
        }

        try {
            // 特典データの準備
            const bonusData = {
                name: newBonus.name,
                type: newBonus.type,
                conditions: newBonus.conditions,
                castList: newBonus.castList,
                relatedProducts: [{
                    productId: isNewProduct ? 'temp-id' : productId,
                    sites: selectedSites
                }]
            };

            // 特典を追加
            const bonusId = await addBonus(bonusData);

            // 新しい特典をリストに追加
            const newBonusWithId = {
                id: bonusId,
                ...bonusData,
                sites: newBonus.sites
            };

            setAllBonuses(prev => [newBonusWithId, ...prev]);
            setFilteredBonuses(prev => [newBonusWithId, ...prev]);
            setSelectedBonuses(prev => [newBonusWithId, ...prev]);

            // フォームをリセット
            setNewBonus({
                name: '',
                type: '購入特典',
                conditions: '',
                castList: [],
                sites: {
                    dlsite: false,
                    pocketdrama: false,
                    stellaplayer: false
                }
            });
            setNewBonusCastInput('');
            setShowNewBonusForm(false);
            setSuccessMessage('新しい特典を追加しました');
        } catch (err) {
            console.error('Error adding new bonus:', err);
            setError('特典の追加に失敗しました');
        }
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

    // 特典コレクションの更新 (修正)
    const updateBonusCollection = async (actualProductId) => {
        try {
            const batch = writeBatch(db);

            // 全ての特典をチェック
            for (const bonus of allBonuses) {
                let needsUpdate = false;
                let relatedProducts = [...(bonus.relatedProducts || [])];

                // この特典が選択されているか確認
                const selectedBonus = selectedBonuses.find(b => b.id === bonus.id);

                // 既存の関連製品エントリを探す
                const existingEntryIndex = relatedProducts.findIndex(rp => rp.productId === actualProductId);

                if (selectedBonus) {
                    // この特典が選択されている場合
                    const selectedSites = Object.entries(selectedBonus.sites)
                        .filter(([_, isSelected]) => isSelected)
                        .map(([site, _]) => site);

                    if (selectedSites.length > 0) {
                        if (existingEntryIndex >= 0) {
                            // 既存のエントリを更新
                            if (JSON.stringify(relatedProducts[existingEntryIndex].sites.sort()) !== JSON.stringify(selectedSites.sort())) {
                                relatedProducts[existingEntryIndex].sites = selectedSites;
                                needsUpdate = true;
                            }
                        } else {
                            // 新しいエントリを追加
                            relatedProducts.push({
                                productId: actualProductId,
                                sites: selectedSites
                            });
                            needsUpdate = true;
                        }
                    } else {
                        // サイトが選択されていない場合、既存のエントリがあれば削除
                        if (existingEntryIndex >= 0) {
                            relatedProducts.splice(existingEntryIndex, 1);
                            needsUpdate = true;
                        }
                    }
                } else {
                    // この特典が選択されていない場合、既存のエントリがあれば削除
                    if (existingEntryIndex >= 0) {
                        relatedProducts.splice(existingEntryIndex, 1);
                        needsUpdate = true;
                    }
                }

                // 更新が必要な場合のみFirestoreを更新
                if (needsUpdate) {
                    const bonusRef = doc(db, 'bonuses', bonus.id);
                    batch.update(bonusRef, {
                        relatedProducts,
                        updatedAt: serverTimestamp()
                    });
                }
            }

            // バッチ処理を実行
            await batch.commit();
            console.log('Bonuses collection updated successfully');
        } catch (err) {
            console.error('Error updating bonuses collection:', err);
            setError(prev => prev ? `${prev}、特典情報の更新に失敗しました` : '特典情報の更新に失敗しました');
            throw err; // エラーを上位に伝播
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

            // 不要な特典情報フィールドを削除
            delete productData.dlsiteBonus;
            delete productData.pocketdramaBonus;
            delete productData.stellaplayerBonus;

            // リリース日の処理 - 文字列として保存
            if (product.releaseDate) {
                // フォームから取得した YYYY-MM-DD 形式の文字列をそのまま保存
                productData.releaseDate = product.releaseDate;
            } else {
                // 未設定の場合は明示的に null または空文字を設定
                productData.releaseDate = '';
            }

            let actualProductId = productId;

            if (isNewProduct) {
                // 新規作成
                productData.createdAt = serverTimestamp();
                const newDocRef = doc(collection(db, 'products'));
                await setDoc(newDocRef, productData);

                // タグと声優情報を更新
                await updateTagsCollection([], productData.tags);
                await updateActorsCollection([], productData.cast);

                // 製品IDを設定
                actualProductId = newDocRef.id;

                setSuccessMessage('作品を新規登録しました');

                // 特典情報を更新（新規製品ID使用）
                await updateBonusCollection(actualProductId);

                router.push('/admin/products');
            } else {
                // 更新
                const docRef = doc(db, 'products', productId);
                await updateDoc(docRef, productData);

                // タグと声優情報を更新（差分を計算）
                await updateTagsCollection(originalProduct.tags, productData.tags);
                await updateActorsCollection(originalProduct.cast, productData.cast);

                // 特典情報を更新
                await updateBonusCollection(actualProductId);

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
                                type="text"
                                name="releaseDate"
                                value={product.releaseDate || ''}
                                onChange={handleChange}
                                placeholder="YYYY/MM/DD"
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
                    </div>

                    {/* 特典情報管理 (修正) */}
                    <div className="md:col-span-2">
                        <h2 className="text-lg font-semibold mb-4 pb-2 border-b">特典情報</h2>
                    </div>

                    <div className="md:col-span-2">
                        {/* 特典検索・新規追加部分 */}
                        <div className="bg-gray-50 p-4 rounded-lg mb-6">
                            <div className="flex items-center mb-4">
                                <div className="relative flex-grow mr-4">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search size={16} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="特典を検索..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowNewBonusForm(!showNewBonusForm)}
                                    className="flex items-center bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                                >
                                    {showNewBonusForm ? (
                                        <>
                                            <X size={16} className="mr-1" />
                                            キャンセル
                                        </>
                                    ) : (
                                        <>
                                            <Plus size={16} className="mr-1" />
                                            新規特典を追加
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* 新規特典フォーム */}
                            {showNewBonusForm && (
                                <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
                                    <h3 className="text-lg font-medium mb-3">新規特典を追加</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                特典名 <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={newBonus.name}
                                                onChange={handleNewBonusChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                特典タイプ
                                            </label>
                                            <select
                                                name="type"
                                                value={newBonus.type}
                                                onChange={handleNewBonusChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="購入特典">購入特典</option>
                                                <option value="連動購入特典">連動購入特典</option>
                                                <option value="全巻購入特典">全巻購入特典</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                入手条件
                                            </label>
                                            <input
                                                type="text"
                                                name="conditions"
                                                value={newBonus.conditions}
                                                onChange={handleNewBonusChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="例: 2023年12月31日までの期間限定"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                出演声優 (カンマ区切りで複数入力可)
                                            </label>
                                            <input
                                                type="text"
                                                value={newBonusCastInput}
                                                onChange={handleNewBonusCastChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="声優1, 声優2"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                入手可能なサイト <span className="text-red-500">*</span>
                                            </label>
                                            <div className="flex flex-wrap gap-4">
                                                <div className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        id="new-dlsite"
                                                        checked={newBonus.sites.dlsite}
                                                        onChange={() => handleNewBonusSiteToggle('dlsite')}
                                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                                    />
                                                    <label htmlFor="new-dlsite" className="ml-2 text-sm text-gray-700">
                                                        DLsiteがるまに
                                                    </label>
                                                </div>
                                                <div className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        id="new-pocketdrama"
                                                        checked={newBonus.sites.pocketdrama}
                                                        onChange={() => handleNewBonusSiteToggle('pocketdrama')}
                                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                                    />
                                                    <label htmlFor="new-pocketdrama" className="ml-2 text-sm text-gray-700">
                                                        ポケットドラマCD
                                                    </label>
                                                </div>
                                                <div className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        id="new-stellaplayer"
                                                        checked={newBonus.sites.stellaplayer}
                                                        onChange={() => handleNewBonusSiteToggle('stellaplayer')}
                                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                                    />
                                                    <label htmlFor="new-stellaplayer" className="ml-2 text-sm text-gray-700">
                                                        ステラプレイヤー
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={handleNewBonusSubmit}
                                            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                                        >
                                            特典を追加
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* 検索結果一覧 */}
                            {!showNewBonusForm && filteredBonuses.length > 0 && (
                                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                    <div className="max-h-48 overflow-y-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        特典名
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        タイプ
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        出演声優
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        操作
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {filteredBonuses.map(bonus => {
                                                    const isSelected = selectedBonuses.some(b => b.id === bonus.id);
                                                    return (
                                                        <tr
                                                            key={bonus.id}
                                                            className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}
                                                        >
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm font-medium text-gray-900">{bonus.name}</div>
                                                                {bonus.conditions && (
                                                                    <div className="text-xs text-gray-500">{bonus.conditions}</div>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                                    ${bonus.type === '購入特典' ? 'bg-green-100 text-green-800' :
                                                                        bonus.type === '連動購入特典' ? 'bg-blue-100 text-blue-800' :
                                                                            'bg-purple-100 text-purple-800'}`}>
                                                                    {bonus.type}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm text-gray-500">
                                                                    {(bonus.castList || []).join(', ')}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleSelectBonus(bonus)}
                                                                    className={`px-3 py-1 rounded-md ${isSelected
                                                                            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                                            : 'bg-blue-500 text-white hover:bg-blue-600'
                                                                        }`}
                                                                >
                                                                    {isSelected ? '選択解除' : '選択'}
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {!showNewBonusForm && filteredBonuses.length === 0 && (
                                <div className="bg-white p-6 text-center border border-gray-200 rounded-lg">
                                    <p className="text-gray-500">検索条件に一致する特典が見つかりませんでした</p>
                                </div>
                            )}
                        </div>

                        {/* 選択済み特典一覧 */}
                        <div className="mb-6">
                            <h3 className="text-md font-semibold mb-3">選択済みの特典</h3>

                            {selectedBonuses.length === 0 ? (
                                <div className="bg-white p-6 text-center border border-gray-200 rounded-lg">
                                    <p className="text-gray-500">特典が選択されていません</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {selectedBonuses.map(bonus => (
                                        <div key={bonus.id} className="bg-white p-4 rounded-lg border border-gray-200">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="flex items-center">
                                                        <span className="font-medium text-gray-900">{bonus.name}</span>
                                                        <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                            ${bonus.type === '購入特典' ? 'bg-green-100 text-green-800' :
                                                                bonus.type === '連動購入特典' ? 'bg-blue-100 text-blue-800' :
                                                                    'bg-purple-100 text-purple-800'}`}>
                                                            {bonus.type}
                                                        </span>
                                                    </div>
                                                    {bonus.conditions && (
                                                        <p className="text-sm text-gray-500 mt-1">{bonus.conditions}</p>
                                                    )}
                                                    {bonus.castList && bonus.castList.length > 0 && (
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            <span className="font-medium">出演:</span> {bonus.castList.join(', ')}
                                                        </p>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveBonus(bonus.id)}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </div>

                                            <div className="mt-3 pt-3 border-t border-gray-100">
                                                <span className="text-sm font-medium text-gray-700">入手可能なサイト:</span>
                                                <div className="flex flex-wrap gap-3 mt-2">
                                                    <div className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            id={`site-dlsite-${bonus.id}`}
                                                            checked={bonus.sites.dlsite}
                                                            onChange={() => handleBonusSiteToggle(bonus.id, 'dlsite')}
                                                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                                        />
                                                        <label htmlFor={`site-dlsite-${bonus.id}`} className="ml-2 text-sm text-gray-700">
                                                            DLsiteがるまに
                                                        </label>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            id={`site-pocketdrama-${bonus.id}`}
                                                            checked={bonus.sites.pocketdrama}
                                                            onChange={() => handleBonusSiteToggle(bonus.id, 'pocketdrama')}
                                                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                                        />
                                                        <label htmlFor={`site-pocketdrama-${bonus.id}`} className="ml-2 text-sm text-gray-700">
                                                            ポケットドラマCD
                                                        </label>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            id={`site-stellaplayer-${bonus.id}`}
                                                            checked={bonus.sites.stellaplayer}
                                                            onChange={() => handleBonusSiteToggle(bonus.id, 'stellaplayer')}
                                                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                                        />
                                                        <label htmlFor={`site-stellaplayer-${bonus.id}`} className="ml-2 text-sm text-gray-700">
                                                            ステラプレイヤー
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
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
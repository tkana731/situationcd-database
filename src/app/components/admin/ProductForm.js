'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, Timestamp, collection, query, where, getDocs, increment, writeBatch, runTransaction } from 'firebase/firestore';
import { getAllBonuses, addBonus } from '../../../lib/firebase/bonuses';
import Link from 'next/link';
import { Gift, Search, Plus, X, Check, ExternalLink, Image } from 'lucide-react'; // Image アイコンを追加
import { db, auth } from '../../../lib/firebase/config';
import BonusSelector from './BonusSelector';
import NewBonusForm from './NewBonusForm';
import SelectedBonusList from './SelectedBonusList';

// ドキュメントIDに無効な文字を含む場合に安全な文字列に変換する関数
const safeDocumentId = (str) => {
    // スラッシュ(/)、ピリオド(.)、角括弧([])、二重引用符(")、アスタリスク(*)など
    // Firestoreで使用できない文字を置き換え
    return str.replace(/[\/\.\[\]\*"`]/g, '_');
};

// DLsiteの検索URLを生成する関数
const getDLsiteSearchUrl = (title) => {
    if (!title) return null;

    // まず通常のURLエンコードを行う
    let encodedTitle = encodeURIComponent(title);

    // エンコード後の%20（スペース）を+に置換
    encodedTitle = encodedTitle.replace(/%20/g, '+');

    return `https://www.dlsite.com/girls-drama/fsr/=/language/jp/sex_category%5B0%5D/female/sex_category%5B1%5D/gay/keyword/${encodedTitle}/work_category%5B0%5D/drama/order%5B0%5D/trend/options_and_or/and/per_page/30/page/1/is_tl/1/from/fs.header`;
};

// ポケットドラマCDの検索URLを生成する関数
const getPocketdramaSearchUrl = (title) => {
    if (!title) return null;

    // まず通常のURLエンコードを行う
    let encodedTitle = encodeURIComponent(title);

    // エンコード後の%20（スペース）を+に置換
    encodedTitle = encodedTitle.replace(/%20/g, '+');

    return `https://pokedora.com/products/list.php?pageno=&mode=search&store=adt&name=${encodedTitle}`;
};

export default function ProductForm({ productId }) {
    const router = useRouter();
    const isNewProduct = productId === 'new';

    // クライアントサイドでのみ有効なDLsite検索リンク
    const [dlsiteSearchUrl, setDlsiteSearchUrl] = useState(null);

    // クライアントサイドでのみ有効なポケドラ検索リンク
    const [pokedoraSearchUrl, setPokedoraSearchUrl] = useState(null);

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

    // 特典情報の状態
    const [allBonuses, setAllBonuses] = useState([]);
    const [selectedBonuses, setSelectedBonuses] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredBonuses, setFilteredBonuses] = useState([]);
    const [showNewBonusForm, setShowNewBonusForm] = useState(false);

    // 新規特典フォームの状態
    const [newBonus, setNewBonus] = useState({
        name: '『』',
        type: '購入特典',
        conditions: '',
        castList: [],
        sites: {
            dlsite: false,
            pocketdrama: false,
            stellaplayer: false
        }
    });

    // 入力フィールドの状態
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

    // タイトルが変更されたら検索URL群を更新
    useEffect(() => {
        if (product.title) {
            setDlsiteSearchUrl(getDLsiteSearchUrl(product.title));
            setPokedoraSearchUrl(getPocketdramaSearchUrl(product.title));
        } else {
            setDlsiteSearchUrl(null);
            setPokedoraSearchUrl(null);
        }
    }, [product.title]);

    // 新規追加の場合は既存データを読み込む
    useEffect(() => {
        const fetchData = async () => {
            try {
                // 特典データの取得
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

                    // 特典情報をロード
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

    // 特典選択の処理
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

    // 新規追加ボタンのハンドラ
    const handleAddNewProduct = () => {
        setShowNewBonusForm(!showNewBonusForm);
        if (!showNewBonusForm) {
            // フォームを表示する場合、フォームデータをリセット
            // 作品の声優情報を特典の声優に設定
            const initialCastList = product.cast || [];
            const initialCastInput = initialCastList.join(', ');

            setNewBonus({
                name: '『』', // 初期値に『』を設定
                type: '購入特典',
                conditions: '',
                castList: initialCastList, // 作品の声優を初期値として設定
                sites: {
                    dlsite: false,
                    pocketdrama: false,
                    stellaplayer: false
                }
            });
            setNewBonusCastInput(initialCastInput); // 作品の声優を文字列として設定
        }
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
                name: '『』', // 初期値に『』を設定
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

    // すべての作品からタグの出現数を集計する関数
    const recalculateTagCounts = async () => {
        try {
            // すべての作品を取得
            const productsQuery = query(collection(db, 'products'));
            const querySnapshot = await getDocs(productsQuery);

            // タグごとの出現数を集計
            const tagCounts = new Map();

            querySnapshot.forEach(doc => {
                const productData = doc.data();
                if (productData.tags && Array.isArray(productData.tags)) {
                    productData.tags.forEach(tag => {
                        const count = tagCounts.get(tag) || 0;
                        tagCounts.set(tag, count + 1);
                    });
                }
            });

            // タグコレクションを更新
            const batch = writeBatch(db);

            // まず既存のタグドキュメントを取得
            const tagsSnapshot = await getDocs(collection(db, 'tags'));
            const existingTags = new Set();

            tagsSnapshot.forEach(doc => {
                existingTags.add(doc.id);
            });

            // タグカウントを更新または作成
            for (const [tag, count] of tagCounts.entries()) {
                const safeTagId = safeDocumentId(tag);
                const tagRef = doc(db, 'tags', safeTagId);

                if (existingTags.has(safeTagId)) {
                    // 既存のタグを更新
                    batch.update(tagRef, {
                        count: count,
                        name: tag,
                        updatedAt: serverTimestamp()
                    });
                } else {
                    // 新しいタグを作成
                    batch.set(tagRef, {
                        name: tag,
                        count: count,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp()
                    });
                }

                // 処理済みタグを記録
                existingTags.delete(safeTagId);
            }

            // 残りの使用されていないタグを削除
            for (const unusedTagId of existingTags) {
                batch.delete(doc(db, 'tags', unusedTagId));
            }

            // バッチ処理を実行
            await batch.commit();
            console.log('All tag counts recalculated successfully');
            return true;
        } catch (err) {
            console.error('Error recalculating tag counts:', err);
            return false;
        }
    };

    // すべての作品から声優の出現数を集計する関数
    const recalculateActorCounts = async () => {
        try {
            // すべての作品を取得
            const productsQuery = query(collection(db, 'products'));
            const querySnapshot = await getDocs(productsQuery);

            // 声優ごとの出現数を集計
            const actorCounts = new Map();

            querySnapshot.forEach(doc => {
                const productData = doc.data();
                if (productData.cast && Array.isArray(productData.cast)) {
                    productData.cast.forEach(actor => {
                        const count = actorCounts.get(actor) || 0;
                        actorCounts.set(actor, count + 1);
                    });
                }
            });

            // 声優コレクションを更新
            const batch = writeBatch(db);

            // まず既存の声優ドキュメントを取得
            const actorsSnapshot = await getDocs(collection(db, 'actors'));
            const existingActors = new Set();

            actorsSnapshot.forEach(doc => {
                existingActors.add(doc.id);
            });

            // 声優カウントを更新または作成
            for (const [actor, count] of actorCounts.entries()) {
                const safeActorId = safeDocumentId(actor);
                const actorRef = doc(db, 'actors', safeActorId);

                if (existingActors.has(safeActorId)) {
                    // 既存の声優を更新
                    batch.update(actorRef, {
                        count: count,
                        name: actor,
                        updatedAt: serverTimestamp()
                    });
                } else {
                    // 新しい声優を作成
                    batch.set(actorRef, {
                        name: actor,
                        count: count,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp()
                    });
                }

                // 処理済み声優を記録
                existingActors.delete(safeActorId);
            }

            // 残りの使用されていない声優を削除
            for (const unusedActorId of existingActors) {
                batch.delete(doc(db, 'actors', unusedActorId));
            }

            // バッチ処理を実行
            await batch.commit();
            console.log('All actor counts recalculated successfully');
            return true;
        } catch (err) {
            console.error('Error recalculating actor counts:', err);
            return false;
        }
    };

    // 特典コレクションの更新
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
                await recalculateTagCounts();
                await recalculateActorCounts();

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

                // タグと声優情報を更新
                await recalculateTagCounts();
                await recalculateActorCounts();

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
                                placeholder="YYYY-MM-DD"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
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
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                DLsiteがるまにURL
                                {dlsiteSearchUrl && (
                                    <a
                                        href={dlsiteSearchUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="ml-2 inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
                                    >
                                        <ExternalLink size={12} className="mr-1" />
                                        DLsiteで検索
                                    </a>
                                )}
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
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                サムネイル画像URL
                                {product.dlsiteUrl && (
                                    <span className="ml-2 text-xs text-gray-500">
                                        <Image size={12} className="inline mr-1" />
                                        DLsiteから入手できます
                                    </span>
                                )}
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

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                ポケットドラマCD URL
                                {pokedoraSearchUrl && (
                                    <a
                                        href={pokedoraSearchUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="ml-2 inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
                                    >
                                        <ExternalLink size={12} className="mr-1" />
                                        ポケドラで検索
                                    </a>
                                )}
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

                    {/* 特典情報管理 */}
                    <div className="md:col-span-2">
                        <h2 className="text-lg font-semibold mb-4 pb-2 border-b">特典情報</h2>
                    </div>

                    <div className="md:col-span-2">
                        {/* 特典検索・新規追加部分 */}
                        <BonusSelector
                            allBonuses={allBonuses}
                            filteredBonuses={filteredBonuses}
                            selectedBonuses={selectedBonuses}
                            showNewBonusForm={showNewBonusForm}
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            setFilteredBonuses={setFilteredBonuses}
                            handleSelectBonus={handleSelectBonus}
                            handleAddNewProduct={handleAddNewProduct}
                        />

                        {/* 新規特典フォーム */}
                        {showNewBonusForm && (
                            <NewBonusForm
                                newBonus={newBonus}
                                newBonusCastInput={newBonusCastInput}
                                handleNewBonusChange={handleNewBonusChange}
                                handleNewBonusCastChange={handleNewBonusCastChange}
                                handleNewBonusSiteToggle={handleNewBonusSiteToggle}
                                handleNewBonusSubmit={handleNewBonusSubmit}
                            />
                        )}

                        {/* 選択済み特典一覧 */}
                        <SelectedBonusList
                            selectedBonuses={selectedBonuses}
                            handleRemoveBonus={handleRemoveBonus}
                            handleBonusSiteToggle={handleBonusSiteToggle}
                        />
                    </div>
                </div >

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
            </form >
        </div >
    );
}
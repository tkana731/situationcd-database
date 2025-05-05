// /src/app/components/admin/ProductForm/index.js

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp, collection, writeBatch } from 'firebase/firestore';
import { getAllBonuses } from '../../../../lib/firebase/bonuses';
import Link from 'next/link';
import { db } from '../../../../lib/firebase/config';
import BasicInfoSection from './BasicInfoSection';
import CastTagsSection from './CastTagsSection';
import SalesInfoSection from './SalesInfoSection';
import BonusSection from './BonusSection';
import { recalculateTagCounts, recalculateActorCounts, updateBonusCollection } from './helpers';

export default function ProductForm({ productId }) {
    const router = useRouter();
    const isNewProduct = productId === 'new';

    // 作品データの状態 - dlafUrlを追加
    const [product, setProduct] = useState({
        title: '',
        series: '',
        releaseDate: '',
        maker: '',
        cast: [],
        tags: [],
        thumbnailUrl: '',
        dlsiteUrl: '',
        dlafUrl: '', // DLsiteアフィリエイトリンク
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

    // 状態管理
    const [loading, setLoading] = useState(!isNewProduct);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    // 削除状態の追加
    const [deleting, setDeleting] = useState(false);

    // 検索URLを管理
    const [dlsiteSearchUrl, setDlsiteSearchUrl] = useState(null);
    const [pokedoraSearchUrl, setPokedoraSearchUrl] = useState(null);

    // タイトルが変更されたら検索URL群を更新
    useEffect(() => {
        if (product.title) {
            const getDLsiteSearchUrl = (title) => {
                if (!title) return null;
                let encodedTitle = encodeURIComponent(title);
                encodedTitle = encodedTitle.replace(/%20/g, '+');
                return `https://www.dlsite.com/girls-drama/fsr/=/language/jp/sex_category%5B0%5D/female/sex_category%5B1%5D/gay/keyword/${encodedTitle}/work_category%5B0%5D/drama/order%5B0%5D/trend/options_and_or/and/per_page/30/page/1/is_tl/1/from/fs.header`;
            };

            const getPocketdramaSearchUrl = (title) => {
                if (!title) return null;
                let encodedTitle = encodeURIComponent(title);
                encodedTitle = encodedTitle.replace(/%20/g, '+');
                return `https://pokedora.com/products/list.php?pageno=&mode=search&store=adt&name=${encodedTitle}`;
            };

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
                        tags: tags,
                        dlafUrl: data.dlafUrl || '' // DLsiteアフィリエイトリンクも読み込む
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
                await recalculateTagCounts(db);
                await recalculateActorCounts(db);

                // 製品IDを設定
                actualProductId = newDocRef.id;

                setSuccessMessage('作品を新規登録しました');

                // 特典情報を更新（新規製品ID使用）
                await updateBonusCollection(db, actualProductId, allBonuses, selectedBonuses);

                router.push('/admin/products');
            } else {
                // 更新
                const docRef = doc(db, 'products', productId);
                await updateDoc(docRef, productData);

                // タグと声優情報を更新
                await recalculateTagCounts(db);
                await recalculateActorCounts(db);

                // 特典情報を更新
                await updateBonusCollection(db, actualProductId, allBonuses, selectedBonuses);

                setSuccessMessage('作品情報を更新しました');
            }
        } catch (err) {
            console.error('Error saving product:', err);
            setError('保存に失敗しました');
        } finally {
            setSaving(false);
        }
    };

    // 削除処理
    const handleDelete = async () => {
        if (!window.confirm(`「${product.title}」を削除してもよろしいですか？この操作は取り消せません。`)) {
            return;
        }

        setDeleting(true);
        setError(null);
        setSuccessMessage('');

        try {
            const docRef = doc(db, 'products', productId);
            await deleteDoc(docRef);

            // タグと声優情報を再計算
            await recalculateTagCounts(db);
            await recalculateActorCounts(db);

            setSuccessMessage('作品を削除しました');

            // 作品一覧ページにリダイレクト
            setTimeout(() => {
                router.push('/admin/products');
            }, 1500);
        } catch (err) {
            console.error('Error deleting product:', err);
            setError('削除に失敗しました');
        } finally {
            setDeleting(false);
        }
    };

    const bonusSectionProps = {
        allBonuses,
        selectedBonuses,
        searchQuery,
        filteredBonuses,
        showNewBonusForm,
        newBonus,
        newBonusCastInput,
        setSearchQuery,
        setFilteredBonuses,
        handleSelectBonus,
        handleRemoveBonus,
        handleBonusSiteToggle,
        handleAddNewProduct,
        handleNewBonusChange,
        handleNewBonusCastChange,
        handleNewBonusSiteToggle,
        setNewBonus,
        setNewBonusCastInput,
        setShowNewBonusForm,
        setSelectedBonuses,
        setAllBonuses,
        setSuccessMessage,
        setError,
        product,
        isNewProduct,
        productId
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
                    <BasicInfoSection product={product} handleChange={handleChange} />

                    {/* 声優とタグ */}
                    <CastTagsSection
                        product={product}
                        castInput={castInput}
                        tagsInput={tagsInput}
                        handleCastChange={handleCastChange}
                        handleTagsChange={handleTagsChange}
                    />

                    {/* 販売情報 - dlafUrlを追加 */}
                    <SalesInfoSection
                        product={product}
                        handleChange={handleChange}
                        dlsiteSearchUrl={dlsiteSearchUrl}
                        pokedoraSearchUrl={pokedoraSearchUrl}
                    />

                    {/* 特典情報管理 */}
                    <BonusSection {...bonusSectionProps} />
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                    <div>
                        {!isNewProduct && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={deleting || saving}
                                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-red-300"
                            >
                                {deleting ? '削除中...' : '作品を削除'}
                            </button>
                        )}
                    </div>
                    <div className="flex space-x-3">
                        <button
                            type="button"
                            onClick={() => router.push('/admin/products')}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            disabled={saving || deleting}
                        >
                            キャンセル
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300"
                            disabled={saving || deleting}
                        >
                            {saving ? '保存中...' : (isNewProduct ? '登録する' : '更新する')}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
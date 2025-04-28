// /src/app/components/admin/BonusForm.js

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    getBonusById,
    addBonus,
    updateBonus
} from '../../../lib/firebase/bonuses';
import {
    getAllProducts
} from '../../../lib/firebase/products';

export default function BonusForm({ bonusId }) {
    const router = useRouter();
    const isNewBonus = bonusId === 'new';

    // 基本データの状態
    const [bonus, setBonus] = useState({
        name: '',
        type: '購入特典',
        castList: [],
        conditions: '',
        relatedProducts: []
    });

    // 入力状態管理
    const [castInput, setCastInput] = useState('');
    const [selectedProductId, setSelectedProductId] = useState('');
    const [selectedSites, setSelectedSites] = useState({
        dlsite: false,
        pocketdrama: false,
        stellaplayer: false
    });

    // 製品リスト
    const [products, setProducts] = useState([]);

    // UI状態
    const [loading, setLoading] = useState(!isNewBonus);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    // 初期データ読み込み
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // 製品データの取得
                const productsData = await getAllProducts(100);
                setProducts(productsData);

                // 新規特典の場合はここで終了
                if (isNewBonus) {
                    setLoading(false);
                    return;
                }

                // 既存特典データの取得
                const bonusData = await getBonusById(bonusId);
                if (bonusData) {
                    setBonus(bonusData);

                    // 出演声優の入力値設定
                    if (Array.isArray(bonusData.castList)) {
                        setCastInput(bonusData.castList.join(', '));
                    }
                } else {
                    setError('特典が見つかりませんでした');
                }
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('データの取得に失敗しました');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [bonusId, isNewBonus]);

    // フィールド変更ハンドラ
    const handleChange = (e) => {
        const { name, value } = e.target;
        setBonus({
            ...bonus,
            [name]: value
        });
    };

    // 出演声優変更ハンドラ
    const handleCastChange = (e) => {
        const value = e.target.value;
        setCastInput(value);

        const castArray = value.split(',')
            .map(item => item.trim())
            .filter(item => item !== '');

        setBonus({
            ...bonus,
            castList: castArray
        });
    };

    // 関連製品の追加
    const handleAddRelatedProduct = () => {
        if (!selectedProductId) return;

        // 選択されたサイトのリスト作成
        const selectedSitesList = Object.entries(selectedSites)
            .filter(([_, isSelected]) => isSelected)
            .map(([siteId, _]) => siteId);

        if (selectedSitesList.length === 0) {
            alert('少なくとも1つのサイトを選択してください');
            return;
        }

        // 既に追加済みの製品かチェック
        const existingIndex = bonus.relatedProducts.findIndex(
            rp => rp.productId === selectedProductId
        );

        if (existingIndex >= 0) {
            // 既存の製品の場合は更新
            const updatedRelatedProducts = [...bonus.relatedProducts];
            updatedRelatedProducts[existingIndex] = {
                productId: selectedProductId,
                sites: selectedSitesList
            };

            setBonus({
                ...bonus,
                relatedProducts: updatedRelatedProducts
            });
        } else {
            // 新規の製品の場合は追加
            setBonus({
                ...bonus,
                relatedProducts: [
                    ...bonus.relatedProducts,
                    {
                        productId: selectedProductId,
                        sites: selectedSitesList
                    }
                ]
            });
        }

        // 入力をリセット
        setSelectedProductId('');
        setSelectedSites({
            dlsite: false,
            pocketdrama: false,
            stellaplayer: false
        });
    };

    // 関連製品の削除
    const handleRemoveRelatedProduct = (productId) => {
        setBonus({
            ...bonus,
            relatedProducts: bonus.relatedProducts.filter(
                rp => rp.productId !== productId
            )
        });
    };

    // サイト選択の切り替え
    const handleSiteToggle = (siteId) => {
        setSelectedSites({
            ...selectedSites,
            [siteId]: !selectedSites[siteId]
        });
    };

    // 保存処理
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccessMessage('');

        try {
            if (isNewBonus) {
                // 新規作成
                await addBonus(bonus);
                setSuccessMessage('特典を登録しました');
                router.push('/admin/bonuses');
            } else {
                // 更新
                await updateBonus(bonusId, bonus);
                setSuccessMessage('特典情報を更新しました');
            }
        } catch (err) {
            console.error('Error saving bonus:', err);
            setError('保存に失敗しました');
        } finally {
            setSaving(false);
        }
    };

    // 製品名を取得する関数
    const getProductName = (productId) => {
        const product = products.find(p => p.id === productId);
        return product ? product.title : '不明な製品';
    };

    if (loading) {
        return (
            <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">データを読み込み中...</p>
            </div>
        );
    }

    return (
        <div className="bg-white shadow rounded-lg p-6">
            <h1 className="text-2xl font-bold mb-6">
                {isNewBonus ? '新規特典登録' : '特典情報編集'}
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

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            特典名 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={bonus.name}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            特典タイプ <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="type"
                            value={bonus.type}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            <option value="購入特典">購入特典</option>
                            <option value="連動購入特典">連動購入特典</option>
                            <option value="全巻購入特典">全巻購入特典</option>
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            出演声優 (カンマ区切りで複数入力可)
                        </label>
                        <textarea
                            name="castList"
                            value={castInput}
                            onChange={handleCastChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="2"
                            placeholder="声優1, 声優2, 声優3"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            入手条件
                        </label>
                        <textarea
                            name="conditions"
                            value={bonus.conditions || ''}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="2"
                            placeholder="例: 2023年12月31日までの期間限定購入特典"
                        />
                    </div>

                    {/* 関連製品の設定 */}
                    <div className="md:col-span-2">
                        <h2 className="text-lg font-semibold mb-4 pb-2 border-b">関連製品</h2>
                    </div>

                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                製品
                            </label>
                            <select
                                value={selectedProductId}
                                onChange={(e) => setSelectedProductId(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">-- 製品を選択 --</option>
                                {products.map(product => (
                                    <option key={product.id} value={product.id}>
                                        {product.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                入手可能なサイト
                            </label>
                            <div className="space-y-2">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="dlsite"
                                        checked={selectedSites.dlsite}
                                        onChange={() => handleSiteToggle('dlsite')}
                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                    />
                                    <label htmlFor="dlsite" className="ml-2 text-sm text-gray-700">
                                        DLsiteがるまに
                                    </label>
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="pocketdrama"
                                        checked={selectedSites.pocketdrama}
                                        onChange={() => handleSiteToggle('pocketdrama')}
                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                    />
                                    <label htmlFor="pocketdrama" className="ml-2 text-sm text-gray-700">
                                        ポケットドラマCD
                                    </label>
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="stellaplayer"
                                        checked={selectedSites.stellaplayer}
                                        onChange={() => handleSiteToggle('stellaplayer')}
                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                    />
                                    <label htmlFor="stellaplayer" className="ml-2 text-sm text-gray-700">
                                        ステラプレイヤー
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-end">
                            <button
                                type="button"
                                onClick={handleAddRelatedProduct}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                disabled={!selectedProductId}
                            >
                                製品を追加
                            </button>
                        </div>
                    </div>

                    {/* 関連製品のリスト */}
                    <div className="md:col-span-2">
                        <h3 className="text-md font-semibold mb-2">追加済み製品</h3>
                        {bonus.relatedProducts.length === 0 ? (
                            <p className="text-gray-500">関連付けられた製品はありません</p>
                        ) : (
                            <ul className="divide-y divide-gray-200 border rounded-lg">
                                {bonus.relatedProducts.map((rp, index) => (
                                    <li key={index} className="p-4 flex justify-between items-center">
                                        <div>
                                            <p className="font-medium">{getProductName(rp.productId)}</p>
                                            <p className="text-sm text-gray-600">
                                                サイト: {rp.sites.map(site => {
                                                    switch (site) {
                                                        case 'dlsite': return 'DLsiteがるまに';
                                                        case 'pocketdrama': return 'ポケドラ';
                                                        case 'stellaplayer': return 'ステラプレイヤー';
                                                        default: return site;
                                                    }
                                                }).join(', ')}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveRelatedProduct(rp.productId)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            削除
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                        type="button"
                        onClick={() => router.push('/admin/bonuses')}
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
                        {saving ? '保存中...' : (isNewBonus ? '登録する' : '更新する')}
                    </button>
                </div>
            </form>
        </div>
    );
}
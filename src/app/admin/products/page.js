// src/app/admin/products/page.js

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { db } from '../../../lib/firebase/config'; // 共通のFirebase設定を使用
import { collection, getDocs, doc, deleteDoc, query, orderBy, where } from 'firebase/firestore';
import { getAllActors } from '../../../lib/firebase/products';
import { Search, Calendar, AlertCircle } from 'lucide-react';
import Pagination from '../../components/ui/Pagination'; // 部品化したページネーションをインポート
import { INCLUDED_ACTORS } from '../../components/admin/import/includedActorsConfig'; // INCLUDED_ACTORSをインポート

export default function ProductsAdminPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false); // 初期状態をfalseに変更
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedActor, setSelectedActor] = useState('');
    const [selectedYear, setSelectedYear] = useState(''); // 発売年フィルタを追加
    const [selectedMissingInfo, setSelectedMissingInfo] = useState(''); // 未入力項目フィルタを追加
    const [selectedExcludedActors, setSelectedExcludedActors] = useState(''); // 除外対象フィルタを追加
    const [actors, setActors] = useState([]);
    const [initialLoad, setInitialLoad] = useState(false); // 初回ロードフラグを追加
    const [page, setPage] = useState(1); // ページ番号の追加
    const router = useRouter();

    // 発売年の選択肢を生成する関数
    const generateYearOptions = () => {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let year = currentYear; year >= 2010; year--) {
            years.push(year);
        }
        return years;
    };

    // 未入力項目のチェック関数
    const checkMissingFields = (product) => {
        const fields = {
            thumbnailUrl: 'サムネイル',
            dlafUrl: 'DLsiteアフィリエイト',
            dlsiteUrl: 'DLsite',
            pocketdramaUrl: 'ポケドラ',
            stellaplayerUrl: 'ステラ'
        };

        const missing = Object.entries(fields)
            .filter(([key, _]) => !product[key] || product[key] === '')
            .map(([_, label]) => label);

        return {
            hasMissing: missing.length > 0,
            missingFields: missing,
            count: missing.length
        };
    };

    // 除外対象声優チェック関数
    const checkExcludedActors = (product) => {
        if (!product.cast || !Array.isArray(product.cast)) {
            return {
                hasExcludedActors: false,
                excludedActors: []
            };
        }

        const excludedActors = product.cast.filter(actor =>
            !INCLUDED_ACTORS.includes(actor)
        );

        return {
            hasExcludedActors: excludedActors.length > 0,
            excludedActors: excludedActors
        };
    };

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
    const fetchProducts = async (actorFilter = null, yearFilter = null, missingInfoFilter = null) => {
        setLoading(true);
        setError(null);

        try {
            setInitialLoad(true); // 初回ロードフラグを設定

            let productsQuery;

            if (actorFilter && actorFilter !== '' && yearFilter && yearFilter !== '') {
                // 声優と発売年の両方でフィルタ
                const startDate = `${yearFilter}-01-01`;
                const endDate = `${yearFilter}-12-31`;
                productsQuery = query(
                    collection(db, 'products'),
                    where('cast', 'array-contains', actorFilter),
                    where('releaseDate', '>=', startDate),
                    where('releaseDate', '<=', endDate)
                );
            } else if (actorFilter && actorFilter !== '') {
                // 声優でフィルタ
                productsQuery = query(
                    collection(db, 'products'),
                    where('cast', 'array-contains', actorFilter),
                    orderBy('updatedAt', 'desc')
                );
            } else if (yearFilter && yearFilter !== '') {
                // 発売年でフィルタ
                const startDate = `${yearFilter}-01-01`;
                const endDate = `${yearFilter}-12-31`;
                productsQuery = query(
                    collection(db, 'products'),
                    where('releaseDate', '>=', startDate),
                    where('releaseDate', '<=', endDate),
                    orderBy('releaseDate', 'desc')
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
        setPage(1); // フィルタ変更時はページをリセット
        await fetchProducts(actor, selectedYear, selectedMissingInfo);
    };

    // 発売年フィルタの変更処理
    const handleYearFilterChange = async (e) => {
        const year = e.target.value;
        setSelectedYear(year);
        setPage(1); // フィルタ変更時はページをリセット
        await fetchProducts(selectedActor, year, selectedMissingInfo);
    };

    // 未入力項目フィルタの変更処理
    const handleMissingInfoFilterChange = async (e) => {
        const missingInfo = e.target.value;
        setSelectedMissingInfo(missingInfo);
        setPage(1); // フィルタ変更時はページをリセット
        await fetchProducts(selectedActor, selectedYear, missingInfo);
    };

    // 除外対象フィルタの変更処理
    const handleExcludedActorsFilterChange = (e) => {
        const value = e.target.value;
        setSelectedExcludedActors(value);
        setPage(1); // フィルタ変更時はページをリセット
    };

    // 作品一覧の読み込みボタンを追加
    const handleLoadProducts = () => {
        fetchProducts(selectedActor, selectedYear, selectedMissingInfo);
    };

    // ページ変更時に先頭にスクロール
    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }, [page]);

    // ページネーション用の作品取得
    const itemsPerPage = 20;
    const getVisibleResults = () => {
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredProducts.slice(startIndex, endIndex);
    };

    // タイトル検索、未入力項目フィルタ、除外対象フィルタ処理
    const filteredProducts = products.filter(product => {
        const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (product.series && product.series.toLowerCase().includes(searchQuery.toLowerCase()));

        const missingInfo = checkMissingFields(product);

        let matchesMissingFilter = true;
        if (selectedMissingInfo) {
            switch (selectedMissingInfo) {
                case 'any':
                    matchesMissingFilter = missingInfo.hasMissing;
                    break;
                case 'thumbnailUrl':
                    matchesMissingFilter = !product.thumbnailUrl;
                    break;
                case 'dlafUrl':
                    matchesMissingFilter = !product.dlafUrl;
                    break;
                case 'dlsiteUrl':
                    matchesMissingFilter = !product.dlsiteUrl;
                    break;
                case 'pocketdramaUrl':
                    matchesMissingFilter = !product.pocketdramaUrl;
                    break;
                case 'stellaplayerUrl':
                    matchesMissingFilter = !product.stellaplayerUrl;
                    break;
            }
        }

        // 除外対象フィルタの処理
        let matchesExcludedFilter = true;
        if (selectedExcludedActors) {
            const excludedActorsCheck = checkExcludedActors(product);
            if (selectedExcludedActors === 'hasExcluded') {
                matchesExcludedFilter = excludedActorsCheck.hasExcludedActors;
            }
        }

        return matchesSearch && matchesMissingFilter && matchesExcludedFilter;
    });

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

    // ページ変更ハンドラ（Paginationコンポーネント用）
    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

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
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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

                    {/* 発売年フィルタ */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            発売年フィルタ
                        </label>
                        <select
                            value={selectedYear}
                            onChange={handleYearFilterChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">すべての年</option>
                            {generateYearOptions().map((year) => (
                                <option key={year} value={year}>
                                    {year}年
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* 未入力項目フィルタ */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            未入力項目フィルタ
                        </label>
                        <select
                            value={selectedMissingInfo}
                            onChange={handleMissingInfoFilterChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">すべて</option>
                            <option value="any">いずれかの項目が未入力</option>
                            <option value="thumbnailUrl">サムネイル未入力</option>
                            <option value="dlafUrl">DLsiteアフィリエイト未入力</option>
                            <option value="dlsiteUrl">DLsite未入力</option>
                            <option value="pocketdramaUrl">ポケドラ未入力</option>
                            <option value="stellaplayerUrl">ステラ未入力</option>
                        </select>
                    </div>

                    {/* 除外対象フィルタ */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            除外対象フィルタ
                        </label>
                        <select
                            value={selectedExcludedActors}
                            onChange={handleExcludedActorsFilterChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">すべて</option>
                            <option value="hasExcluded">除外対象の声優が含まれる</option>
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
                        {selectedActor || selectedYear || selectedMissingInfo || selectedExcludedActors ? (
                            <p>
                                {selectedActor && selectedYear && selectedMissingInfo && selectedExcludedActors ? (
                                    `声優「${selectedActor}」の${selectedYear}年作品（${selectedMissingInfo === 'any' ? '未入力項目あり' :
                                        selectedMissingInfo === 'thumbnailUrl' ? 'サムネイル未入力' :
                                            selectedMissingInfo === 'dlafUrl' ? 'DLsiteアフィリエイト未入力' :
                                                selectedMissingInfo === 'dlsiteUrl' ? 'DLsite未入力' :
                                                    selectedMissingInfo === 'pocketdramaUrl' ? 'ポケドラ未入力' :
                                                        selectedMissingInfo === 'stellaplayerUrl' ? 'ステラ未入力' : ''
                                    }、${selectedExcludedActors === 'hasExcluded' ? '除外対象の声優含む' : ''}）: ${filteredProducts.length}件`
                                ) : selectedActor && selectedYear && selectedMissingInfo ? (
                                    `声優「${selectedActor}」の${selectedYear}年作品（${selectedMissingInfo === 'any' ? '未入力項目あり' :
                                        selectedMissingInfo === 'thumbnailUrl' ? 'サムネイル未入力' :
                                            selectedMissingInfo === 'dlafUrl' ? 'DLsiteアフィリエイト未入力' :
                                                selectedMissingInfo === 'dlsiteUrl' ? 'DLsite未入力' :
                                                    selectedMissingInfo === 'pocketdramaUrl' ? 'ポケドラ未入力' :
                                                        selectedMissingInfo === 'stellaplayerUrl' ? 'ステラ未入力' : ''
                                    }）: ${filteredProducts.length}件`
                                ) : selectedActor && selectedYear && selectedExcludedActors ? (
                                    `声優「${selectedActor}」の${selectedYear}年作品（${selectedExcludedActors === 'hasExcluded' ? '除外対象の声優含む' : ''}）: ${filteredProducts.length}件`
                                ) : selectedActor && selectedMissingInfo && selectedExcludedActors ? (
                                    `声優「${selectedActor}」の作品（${selectedMissingInfo === 'any' ? '未入力項目あり' :
                                        selectedMissingInfo === 'thumbnailUrl' ? 'サムネイル未入力' :
                                            selectedMissingInfo === 'dlafUrl' ? 'DLsiteアフィリエイト未入力' :
                                                selectedMissingInfo === 'dlsiteUrl' ? 'DLsite未入力' :
                                                    selectedMissingInfo === 'pocketdramaUrl' ? 'ポケドラ未入力' :
                                                        selectedMissingInfo === 'stellaplayerUrl' ? 'ステラ未入力' : ''
                                    }、${selectedExcludedActors === 'hasExcluded' ? '除外対象の声優含む' : ''}）: ${filteredProducts.length}件`
                                ) : selectedYear && selectedMissingInfo && selectedExcludedActors ? (
                                    `${selectedYear}年の作品（${selectedMissingInfo === 'any' ? '未入力項目あり' :
                                        selectedMissingInfo === 'thumbnailUrl' ? 'サムネイル未入力' :
                                            selectedMissingInfo === 'dlafUrl' ? 'DLsiteアフィリエイト未入力' :
                                                selectedMissingInfo === 'dlsiteUrl' ? 'DLsite未入力' :
                                                    selectedMissingInfo === 'pocketdramaUrl' ? 'ポケドラ未入力' :
                                                        selectedMissingInfo === 'stellaplayerUrl' ? 'ステラ未入力' : ''
                                    }、${selectedExcludedActors === 'hasExcluded' ? '除外対象の声優含む' : ''}）: ${filteredProducts.length}件`
                                ) : selectedActor && selectedYear ? (
                                    `声優「${selectedActor}」の${selectedYear}年作品: ${filteredProducts.length}件`
                                ) : selectedActor && selectedMissingInfo ? (
                                    `声優「${selectedActor}」の作品（${selectedMissingInfo === 'any' ? '未入力項目あり' :
                                        selectedMissingInfo === 'thumbnailUrl' ? 'サムネイル未入力' :
                                            selectedMissingInfo === 'dlafUrl' ? 'DLsiteアフィリエイト未入力' :
                                                selectedMissingInfo === 'dlsiteUrl' ? 'DLsite未入力' :
                                                    selectedMissingInfo === 'pocketdramaUrl' ? 'ポケドラ未入力' :
                                                        selectedMissingInfo === 'stellaplayerUrl' ? 'ステラ未入力' : ''
                                    }）: ${filteredProducts.length}件`
                                ) : selectedActor && selectedExcludedActors ? (
                                    `声優「${selectedActor}」の作品（${selectedExcludedActors === 'hasExcluded' ? '除外対象の声優含む' : ''}）: ${filteredProducts.length}件`
                                ) : selectedYear && selectedMissingInfo ? (
                                    `${selectedYear}年の作品（${selectedMissingInfo === 'any' ? '未入力項目あり' :
                                        selectedMissingInfo === 'thumbnailUrl' ? 'サムネイル未入力' :
                                            selectedMissingInfo === 'dlafUrl' ? 'DLsiteアフィリエイト未入力' :
                                                selectedMissingInfo === 'dlsiteUrl' ? 'DLsite未入力' :
                                                    selectedMissingInfo === 'pocketdramaUrl' ? 'ポケドラ未入力' :
                                                        selectedMissingInfo === 'stellaplayerUrl' ? 'ステラ未入力' : ''
                                    }）: ${filteredProducts.length}件`
                                ) : selectedYear && selectedExcludedActors ? (
                                    `${selectedYear}年の作品（${selectedExcludedActors === 'hasExcluded' ? '除外対象の声優含む' : ''}）: ${filteredProducts.length}件`
                                ) : selectedMissingInfo && selectedExcludedActors ? (
                                    `${selectedMissingInfo === 'any' ? '未入力項目ありの作品' :
                                        selectedMissingInfo === 'thumbnailUrl' ? 'サムネイル未入力の作品' :
                                            selectedMissingInfo === 'dlafUrl' ? 'DLsiteアフィリエイト未入力の作品' :
                                                selectedMissingInfo === 'dlsiteUrl' ? 'DLsite未入力の作品' :
                                                    selectedMissingInfo === 'pocketdramaUrl' ? 'ポケドラ未入力の作品' :
                                                        selectedMissingInfo === 'stellaplayerUrl' ? 'ステラ未入力の作品' : ''
                                    }（${selectedExcludedActors === 'hasExcluded' ? '除外対象の声優含む' : ''}）: ${filteredProducts.length}件`
                                ) : selectedActor ? (
                                    `声優「${selectedActor}」の作品: ${filteredProducts.length}件`
                                ) : selectedYear ? (
                                    `${selectedYear}年の作品: ${filteredProducts.length}件`
                                ) : selectedMissingInfo ? (
                                    `${selectedMissingInfo === 'any' ? '未入力項目ありの作品' :
                                        selectedMissingInfo === 'thumbnailUrl' ? 'サムネイル未入力の作品' :
                                            selectedMissingInfo === 'dlafUrl' ? 'DLsiteアフィリエイト未入力の作品' :
                                                selectedMissingInfo === 'dlsiteUrl' ? 'DLsite未入力の作品' :
                                                    selectedMissingInfo === 'pocketdramaUrl' ? 'ポケドラ未入力の作品' :
                                                        selectedMissingInfo === 'stellaplayerUrl' ? 'ステラ未入力の作品' : ''
                                    }: ${filteredProducts.length}件`
                                ) : selectedExcludedActors ? (
                                    `除外対象の声優を含む作品: ${filteredProducts.length}件`
                                ) : (
                                    ''
                                )}
                            </p>
                        ) : (
                            <p>全作品: {filteredProducts.length}件</p>
                        )}
                    </div>

                    {filteredProducts.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">
                            {searchQuery || selectedActor || selectedYear || selectedMissingInfo || selectedExcludedActors ? '条件に一致する作品はありません' : '登録されている作品はありません'}
                        </p>
                    ) : (
                        <>
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
                                        {getVisibleResults().map((product) => {
                                            const missingInfo = checkMissingFields(product);
                                            const excludedActorsInfo = checkExcludedActors(product);
                                            return (
                                                <tr key={product.id} className={`hover:bg-gray-50 ${excludedActorsInfo.hasExcludedActors ? 'bg-purple-50' : ''}`}>
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
                                                            {missingInfo.hasMissing && (
                                                                <span className="inline-flex items-center ml-2 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                                                    <AlertCircle size={12} className="mr-1" />
                                                                    {missingInfo.count}項目未入力
                                                                </span>
                                                            )}
                                                            {excludedActorsInfo.hasExcludedActors && (
                                                                <span className="inline-flex items-center ml-2 px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                                                    <AlertCircle size={12} className="mr-1" />
                                                                    除外対象声優含む
                                                                </span>
                                                            )}
                                                        </div>
                                                        {excludedActorsInfo.hasExcludedActors && (
                                                            <div className="text-xs text-purple-600 mt-1">
                                                                除外対象: {excludedActorsInfo.excludedActors.join(', ')}
                                                            </div>
                                                        )}
                                                        {missingInfo.hasMissing && (
                                                            <div className="text-xs text-red-600 mt-1">
                                                                未入力: {missingInfo.missingFields.join(', ')}
                                                            </div>
                                                        )}
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
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* 部品化したPaginationコンポーネントを使用 */}
                            <div className="mt-8">
                                <Pagination
                                    currentPage={page}
                                    totalPages={totalPages}
                                    onPageChange={handlePageChange}
                                    colorScheme="blue"
                                />
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
}
// /src/app/products/page.js

'use client';

import { useEffect, useState } from 'react';
import { Box, Calendar } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import ProductGrid from '../components/ui/ProductGrid';
import { getAllProducts } from '../../lib/firebase/products';

export default function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [lastDoc, setLastDoc] = useState(null);
    const [sortOrder, setSortOrder] = useState('latest'); // 初期値は新着順

    // 初回データ読み込み
    useEffect(() => {
        fetchProducts();
    }, [sortOrder]); // sortOrderが変わったら再取得

    // 製品データの取得
    const fetchProducts = async () => {
        try {
            setLoading(true);

            // 最新の作品を20件取得
            const productsData = await getAllProducts(20, sortOrder);

            setProducts(productsData);

            // 最後のドキュメントを記録（実際には追加実装が必要）
            setLastDoc(productsData.length > 0 ? productsData[productsData.length - 1] : null);

            // データが20件未満の場合、もうデータがないと判断
            setHasMore(productsData.length === 20);
        } catch (error) {
            console.error('作品データの取得中にエラーが発生しました:', error);
        } finally {
            setLoading(false);
        }
    };

    // もっと見るボタン用の関数
    const handleLoadMore = async () => {
        if (!hasMore || loadingMore) return;

        try {
            setLoadingMore(true);

            // 実際のアプリケーションでは、lastDocを使用して続きのデータを取得する
            // ここではダミーデータを追加
            const moreProducts = await getMoreProducts(lastDoc, 20);

            setProducts(prevProducts => [...prevProducts, ...moreProducts]);

            // 最後のドキュメントを更新
            setLastDoc(moreProducts.length > 0 ? moreProducts[moreProducts.length - 1] : lastDoc);

            // データが20件未満の場合、もうデータがないと判断
            setHasMore(moreProducts.length === 20);
        } catch (error) {
            console.error('追加データの取得中にエラーが発生しました:', error);
        } finally {
            setLoadingMore(false);
        }
    };

    // ソート順変更ハンドラ
    const handleSortChange = (order) => {
        setSortOrder(order);
    };

    // ダミーの追加データ取得関数（実際のアプリでは、FirestoreのstartAfterを使用）
    const getMoreProducts = async (lastDoc, limit) => {
        // 実際の実装では、FirestoreのクエリでstartAfterを使用
        // ここではダミーデータを返す
        return [];
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Header />

            <main className="flex-grow">
                <div className="container mx-auto px-4 py-8">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                            <Box size={20} className="mr-2 text-pink-500" />
                            作品一覧
                        </h1>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <p className="text-gray-600">{products.length}件の作品</p>

                            {/* ソート順選択UI - カレンダーアイコンに統一 */}
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => handleSortChange('latest')}
                                    className={`px-4 py-2 rounded-md flex items-center text-sm border ${sortOrder === 'latest'
                                            ? 'bg-pink-50 text-pink-600 border-pink-200 font-medium'
                                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    <Box size={16} className="mr-2" />
                                    新着順
                                </button>
                                <button
                                    onClick={() => handleSortChange('newest')}
                                    className={`px-4 py-2 rounded-md flex items-center text-sm border ${sortOrder === 'newest'
                                            ? 'bg-pink-50 text-pink-600 border-pink-200 font-medium'
                                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    <Calendar size={16} className="mr-2" />
                                    発売日が新しい順
                                </button>
                                <button
                                    onClick={() => handleSortChange('oldest')}
                                    className={`px-4 py-2 rounded-md flex items-center text-sm border ${sortOrder === 'oldest'
                                            ? 'bg-pink-50 text-pink-600 border-pink-200 font-medium'
                                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    <Calendar size={16} className="mr-2" />
                                    発売日が古い順
                                </button>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-pink-400 border-r-transparent"></div>
                            <p className="mt-4 text-gray-600">データを読み込み中...</p>
                        </div>
                    ) : products.length > 0 ? (
                        <>
                            <ProductGrid products={products} />

                            {hasMore && (
                                <div className="mt-10 text-center">
                                    <button
                                        onClick={handleLoadMore}
                                        disabled={loadingMore}
                                        className="bg-white border border-pink-300 text-pink-600 px-6 py-3 rounded-lg hover:bg-pink-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loadingMore ? (
                                            <>
                                                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-pink-400 border-r-transparent mr-2 align-middle"></span>
                                                読み込み中...
                                            </>
                                        ) : (
                                            'もっと見る'
                                        )}
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                            <p className="text-lg text-gray-700 mb-4">作品が見つかりませんでした</p>
                            <p className="text-gray-600">現在作品データの準備中です。また後でご確認ください。</p>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
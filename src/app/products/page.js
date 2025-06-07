// /src/app/products/page.js

'use client';

import { useEffect, useState, useCallback } from 'react';
import { Box, Calendar } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import ProductGrid from '../components/ui/ProductGrid';
import Pagination from '../components/ui/Pagination';
import { getProductsPaginated } from '../../lib/firebase/products';

export default function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [sortOrder, setSortOrder] = useState('latest'); // 初期値は新着順
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [lastVisible, setLastVisible] = useState(null);

    // 製品データの取得
    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true);

            // 新しいページング対応関数を使用
            const { products: productsData, totalCount: count, hasMore: more, lastVisible: last } =
                await getProductsPaginated(page, 20, sortOrder);

            setProducts(productsData);
            setTotalCount(count);
            setHasMore(more);
            setLastVisible(last);
        } catch (error) {
            console.error('作品データの取得中にエラーが発生しました:', error);
        } finally {
            setLoading(false);
        }
    }, [page, sortOrder]);

    // データ読み込み
    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    // ページ変更時に先頭にスクロール
    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }, [page]);

    // ソート順変更ハンドラ
    const handleSortChange = (order) => {
        setSortOrder(order);
        setPage(1); // ソート変更時は1ページ目に戻す
        setLastVisible(null); // カーソルをリセット
    };

    // ページ変更ハンドラ（Paginationコンポーネント用）
    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

    // 総ページ数の計算
    const totalPages = Math.ceil(totalCount / 20);

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
                            <p className="text-gray-600">{totalCount}件の作品</p>

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

                            {/* ページネーションコンポーネント */}
                            <div className="mt-10">
                                <Pagination
                                    currentPage={page}
                                    totalPages={totalPages}
                                    onPageChange={handlePageChange}
                                    colorScheme="pink"
                                />
                            </div>
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
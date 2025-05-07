// src/app/actor/[name]/ActorContent.js

'use client';

import { Suspense, useEffect, useState } from 'react';
import { Box, User, Tag } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import ProductGrid from '../../components/ui/ProductGrid';
import SchemaOrg from '../../components/SchemaOrg';
import Pagination from '../../components/ui/Pagination';
import { searchProducts } from '../../../lib/firebase/products';

function ActorDetailContent() {
    const params = useParams();
    const router = useRouter();
    const actorName = decodeURIComponent(params?.name || '');

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);

    useEffect(() => {
        const fetchActorProducts = async () => {
            if (!actorName) return;

            try {
                setLoading(true);
                const productsData = await searchProducts({ actor: actorName });
                setProducts(productsData);
            } catch (error) {
                console.error('作品データの取得中にエラーが発生しました:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchActorProducts();
    }, [actorName]);

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
        return products.slice(startIndex, endIndex);
    };

    const totalPages = Math.ceil(products.length / itemsPerPage);

    // ページ変更ハンドラ（Paginationコンポーネント用）
    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

    return (
        <>
            {/* SchemaOrgコンポーネントを追加 */}
            <SchemaOrg product={{
                title: `${actorName}の出演作品`,
                description: `声優${actorName}が出演するシチュエーションCDの一覧です。`,
                cast: [actorName]
            }} />

            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                        <User size={20} className="mr-2 text-pink-500" />
                        {actorName} さんの出演作品
                    </h1>
                    <p className="text-gray-600">{products.length}件の作品</p>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-pink-400 border-r-transparent"></div>
                        <p className="mt-4 text-gray-600">作品を読み込み中...</p>
                    </div>
                ) : products.length > 0 ? (
                    <>
                        <ProductGrid products={getVisibleResults()} />

                        {/* 部品化したPaginationコンポーネントを使用 */}
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
                        <p className="text-lg text-gray-700 mb-4">{actorName}さんの出演作品が見つかりませんでした</p>
                        <p className="text-gray-600">別の声優の作品を確認してみてください。</p>
                    </div>
                )}
            </div>
        </>
    );
}

export default function ActorContent() {
    return (
        <Suspense fallback={
            <div className="container mx-auto px-4 py-8">
                <div className="text-center py-12">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-pink-400 border-r-transparent"></div>
                    <p className="mt-4 text-gray-600">読み込み中...</p>
                </div>
            </div>
        }>
            <ActorDetailContent />
        </Suspense>
    );
}
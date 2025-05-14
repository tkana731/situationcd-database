// src/app/actor/[name]/ActorContent.js

'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { User, ArrowRight } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import ProductGrid from '../../components/ui/ProductGrid';
import SchemaOrg from '../../components/SchemaOrg';
import Pagination from '../../components/ui/Pagination';
import { searchProductsPaginated, getAllActors } from '../../../lib/firebase/products';

function ActorDetailContent() {
    const params = useParams();
    const router = useRouter();
    const actorName = decodeURIComponent(params?.name || '');

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [relatedActors, setRelatedActors] = useState([]);
    const [actorExists, setActorExists] = useState(true);

    useEffect(() => {
        const fetchActorProducts = async () => {
            if (!actorName) return;

            try {
                setLoading(true);

                // 声優の存在確認（全声優から該当する声優を検索）
                const allActors = await getAllActors();
                const actorData = allActors.find(actor => actor.name === actorName);

                // 声優が存在しない場合は404ページにリダイレクト
                if (!actorData) {
                    setActorExists(false);
                    return;
                }

                // 作品データを取得
                const { products: productsData, totalCount: count, hasMore: more } =
                    await searchProductsPaginated({ actor: actorName }, page, 20);

                setProducts(productsData);
                setTotalCount(count);
                setHasMore(more);

                // 関連声優（人気の声優）を取得
                const popularActors = allActors
                    .filter(actor => actor.name !== actorName)
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 5);
                setRelatedActors(popularActors);

            } catch (error) {
                console.error('作品データの取得中にエラーが発生しました:', error);
                setProducts([]);
                setTotalCount(0);
                setHasMore(false);
            } finally {
                setLoading(false);
            }
        };

        fetchActorProducts();
    }, [actorName, page]);

    // アクターが存在しない場合は404ページにリダイレクト
    useEffect(() => {
        if (!loading && !actorExists) {
            router.push('/404');
        }
    }, [loading, actorExists, router]);

    // ページ変更時に先頭にスクロール
    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }, [page]);

    // 総ページ数の計算
    const totalPages = Math.ceil(totalCount / 20);

    // ページ変更ハンドラ
    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

    // 声優に作品がない場合でも表示するコンテンツ
    const renderEmptyState = () => (
        <div className="text-center py-8 bg-white rounded-lg shadow-sm mb-8">
            <p className="text-lg text-gray-700 mb-4">{actorName}さんの出演作品が見つかりませんでした</p>
            <p className="text-gray-600 mb-6">現在データベースの更新中です。今後も定期的に更新していきますので、しばらくお待ちください。</p>

            <div className="mt-8 border-t border-gray-100 pt-6">
                <h3 className="text-lg font-semibold text-pink-600 mb-4">人気の声優をチェックしてみませんか？</h3>
                <div className="flex flex-wrap justify-center gap-3">
                    {relatedActors.map(actor => (
                        <Link
                            key={actor.id}
                            href={`/actor/${encodeURIComponent(actor.name)}/`}
                            className="flex items-center justify-between bg-white border border-pink-200 px-4 py-3 rounded-lg hover:bg-pink-50 hover:border-pink-300 transition-colors"
                        >
                            <span className="font-medium">{actor.name}</span>
                            <span className="ml-2 bg-pink-100 text-pink-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                {actor.count}
                            </span>
                        </Link>
                    ))}
                </div>
            </div>

            <div className="mt-8">
                <Link
                    href="/actors"
                    className="inline-flex items-center text-pink-600 hover:text-pink-700 font-medium"
                >
                    声優一覧に戻る
                    <ArrowRight size={16} className="ml-1" />
                </Link>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center py-12">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-pink-400 border-r-transparent"></div>
                    <p className="mt-4 text-gray-600">作品を読み込み中...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* SchemaOrgコンポーネントを追加 */}
            <SchemaOrg product={{
                title: `${actorName}の出演作品`,
                description: `声優${actorName}が出演するシチュエーションCDの一覧です。${products.length > 0 ? `${totalCount}件の作品があります。` : ''}`,
                cast: [actorName]
            }} />

            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                        <User size={20} className="mr-2 text-pink-500" />
                        {actorName} さんの出演作品
                    </h1>
                    {products.length > 0 ? (
                        <p className="text-gray-600">{totalCount}件の作品</p>
                    ) : (
                        <p className="text-gray-600">出演作品を探しています</p>
                    )}
                </div>

                {products.length > 0 ? (
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
                    renderEmptyState()
                )}

                {/* 関連声優セクション - 作品がある場合も表示 */}
                {products.length > 0 && relatedActors.length > 0 && (
                    <div className="mt-12 pt-8 border-t border-pink-100">
                        <h2 className="text-xl font-bold mb-6 flex items-center">
                            <User size={20} className="mr-2 text-pink-500" />
                            人気の声優
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            {relatedActors.map(actor => (
                                <Link
                                    key={actor.id}
                                    href={`/actor/${encodeURIComponent(actor.name)}/`}
                                    className="flex items-center justify-between bg-white border border-pink-200 px-4 py-3 rounded-lg hover:bg-pink-50 hover:border-pink-300 transition-colors"
                                >
                                    <span className="font-medium">{actor.name}</span>
                                    <span className="bg-pink-100 text-pink-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                        {actor.count}
                                    </span>
                                </Link>
                            ))}
                        </div>
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
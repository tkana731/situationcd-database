// /src/app/search/page.js

'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import ProductGrid from '../components/ui/ProductGrid';
import Pagination from '../components/ui/Pagination';
import Breadcrumb from '../components/ui/Breadcrumb';
import { searchProductsPaginated } from '../../lib/firebase/products';

// 実際のコンテンツコンポーネント
function SearchResults() {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    // noindexメタタグを追加
    useEffect(() => {
        const metaRobots = document.createElement('meta');
        metaRobots.name = 'robots';
        metaRobots.content = 'noindex, nofollow';
        document.head.appendChild(metaRobots);
        
        return () => {
            document.head.removeChild(metaRobots);
        };
    }, []);

    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchInfo, setSearchInfo] = useState({
        type: '',
        query: ''
    });
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [hasMore, setHasMore] = useState(false);

    useEffect(() => {
        const fetchSearchResults = async () => {
            try {
                setLoading(true);

                const query = searchParams.get('q');
                const tag = searchParams.get('tag');
                const actor = searchParams.get('actor');

                let searchType = '';
                let searchQuery = '';
                let searchParamsObj = {};

                // パラメータを適切に設定
                if (query) {
                    searchParamsObj.q = query;
                    searchType = 'query';
                    searchQuery = query;
                } else if (tag) {
                    searchParamsObj.tag = tag;
                    searchType = 'tag';
                    searchQuery = tag;
                } else if (actor) {
                    searchParamsObj.actor = actor;
                    searchType = 'actor';
                    searchQuery = actor;
                }

                console.log('Searching with params:', searchParamsObj);

                // 新しいページング対応検索関数を使用
                const { products, totalCount, hasMore } =
                    await searchProductsPaginated(searchParamsObj, page, 20);

                console.log('Search results:', products.length, 'Total:', totalCount);

                setResults(products);
                setTotalCount(totalCount);
                setHasMore(hasMore);
                setSearchInfo({
                    type: searchType,
                    query: searchQuery
                });
            } catch (error) {
                console.error('検索結果の取得中にエラーが発生しました:', error);
                setResults([]);
                setTotalCount(0);
                setHasMore(false);
            } finally {
                setLoading(false);
            }
        };

        fetchSearchResults();
    }, [searchParams, page]);

    // ページ変更時に先頭にスクロール
    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }, [page]);

    const handleBack = () => {
        router.push('/');
    };

    // 検索結果のタイトルと説明文を生成
    const getSearchTitle = () => {
        switch (searchInfo.type) {
            case 'query':
                return `"${searchInfo.query}" の検索結果`;
            case 'tag':
                return `タグ: #${searchInfo.query}`;
            case 'actor':
                return `声優: ${searchInfo.query}`;
            default:
                return '検索結果';
        }
    };

    // 総ページ数の計算
    const totalPages = Math.ceil(totalCount / 20);

    // ページ変更ハンドラ（Paginationコンポーネント用）
    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Header />

            <main className="flex-grow">
                <div className="container mx-auto px-4 py-8">
                    {/* パンくずリスト */}
                    <Breadcrumb items={[
                        { name: '検索結果' }
                    ]} />

                    <button
                        onClick={handleBack}
                        className="mb-6 flex items-center gap-2 px-4 py-2 bg-white text-pink-600 rounded-full shadow-md border border-pink-100 hover:bg-pink-50 hover:border-pink-200 hover:shadow-lg transition-all duration-300 group"
                    >
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform duration-300" />
                        <span className="font-medium">トップに戻る</span>
                    </button>

                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">
                            {getSearchTitle()}
                        </h1>
                        <p className="text-gray-600">
                            {totalCount}件の作品が見つかりました
                        </p>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-pink-400 border-r-transparent"></div>
                            <p className="mt-4 text-gray-600">検索結果を読み込み中...</p>
                        </div>
                    ) : results.length > 0 ? (
                        <>
                            <ProductGrid products={results} />

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
                            <p className="text-lg text-gray-700 mb-4">検索条件に一致する作品が見つかりませんでした。</p>
                            <p className="text-gray-600">別のキーワードで検索するか、トップページに戻ってみてください。</p>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}

// メインのページコンポーネント
export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex flex-col bg-gray-50">
                <Header />
                <main className="flex-grow container mx-auto px-4 py-8">
                    <div className="text-center py-12">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-pink-400 border-r-transparent"></div>
                        <p className="mt-4 text-gray-600">検索中...</p>
                    </div>
                </main>
                <Footer />
            </div>
        }>
            <SearchResults />
        </Suspense>
    );
}
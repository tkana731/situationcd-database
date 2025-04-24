// /src/app/search/page.js

'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import ProductGrid from '../components/ui/ProductGrid';
import { searchProducts } from '../../lib/firebase/products';

// 実際のコンテンツコンポーネント
function SearchResults() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchInfo, setSearchInfo] = useState({
        type: '',
        query: ''
    });

    useEffect(() => {
        const fetchSearchResults = async () => {
            try {
                setLoading(true);

                const query = searchParams.get('q');
                const tag = searchParams.get('tag');
                const actor = searchParams.get('actor');

                let searchResults = [];
                let searchType = '';
                let searchQuery = '';

                // searchProducts関数にパラメータを適切に渡す
                const params = {};
                if (query) {
                    params.q = query;
                    searchType = 'query';
                    searchQuery = query;
                } else if (tag) {
                    params.tag = tag;
                    searchType = 'tag';
                    searchQuery = tag;
                } else if (actor) {
                    params.actor = actor;
                    searchType = 'actor';
                    searchQuery = actor;
                }

                // 新しいsearchProducts関数はパラメータオブジェクトを受け取る
                searchResults = await searchProducts(params);

                setResults(searchResults);
                setSearchInfo({
                    type: searchType,
                    query: searchQuery
                });
            } catch (error) {
                console.error('検索結果の取得中にエラーが発生しました:', error);
                setResults([]);
            } finally {
                setLoading(false);
            }
        };

        fetchSearchResults();
    }, [searchParams]);

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

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Header />

            <main className="flex-grow">
                <div className="container mx-auto px-4 py-8">
                    <button
                        onClick={handleBack}
                        className="mb-6 flex items-center text-gray-600 hover:text-pink-600"
                    >
                        <span className="mr-1">←</span> トップに戻る
                    </button>

                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">
                            {getSearchTitle()}
                        </h1>
                        <p className="text-gray-600">{results.length}件の作品が見つかりました</p>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-pink-400 border-r-transparent"></div>
                            <p className="mt-4 text-gray-600">検索結果を読み込み中...</p>
                        </div>
                    ) : results.length > 0 ? (
                        <ProductGrid products={results} />
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
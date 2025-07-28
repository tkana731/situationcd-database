// /src/app/HomePage.js

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Box, FileText, Heart, Info } from 'lucide-react';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import SearchBox from './components/ui/SearchBox';
import ProductGrid from './components/ui/ProductGrid';
import TagList from './components/ui/TagList';
import VoiceActorList from './components/ui/VoiceActorList';
import UpdateHistory from './components/ui/UpdateHistory';
import SchemaOrg from './components/SchemaOrg';
import { getUpcomingProducts } from '../lib/firebase/products';
import { getAllTags } from '../lib/firebase/products';
import { getAllActors } from '../lib/firebase/products';
import { getLatestBlogPosts } from '../lib/firebase/blogs';

export default function HomePage() {
    const [upcomingProducts, setUpcomingProducts] = useState([]);
    const [popularTags, setPopularTags] = useState([]);
    const [popularActors, setPopularActors] = useState([]);
    const [latestBlogPosts, setLatestBlogPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // データの取得
                const upcomingData = await getUpcomingProducts(8);
                const tagsData = await getAllTags(10);
                const actorsData = await getAllActors(10);
                const blogData = await getLatestBlogPosts(3);

                setUpcomingProducts(upcomingData);
                setPopularTags(tagsData);
                setPopularActors(actorsData);
                setLatestBlogPosts(blogData);
            } catch (error) {
                console.error('データの取得中にエラーが発生しました:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <SchemaOrg type="website" />
            <Header />

            <main className="flex-grow">
                <div className="container mx-auto px-4 py-8">
                    <SearchBox />
                    
                    {/* お気に入り機能の説明 */}
                    <div className="mb-8 bg-pink-50 border border-pink-200 rounded-lg p-4">
                        <div className="flex items-start">
                            <Info className="text-pink-600 flex-shrink-0 mt-0.5 mr-2" size={20} />
                            <div className="text-sm text-gray-700">
                                <p className="leading-relaxed">
                                    作品カードまたはタグ右上の
                                    <Heart className="text-pink-500 inline-block mx-1 align-text-bottom" size={16} />
                                    をクリックして「お気に入り」に登録すると、
                                    <Link href="/wishlist" className="text-pink-600 font-medium hover:text-pink-700 underline inline-block">
                                        お気に入りページ
                                    </Link>
                                    の下部に「あなたへのおすすめ」が表示されます
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mb-12">
                        <h2 className="text-xl font-bold mb-6 flex items-center">
                            <Box size={20} className="mr-2 text-pink-500" />
                            近日発売予定
                        </h2>

                        {loading ? (
                            <div className="text-center py-12">
                                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-pink-400 border-r-transparent"></div>
                                <p className="mt-4 text-gray-600">データを読み込み中...</p>
                            </div>
                        ) : upcomingProducts.length > 0 ? (
                            <ProductGrid products={upcomingProducts} />
                        ) : (
                            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                                <p className="text-gray-700">発売予定の作品が見つかりませんでした</p>
                            </div>
                        )}
                    </div>

                    {/* ブログ新着記事セクション */}
                    <div className="mb-12">
                        <h2 className="text-xl font-bold mb-6 flex items-center">
                            <FileText size={20} className="mr-2 text-pink-500" />
                            ブログ新着記事
                        </h2>
                        
                        {loading ? (
                            <div className="text-center py-8">
                                <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-pink-400 border-r-transparent"></div>
                            </div>
                        ) : latestBlogPosts.length > 0 ? (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                {latestBlogPosts.map((post, index) => (
                                    <div key={post.id} className={`p-4 ${index !== latestBlogPosts.length - 1 ? 'border-b border-gray-100' : ''}`}>
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                                            <div className="flex-1">
                                                <Link 
                                                    href={`/blog/${post.slug}`}
                                                    className="block hover:text-pink-600 transition-colors duration-200"
                                                >
                                                    <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">
                                                        {post.title}
                                                    </h3>
                                                    {post.excerpt && (
                                                        <p className="text-sm text-gray-600 line-clamp-2">
                                                            {post.excerpt}
                                                        </p>
                                                    )}
                                                </Link>
                                            </div>
                                            <div className="flex items-center mt-2 sm:mt-0 sm:ml-4">
                                                {post.category && (
                                                    <span className="inline-block bg-pink-100 text-pink-700 text-xs px-2 py-1 rounded-full mr-2">
                                                        {post.category}
                                                    </span>
                                                )}
                                                <time className="text-xs text-gray-500">
                                                    {new Date(post.publishedAt).toLocaleDateString('ja-JP')}
                                                </time>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div className="p-4 bg-gray-50 text-center">
                                    <Link 
                                        href="/blog"
                                        className="text-pink-600 text-sm font-medium hover:text-pink-700 transition-colors duration-200"
                                    >
                                        ブログ記事をもっと見る →
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-white rounded-lg shadow-sm border border-gray-200">
                                <p className="text-gray-600">新着記事はまだありません</p>
                            </div>
                        )}
                    </div>

                    <TagList tags={popularTags} />
                    <VoiceActorList actors={popularActors} />
                    
                    {/* サイト更新履歴セクション */}
                    <div className="mb-12">
                        <UpdateHistory />
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
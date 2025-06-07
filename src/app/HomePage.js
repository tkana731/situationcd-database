// /src/app/HomePage.js

'use client';

import React, { useEffect, useState } from 'react';
import { Box } from 'lucide-react';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import SearchBox from './components/ui/SearchBox';
import ProductGrid from './components/ui/ProductGrid';
import TagList from './components/ui/TagList';
import VoiceActorList from './components/ui/VoiceActorList';
import RecommendedProducts from './components/ui/RecommendedProducts';
import SchemaOrg from './components/SchemaOrg';
import { getUpcomingProducts } from '../lib/firebase/products';
import { getAllTags } from '../lib/firebase/products';
import { getAllActors } from '../lib/firebase/products';

export default function HomePage() {
    const [upcomingProducts, setUpcomingProducts] = useState([]);
    const [popularTags, setPopularTags] = useState([]);
    const [popularActors, setPopularActors] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // データの取得
                const upcomingData = await getUpcomingProducts(8);
                const tagsData = await getAllTags(10);
                const actorsData = await getAllActors(10);

                setUpcomingProducts(upcomingData);
                setPopularTags(tagsData);
                setPopularActors(actorsData);
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

                    <RecommendedProducts excludeProductIds={upcomingProducts.map(p => p.id)} />
                    
                    <TagList tags={popularTags} />
                    <VoiceActorList actors={popularActors} />
                </div>
            </main>

            <Footer />
        </div>
    );
}
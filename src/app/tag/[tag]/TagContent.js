// /src/app/tag/[tag]/TagContent.js

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import ProductGrid from '../../components/ui/ProductGrid';
import Breadcrumb from '../../components/ui/Breadcrumb';
import { searchProducts } from '../../../lib/firebase/products';

export default function TagContent({ tagName }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const results = await searchProducts('', { tag: tagName });
                setProducts(results);
            } catch (error) {
                console.error('Error fetching products:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [tagName]);

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Header />
            
            <main className="flex-grow">
                <div className="container mx-auto px-4 py-8">
                    <Breadcrumb 
                        items={[
                            { name: 'ジャンル一覧', href: '/tags' },
                            { name: tagName }
                        ]} 
                    />
                    
                    <h1 className="text-2xl font-bold text-gray-800 mb-6">
                        {tagName}のシチュエーションCD
                    </h1>
                    
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-pink-400 border-r-transparent"></div>
                            <p className="mt-4 text-gray-600">読み込み中...</p>
                        </div>
                    ) : products.length > 0 ? (
                        <>
                            <p className="text-gray-600 mb-6">{products.length}件の作品が見つかりました</p>
                            <ProductGrid products={products} />
                        </>
                    ) : (
                        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                            <p className="text-lg text-gray-700">該当する作品が見つかりませんでした</p>
                        </div>
                    )}
                </div>
            </main>
            
            <Footer />
        </div>
    );
}
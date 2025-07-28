// /src/app/tag/[tag]/TagContent.js

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import ProductGrid from '../../components/ui/ProductGrid';
import Breadcrumb from '../../components/ui/Breadcrumb';
import { searchProducts } from '../../../lib/firebase/products';
import { useWishlistContext } from '../../../contexts/WishlistContext';

export default function TagContent({ tagName }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { addTagToWishlist, removeTagFromWishlist, isTagInWishlist } = useWishlistContext();

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

    const handleToggleWishlist = () => {
        if (isTagInWishlist(tagName)) {
            removeTagFromWishlist(tagName);
        } else {
            addTagToWishlist(tagName);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Header />
            
            <main className="flex-grow">
                <div className="container mx-auto px-4 py-8">
                    <Breadcrumb 
                        items={[
                            { name: 'タグ一覧', href: '/tags' },
                            { name: tagName }
                        ]} 
                    />
                    
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-2xl font-bold text-gray-800">
                            {tagName}のシチュエーションCD
                        </h1>
                        <button
                            onClick={handleToggleWishlist}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                                isTagInWishlist(tagName)
                                    ? 'bg-pink-500 text-white hover:bg-pink-600'
                                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            <Heart 
                                size={20} 
                                className={isTagInWishlist(tagName) ? 'fill-current' : ''} 
                            />
                            {isTagInWishlist(tagName) ? 'タグをお気に入り済み' : 'タグをお気に入りに追加'}
                        </button>
                    </div>
                    
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
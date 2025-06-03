// /src/app/wishlist/page.js

'use client';

import { useState, useEffect } from 'react';
import { Heart, Trash2 } from 'lucide-react';
import Header from '@/app/components/layout/Header';
import Footer from '@/app/components/layout/Footer';
import ProductGrid from '@/app/components/ui/ProductGrid';
import { useWishlistContext } from '@/contexts/WishlistContext';

export default function WishlistPage() {
    const { wishlist, clearWishlist, isLoading } = useWishlistContext();


    const handleClearWishlist = () => {
        if (window.confirm('お気に入りをすべてクリアしますか？')) {
            clearWishlist();
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <main className="container mx-auto px-4 py-8">
                    <div className="text-center">読み込み中...</div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <main className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <Heart className="text-red-500 fill-red-500" />
                            お気に入り
                        </h1>
                        <div className="flex gap-2">
                            {wishlist.length > 0 && (
                                <button
                                    onClick={handleClearWishlist}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                >
                                    <Trash2 size={18} />
                                    すべてクリア
                                </button>
                            )}
                        </div>
                    </div>

                    <p className="text-gray-600">
                        {wishlist.length > 0 
                            ? `${wishlist.length}件の作品がお気に入りに登録されています。`
                            : 'お気に入りに作品がありません。'}
                    </p>
                </div>

                {wishlist.length > 0 ? (
                    <ProductGrid products={wishlist} />
                ) : (
                    <div className="text-center py-12">
                        <Heart size={64} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500 mb-4">
                            気になる作品をハートマークでお気に入りに追加しましょう。
                        </p>
                        <a 
                            href="/products" 
                            className="inline-block px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
                        >
                            作品を探す
                        </a>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}
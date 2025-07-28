// /src/app/wishlist/page.js

'use client';

import { useState } from 'react';
import { Heart, Trash2, Tag } from 'lucide-react';
import Header from '@/app/components/layout/Header';
import Footer from '@/app/components/layout/Footer';
import ProductGrid from '@/app/components/ui/ProductGrid';
import RecommendedProducts from '@/app/components/ui/RecommendedProducts';
import { useWishlistContext } from '@/contexts/WishlistContext';

export default function WishlistPage() {
    const { wishlist, wishlistData, clearWishlist, clearTags, removeTagFromWishlist, isLoading } = useWishlistContext();
    const [activeTab, setActiveTab] = useState('products');


    const handleClearWishlist = () => {
        if (window.confirm('お気に入りをすべてクリアしますか？')) {
            clearWishlist();
        }
    };

    const handleClearTags = () => {
        if (window.confirm('お気に入りタグをすべてクリアしますか？')) {
            clearTags();
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
                    </div>

                    {/* タブ切り替え */}
                    <div className="flex gap-4 mb-6 border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('products')}
                            className={`pb-2 px-1 text-lg font-medium transition-colors ${
                                activeTab === 'products'
                                    ? 'text-pink-600 border-b-2 border-pink-600'
                                    : 'text-gray-600 hover:text-gray-800'
                            }`}
                        >
                            作品 ({wishlist.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('tags')}
                            className={`pb-2 px-1 text-lg font-medium transition-colors ${
                                activeTab === 'tags'
                                    ? 'text-pink-600 border-b-2 border-pink-600'
                                    : 'text-gray-600 hover:text-gray-800'
                            }`}
                        >
                            タグ ({wishlistData.tags.length})
                        </button>
                    </div>
                </div>

                {activeTab === 'products' ? (
                    <>
                        {/* クリアボタン */}
                        <div className="flex justify-between items-center mb-4">
                            <p className="text-gray-600">
                                {wishlist.length > 0 
                                    ? `${wishlist.length}件の作品がお気に入りに登録されています。`
                                    : 'お気に入りに作品がありません。'}
                            </p>
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
                    </>
                ) : (
                    <>
                        {/* タグタブの内容 */}
                        <div className="flex justify-between items-center mb-4">
                            <p className="text-gray-600">
                                {wishlistData.tags.length > 0 
                                    ? `${wishlistData.tags.length}件のタグがお気に入りに登録されています。`
                                    : 'お気に入りにタグがありません。'}
                            </p>
                            {wishlistData.tags.length > 0 && (
                                <button
                                    onClick={handleClearTags}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                >
                                    <Trash2 size={18} />
                                    すべてクリア
                                </button>
                            )}
                        </div>
                        
                        {wishlistData.tags.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {wishlistData.tags.map((tag) => (
                                    <div key={tag} className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
                                        <div className="flex items-center justify-between mb-2">
                                            <Tag className="text-pink-500" size={20} />
                                            <button
                                                onClick={() => removeTagFromWishlist(tag)}
                                                className="text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <h3 className="font-medium text-gray-800 mb-1">{tag}</h3>
                                        <a 
                                            href={`/tag/${encodeURIComponent(tag)}`}
                                            className="text-sm text-pink-600 hover:text-pink-700 transition-colors"
                                        >
                                            作品を見る →
                                        </a>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <Tag size={64} className="mx-auto text-gray-300 mb-4" />
                                <p className="text-gray-500 mb-4">
                                    興味のあるタグをお気に入りに追加しましょう。
                                </p>
                                <a 
                                    href="/tags" 
                                    className="inline-block px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
                                >
                                    タグを探す
                                </a>
                            </div>
                        )}
                    </>
                )}
                
                {/* あなたへのおすすめセクション - タブに関わらず表示 */}
                {(wishlist.length > 0 || wishlistData.tags.length > 0) && (
                    <div className="mt-12">
                        <RecommendedProducts excludeProductIds={wishlist.map(p => p.id)} />
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}
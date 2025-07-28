'use client';

import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import ProductGrid from './ProductGrid';
import { useWishlistContext } from '@/contexts/WishlistContext';
import { getProductsByTags, getProductsByCast } from '@/lib/firebase/products';

const RecommendedProducts = ({ currentProductId = null, excludeProductIds = [], limit = 6 }) => {
    const { wishlist, wishlistData } = useWishlistContext();
    const [recommendations, setRecommendations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchRecommendations = async () => {
            if (wishlist.length === 0 && wishlistData.tags.length === 0) {
                setRecommendations([]);
                setIsLoading(false);
                return;
            }

            try {
                // ウィッシュリストからタグと声優を収集
                const tagCounts = {};
                const castCounts = {};

                // お気に入りタグを高い重みで追加
                wishlistData.tags.forEach(tag => {
                    tagCounts[tag] = (tagCounts[tag] || 0) + 5; // お気に入りタグは重み5
                });

                wishlist.forEach(item => {
                    // タグの集計
                    if (item.tags) {
                        item.tags.forEach(tag => {
                            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                        });
                    }
                    // 声優の集計
                    if (item.cast) {
                        item.cast.forEach(actor => {
                            castCounts[actor] = (castCounts[actor] || 0) + 1;
                        });
                    }
                });

                // 最も多いタグと声優を取得
                const topTags = Object.entries(tagCounts)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 3)
                    .map(([tag]) => tag);

                const topCast = Object.entries(castCounts)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 2)
                    .map(([actor]) => actor);

                // 推奨作品を取得（Mapを使用してIDでユニークにする）
                const recommendedMap = new Map();
                const wishlistIds = new Set(wishlist.map(item => item.id));
                const excludeIds = new Set([currentProductId, ...excludeProductIds].filter(Boolean));

                // タグベースの推奨
                for (const tag of topTags) {
                    const products = await getProductsByTags([tag]);
                    products.forEach(product => {
                        if (!wishlistIds.has(product.id) && !excludeIds.has(product.id)) {
                            recommendedMap.set(product.id, product);
                        }
                    });
                }

                // 声優ベースの推奨
                for (const actor of topCast) {
                    const products = await getProductsByCast([actor]);
                    products.forEach(product => {
                        if (!wishlistIds.has(product.id) && !excludeIds.has(product.id)) {
                            recommendedMap.set(product.id, product);
                        }
                    });
                }

                // 配列に変換してスコア計算
                const recommendedArray = Array.from(recommendedMap.values()).map(product => {
                    let score = 0;
                    
                    // タグマッチのスコア
                    if (product.tags) {
                        product.tags.forEach(tag => {
                            if (tagCounts[tag]) {
                                // お気に入りタグとの一致はより高いスコア
                                if (wishlistData.tags.includes(tag)) {
                                    score += 10; // お気に入りタグとの直接一致
                                }
                                score += tagCounts[tag] * 2;
                            }
                        });
                    }
                    
                    // 声優マッチのスコア
                    if (product.cast) {
                        product.cast.forEach(actor => {
                            if (castCounts[actor]) {
                                score += castCounts[actor] * 3;
                            }
                        });
                    }

                    return { ...product, score };
                });

                // スコアでソートして上位を取得
                const sortedRecommendations = recommendedArray
                    .sort((a, b) => b.score - a.score)
                    .slice(0, limit);

                // 重複チェック（デバッグ用）
                const uniqueIds = new Set();
                const duplicates = [];
                sortedRecommendations.forEach(product => {
                    if (uniqueIds.has(product.id)) {
                        duplicates.push(product.id);
                    } else {
                        uniqueIds.add(product.id);
                    }
                });
                
                if (duplicates.length > 0) {
                    console.warn('Duplicate product IDs found in recommendations:', duplicates);
                }

                setRecommendations(sortedRecommendations);
            } catch (error) {
                console.error('Failed to fetch recommendations:', error);
                setRecommendations([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRecommendations();
    }, [wishlist, wishlistData, currentProductId, excludeProductIds, limit]);

    if (isLoading) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500">おすすめ作品を読み込み中...</p>
            </div>
        );
    }

    if (recommendations.length === 0) {
        return null;
    }

    return (
        <div className="my-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Sparkles className="text-yellow-500" />
                あなたへのおすすめ
            </h2>
            <p className="text-gray-600 mb-4">
                お気に入りに基づいたおすすめ作品
            </p>
            <ProductGrid products={recommendations} />
        </div>
    );
};

export default RecommendedProducts;
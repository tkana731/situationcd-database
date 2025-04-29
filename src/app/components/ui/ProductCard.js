// /src/app/components/ui/ProductCard.js

'use client';

import { Calendar, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import PlaceholderImage from './PlaceholderImage';

const ProductCard = ({ product }) => {
    const router = useRouter();

    // 作品クリック時の処理
    const handleProductClick = () => {
        router.push(`/product?id=${product.id}`);
    };

    // タグクリック時の処理
    const handleTagClick = (e, tag) => {
        e.stopPropagation(); // 親要素へのクリック伝播を停止
        router.push(`/search?tag=${tag}`);
    };

    // 声優クリック時の処理
    const handleActorClick = (e, actor) => {
        e.stopPropagation(); // 親要素へのクリック伝播を停止
        router.push(`/search?actor=${actor}`);
    };

    // releaseDateの表示用フォーマット
    const formatReleaseDate = (date) => {
        if (!date) return '未定';

        // dateが文字列の場合
        if (typeof date === 'string') {
            // YYYY-MM-DD 形式を YYYY/MM/DD 形式に変換
            if (date.includes('-')) {
                return date.replace(/-/g, '/');
            }
            return date;
        }

        // dateがタイムスタンプオブジェクトの場合（念のため残しておく）
        if (typeof date === 'object' && date.seconds) {
            return new Date(date.seconds * 1000).toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }).replace(/\//g, '/');
        }

        return date;
    };

    return (
        <div
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer flex flex-col h-full"
            onClick={handleProductClick}
        >
            {/* aspect-ratioを使用して画像コンテナの縦横比を固定 */}
            <div className="relative w-full aspect-[3/2]">
                {product.thumbnailUrl ? (
                    <img
                        src={product.thumbnailUrl}
                        alt={product.title}
                        className="absolute w-full h-full object-cover"
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                        }}
                    />
                ) : (
                    <div className="absolute w-full h-full">
                        <PlaceholderImage width="100%" height="100%" />
                    </div>
                )}
                {/* バックアップとして用意しておくプレースホルダー（デフォルトは非表示） */}
                {product.thumbnailUrl && (
                    <div style={{ display: 'none' }} className="absolute w-full h-full">
                        <PlaceholderImage width="100%" height="100%" />
                    </div>
                )}
            </div>
            <div className="p-4 flex-grow">
                <h3 className="font-semibold text-lg mb-2 line-clamp-2">{product.title}</h3>
                {product.series && (
                    <p className="text-sm text-gray-600 mb-2">{product.series}</p>
                )}
                <div className="flex items-center text-sm text-gray-500 mb-2">
                    <Calendar size={14} className="mr-1 flex-shrink-0" />
                    {formatReleaseDate(product.releaseDate)}
                </div>

                {/* 声優表示部分 */}
                {product.cast && product.cast.length > 0 && (
                    <div className="flex items-start text-sm text-gray-500 mb-2">
                        <User size={14} className="mr-1 mt-1 flex-shrink-0" />
                        <div className="flex flex-wrap">
                            {product.cast.slice(0, 2).map((actor, index) => (
                                <span
                                    key={index}
                                    className="text-pink-600 hover:underline cursor-pointer mr-1"
                                    onClick={(e) => handleActorClick(e, actor)}
                                >
                                    {actor}{index < Math.min(product.cast.length, 2) - 1 ? ',' : ''}
                                </span>
                            ))}
                            {product.cast.length > 2 && (
                                <span className="text-gray-500">+{product.cast.length - 2}</span>
                            )}
                        </div>
                    </div>
                )}

                {product.tags && product.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                        {product.tags.slice(0, 3).map((tag, index) => (
                            <span
                                key={index}
                                className="bg-pink-50 text-xs text-pink-600 px-2 py-1 rounded-full cursor-pointer hover:bg-pink-100"
                                onClick={(e) => handleTagClick(e, tag)}
                            >
                                #{tag}
                            </span>
                        ))}
                        {product.tags.length > 3 && (
                            <span className="text-xs text-gray-500">+{product.tags.length - 3}</span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductCard;
// /src/app/components/ui/ProductCard.js

'use client';

import { Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';

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

    // releaseDateの表示用フォーマット
    const formatReleaseDate = (date) => {
        if (!date) return '未定';

        // dateがタイムスタンプオブジェクトの場合
        if (typeof date === 'object' && date.seconds) {
            return new Date(date.seconds * 1000).toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }).replace(/\//g, '/');
        }

        // すでに文字列の場合はそのまま返す
        return date;
    };

    return (
        <div
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer"
            onClick={handleProductClick}
        >
            <div className="h-48 overflow-hidden relative">
                <img
                    src={product.thumbnailUrl || "/api/placeholder/300/200"}
                    alt={product.title}
                    className="w-full h-full object-cover"
                />
            </div>
            <div className="p-4">
                <h3 className="font-semibold text-lg mb-2 line-clamp-2">{product.title}</h3>
                {product.series && (
                    <p className="text-sm text-gray-600 mb-2">{product.series}</p>
                )}
                <div className="flex items-center text-sm text-gray-500 mb-2">
                    <Calendar size={14} className="mr-1" />
                    {formatReleaseDate(product.releaseDate)}
                </div>
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
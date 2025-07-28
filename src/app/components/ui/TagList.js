// /src/app/components/ui/TagList.js

'use client';

import { Tag, Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useWishlistContext } from '../../../contexts/WishlistContext';

const TagList = ({ tags }) => {
    const router = useRouter();
    const { addTagToWishlist, removeTagFromWishlist, isTagInWishlist } = useWishlistContext();

    const handleTagClick = (tagName) => {
        router.push(`/tag/${encodeURIComponent(tagName)}`);
    };

    const handleToggleWishlist = (e, tagName) => {
        e.stopPropagation();
        if (isTagInWishlist(tagName)) {
            removeTagFromWishlist(tagName);
        } else {
            addTagToWishlist(tagName);
        }
    };

    return (
        <div className="mb-12">
            <h2 className="text-xl font-bold mb-4 flex items-center">
                <Tag size={20} className="mr-2 text-pink-500" />
                人気のタグ
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {tags.map((tag, index) => (
                    <div
                        key={index}
                        className="relative bg-white border border-pink-200 rounded-lg hover:bg-pink-50 hover:border-pink-300 transition-colors group"
                    >
                        <div
                            onClick={() => handleTagClick(tag.name)}
                            className="w-full text-left p-4 cursor-pointer"
                        >
                            <div className="flex flex-col space-y-2">
                                <div className="flex items-start justify-between">
                                    <span className="text-pink-600 font-medium pr-8">#{tag.name}</span>
                                    <button
                                        onClick={(e) => handleToggleWishlist(e, tag.name)}
                                        className={`flex-shrink-0 p-1.5 -m-1 rounded-full transition-colors ${
                                            isTagInWishlist(tag.name)
                                                ? 'text-pink-500'
                                                : 'text-gray-400 hover:text-pink-500'
                                        }`}
                                        title={isTagInWishlist(tag.name) ? 'お気に入りから削除' : 'お気に入りに追加'}
                                    >
                                        <Heart 
                                            size={18} 
                                            className={isTagInWishlist(tag.name) ? 'fill-current' : ''}
                                        />
                                    </button>
                                </div>
                                <div className="flex items-center">
                                    <span className="bg-pink-100 text-pink-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                        {tag.count}件
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TagList;
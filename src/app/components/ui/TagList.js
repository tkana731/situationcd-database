// /src/app/components/ui/TagList.js

'use client';

import { Tag } from 'lucide-react';
import { useRouter } from 'next/navigation';

const TagList = ({ tags }) => {
    const router = useRouter();

    const handleTagClick = (tagName) => {
        router.push(`/search?tag=${encodeURIComponent(tagName)}`);
    };

    return (
        <div className="mb-12">
            <h2 className="text-xl font-bold mb-4 flex items-center">
                <Tag size={20} className="mr-2 text-pink-500" />
                人気のタグ
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {tags.map((tag, index) => (
                    <button
                        key={index}
                        onClick={() => handleTagClick(tag.name)}
                        className="flex items-center justify-between bg-white border border-pink-200 px-4 py-3 rounded-lg hover:bg-pink-50 hover:border-pink-300 transition-colors"
                    >
                        <span className="text-pink-600">#{tag.name}</span>
                        <span className="bg-pink-100 text-pink-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            {tag.count}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default TagList;
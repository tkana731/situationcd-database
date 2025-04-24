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
            <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                    <button
                        key={index}
                        onClick={() => handleTagClick(tag.name)}
                        className="bg-white border border-pink-200 text-gray-700 px-3 py-1.5 rounded-full hover:bg-pink-50 hover:border-pink-300 transition-colors text-sm"
                    >
                        {tag.name} ({tag.count})
                    </button>
                ))}
            </div>
        </div>
    );
};

export default TagList;
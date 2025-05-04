// /src/app/components/ui/VoiceActorList.js

'use client';

import { User } from 'lucide-react';
import { useRouter } from 'next/navigation';

const VoiceActorList = ({ actors }) => {
    const router = useRouter();

    const handleActorClick = (actorName) => {
        // 検索ページではなく、声優専用ページにリダイレクト
        router.push(`/actor/${encodeURIComponent(actorName)}`);
    };

    return (
        <div className="mb-12">
            <h2 className="text-xl font-bold mb-4 flex items-center">
                <User size={20} className="mr-2 text-pink-500" />
                声優一覧
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {actors.map((actor, index) => (
                    <button
                        key={index}
                        onClick={() => handleActorClick(actor.name)}
                        className="flex items-center justify-between bg-white border border-pink-200 px-4 py-3 rounded-lg hover:bg-pink-50 hover:border-pink-300 transition-colors"
                    >
                        <span className="font-medium">{actor.name}</span>
                        <span className="bg-pink-100 text-pink-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            {actor.count}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default VoiceActorList;
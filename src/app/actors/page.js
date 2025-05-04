// /src/app/actors/page.js

'use client';

import { useEffect, useState } from 'react';
import { User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { getAllActors } from '../../lib/firebase/products';

export default function ActorsPage() {
    const [actors, setActors] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchActors = async () => {
            try {
                setLoading(true);
                // 声優データを取得する（制限を大幅に増やして全ての声優を表示）
                const actorsData = await getAllActors();
                setActors(actorsData);
            } catch (error) {
                console.error('声優データの取得中にエラーが発生しました:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchActors();
    }, []);

    const handleActorClick = (actorName) => {
        router.push(`/search?actor=${encodeURIComponent(actorName)}`);
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Header />

            <main className="flex-grow">
                <div className="container mx-auto px-4 py-8">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
                            <User size={20} className="mr-2 text-pink-500" />
                            声優一覧
                        </h1>
                        <p className="text-gray-600">出演声優の一覧です</p>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-pink-400 border-r-transparent"></div>
                            <p className="mt-4 text-gray-600">声優データを読み込み中...</p>
                        </div>
                    ) : actors.length > 0 ? (
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {actors.map((actor) => (
                                    <button
                                        key={actor.id}
                                        onClick={() => handleActorClick(actor.name)}
                                        className="flex items-center justify-between bg-white border border-pink-200 text-gray-700 px-4 py-3 rounded-lg hover:bg-pink-50 hover:border-pink-300 transition-colors"
                                    >
                                        <span className="font-medium">{actor.name}</span>
                                        <span className="bg-pink-100 text-pink-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                            {actor.count}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                            <p className="text-lg text-gray-700 mb-4">声優データが見つかりませんでした</p>
                            <p className="text-gray-600">現在声優データの準備中です。また後でご確認ください。</p>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
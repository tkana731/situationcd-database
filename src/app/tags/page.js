// /src/app/tags/page.js

'use client';

import { useEffect, useState } from 'react';
import { Tag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { getAllTags } from '../../lib/firebase/products';

export default function TagsPage() {
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchTags = async () => {
            try {
                setLoading(true);
                // タグを取得する（制限を増やして多くのタグを表示）
                const tagsData = await getAllTags(100);
                setTags(tagsData);
            } catch (error) {
                console.error('タグデータの取得中にエラーが発生しました:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTags();
    }, []);

    const handleTagClick = (tagName) => {
        router.push(`/search?tag=${encodeURIComponent(tagName)}`);
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Header />

            <main className="flex-grow">
                <div className="container mx-auto px-4 py-8">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
                            <Tag size={20} className="mr-2 text-pink-500" />
                            人気のタグ一覧
                        </h1>
                        <p className="text-gray-600">作品検索に使用できるタグ一覧です</p>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-pink-400 border-r-transparent"></div>
                            <p className="mt-4 text-gray-600">タグを読み込み中...</p>
                        </div>
                    ) : tags.length > 0 ? (
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {tags.map((tag) => (
                                    <button
                                        key={tag.id}
                                        onClick={() => handleTagClick(tag.name)}
                                        className="flex items-center justify-between bg-white border border-pink-200 text-gray-700 px-4 py-3 rounded-lg hover:bg-pink-50 hover:border-pink-300 transition-colors"
                                    >
                                        <span className="text-pink-600">#{tag.name}</span>
                                        <span className="bg-pink-100 text-pink-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                            {tag.count}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                            <p className="text-lg text-gray-700 mb-4">タグが見つかりませんでした</p>
                            <p className="text-gray-600">現在タグデータの準備中です。また後でご確認ください。</p>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
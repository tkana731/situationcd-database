// /src/app/tags/page.js

'use client';

import { useEffect, useState } from 'react';
import { Tag, Heart, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Breadcrumb from '../components/ui/Breadcrumb';
import { getAllTags } from '../../lib/firebase/products';
import { useWishlistContext } from '../../contexts/WishlistContext';

export default function TagsPage() {
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { addTagToWishlist, removeTagFromWishlist, isTagInWishlist } = useWishlistContext();

    useEffect(() => {
        const fetchTags = async () => {
            try {
                setLoading(true);
                // タグを取得する（制限を大幅に増やして全てのタグを表示）
                const tagsData = await getAllTags();
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
        router.push(`/tag/${encodeURIComponent(tagName)}`);
    };

    const handleToggleWishlist = (e, tagName) => {
        e.stopPropagation(); // タグクリックイベントを阮止
        if (isTagInWishlist(tagName)) {
            removeTagFromWishlist(tagName);
        } else {
            addTagToWishlist(tagName);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Header />

            <main className="flex-grow">
                <div className="container mx-auto px-4 py-8">
                    {/* パンくずリスト */}
                    <Breadcrumb items={[
                        { name: 'タグ一覧' }
                    ]} />

                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
                            <Tag size={20} className="mr-2 text-pink-500" />
                            人気のタグ一覧
                        </h1>
                        <p className="text-gray-600">作品検索に使用できるタグ一覧です</p>
                    </div>

                    {/* タグお気に入り機能の説明 */}
                    <div className="mb-8 bg-pink-50 border border-pink-200 rounded-lg p-4">
                        <div className="flex items-start">
                            <Info className="text-pink-600 flex-shrink-0 mt-0.5 mr-2" size={20} />
                            <div className="text-sm text-gray-700">
                                <p className="leading-relaxed">
                                    タグ右上の
                                    <Heart className="text-pink-500 inline-block mx-1 align-text-bottom" size={16} />
                                    をクリックして「お気に入り」に登録すると、
                                    <Link href="/wishlist" className="text-pink-600 font-medium hover:text-pink-700 underline inline-block">
                                        お気に入りページ
                                    </Link>
                                    でタグを管理でき、そのタグに基づいた「あなたへのおすすめ」が表示されます
                                </p>
                            </div>
                        </div>
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
                                    <div
                                        key={tag.id}
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
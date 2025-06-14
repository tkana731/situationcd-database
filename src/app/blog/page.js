import { getAllBlogPosts } from '@/lib/firebase/blogs';
import BlogCard from '@/app/components/ui/BlogCard';
import Header from '@/app/components/layout/Header';
import Footer from '@/app/components/layout/Footer';
import Breadcrumb from '@/app/components/ui/Breadcrumb';
import { BookOpen } from 'lucide-react';

export const metadata = {
    title: 'ブログ | SituationCD Database',
    description: 'シチュエーションCDに関するブログ記事一覧',
};

export default async function BlogPage() {
    const blogPosts = await getAllBlogPosts();

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Header />
            
            <main className="flex-grow">
                <div className="container mx-auto px-4 py-8">
                    {/* パンくずリスト */}
                    <Breadcrumb items={[
                        { name: 'ブログ' }
                    ]} />

                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                            <BookOpen size={20} className="mr-2 text-pink-500" />
                            ブログ
                        </h1>
                        <p className="text-gray-600">シチュエーションCDに関する最新情報をお届けします</p>
                    </div>

                    {!blogPosts || blogPosts.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                            <p className="text-lg text-gray-700 mb-4">まだブログ記事がありません</p>
                            <p className="text-gray-600">記事の準備中です。また後でご確認ください。</p>
                        </div>
                    ) : (
                        <div className="max-w-4xl mx-auto">
                            <div className="space-y-8">
                                {blogPosts.map((post) => (
                                    <BlogCard key={post.id} post={post} layout="horizontal" />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
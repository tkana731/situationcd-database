import { getBlogPostBySlug, getAllBlogSlugs } from '@/lib/firebase/blogs';
import { notFound } from 'next/navigation';
import Header from '@/app/components/layout/Header';
import Footer from '@/app/components/layout/Footer';
import Breadcrumb from '@/app/components/ui/Breadcrumb';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { marked } from 'marked';

export async function generateStaticParams() {
    const slugs = await getAllBlogSlugs();
    return slugs.map((item) => ({
        slug: item.slug,
    }));
}

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const post = await getBlogPostBySlug(slug);

    if (!post) {
        return {
            title: 'ブログ記事が見つかりません | SituationCD Database',
        };
    }

    return {
        title: `${post.title} | SituationCD Database`,
        description: post.excerpt || post.title,
        openGraph: {
            title: post.title,
            description: post.excerpt || post.title,
            images: post.thumbnail ? [{ url: post.thumbnail }] : [],
        },
    };
}

export default async function BlogPostPage({ params }) {
    const { slug } = await params;
    const post = await getBlogPostBySlug(slug);

    if (!post) {
        notFound();
    }

    // マークダウンをHTMLに変換
    let htmlContent = marked(post.content || '');
    
    // HTMLにクラスを追加する関数
    const addStylesToHtml = (html) => {
        return html
            // 見出しにクラスを追加（ピンク色の下線付き、上の余白を拡大）
            .replace(/<h1>/g, '<h1 class="text-2xl font-bold text-gray-800 mt-12 mb-4 leading-tight border-b-2 border-pink-300 pb-2">')
            .replace(/<h2>/g, '<h2 class="text-xl font-bold text-gray-800 mt-10 mb-3 leading-tight border-b-2 border-pink-200 pb-2">')
            .replace(/<h3>/g, '<h3 class="text-lg font-bold text-gray-800 mt-8 mb-2 leading-tight border-b border-pink-200 pb-1">')
            .replace(/<h4>/g, '<h4 class="text-base font-bold text-gray-800 mt-6 mb-2 border-b border-pink-100 pb-1">')
            .replace(/<h5>/g, '<h5 class="text-sm font-bold text-gray-800 mt-5 mb-2 border-b border-pink-100 pb-1">')
            .replace(/<h6>/g, '<h6 class="text-xs font-bold text-gray-800 mt-4 mb-2 border-b border-pink-100 pb-1">')
            // 段落にクラスを追加
            .replace(/<p>/g, '<p class="text-gray-700 mb-4 leading-relaxed">')
            // リンクにクラスを追加
            .replace(/<a /g, '<a class="text-pink-600 no-underline hover:text-pink-700 hover:underline transition-colors" ')
            // 強調にクラスを追加
            .replace(/<strong>/g, '<strong class="font-bold text-gray-800">')
            // 斜体にクラスを追加
            .replace(/<em>/g, '<em class="italic text-gray-700">')
            // リストにクラスを追加
            .replace(/<ul>/g, '<ul class="list-disc list-inside mb-4 text-gray-700 space-y-1">')
            .replace(/<ol>/g, '<ol class="list-decimal list-inside mb-4 text-gray-700 space-y-1">')
            .replace(/<li>/g, '<li class="text-gray-700">')
            // 引用にクラスを追加
            .replace(/<blockquote>/g, '<blockquote class="border-l-4 border-pink-500 pl-4 ml-0 mb-4 text-gray-600 italic bg-gray-50 py-2 rounded-r">')
            // インラインコードにクラスを追加
            .replace(/<code>/g, '<code class="bg-gray-100 text-pink-600 px-2 py-1 rounded text-sm font-mono">')
            // コードブロックにクラスを追加
            .replace(/<pre>/g, '<pre class="bg-gray-800 text-gray-100 p-4 rounded-lg mb-4 overflow-x-auto">')
            .replace(/<pre class="bg-gray-800 text-gray-100 p-4 rounded-lg mb-4 overflow-x-auto"><code class="bg-gray-100 text-pink-600 px-2 py-1 rounded text-sm font-mono">/g, '<pre class="bg-gray-800 text-gray-100 p-4 rounded-lg mb-4 overflow-x-auto"><code class="text-gray-100 font-mono">')
            // テーブルにクラスを追加
            .replace(/<table>/g, '<table class="w-full border-collapse border border-gray-300 mb-4 rounded-lg overflow-hidden">')
            .replace(/<th>/g, '<th class="border border-gray-300 px-4 py-2 bg-gray-100 font-bold text-gray-800">')
            .replace(/<td>/g, '<td class="border border-gray-300 px-4 py-2 text-gray-700">')
            // 水平線にクラスを追加
            .replace(/<hr>/g, '<hr class="border-gray-300 my-6">')
            // 画像にクラスを追加
            .replace(/<img /g, '<img class="max-w-full h-auto rounded-lg mb-4 shadow-sm" ');
    };
    
    htmlContent = addStylesToHtml(htmlContent);

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Header />
            
            <main className="flex-grow">
                <div className="container mx-auto px-4 py-8">
                    {/* パンくずリスト */}
                    <Breadcrumb items={[
                        { name: 'ブログ', href: '/blog' },
                        { name: post.title }
                    ]} />

                    {/* 戻るリンク */}
                    <div className="mb-6">
                        <Link 
                            href="/blog"
                            className="inline-flex items-center text-pink-600 hover:text-pink-700 text-sm font-medium transition-colors"
                        >
                            <ArrowLeft size={16} className="mr-1" />
                            ブログ一覧に戻る
                        </Link>
                    </div>

                    <article className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm overflow-hidden">
                        {post.thumbnail && (
                            <div className="w-full h-64 md:h-80">
                                <img
                                    src={post.thumbnail}
                                    alt={post.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}
                        
                        <div className="p-6 md:p-8">
                            <header className="mb-8">
                                <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                                    <time dateTime={post.publishedAt}>
                                        {new Date(post.publishedAt).toLocaleDateString('ja-JP', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </time>
                                    
                                    {post.category && (
                                        <span className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-xs font-medium">
                                            {post.category}
                                        </span>
                                    )}
                                </div>
                                
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4 leading-tight">
                                    {post.title}
                                </h1>
                                
                                {post.excerpt && (
                                    <p className="text-lg text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg border-l-4 border-pink-500">
                                        {post.excerpt}
                                    </p>
                                )}
                            </header>
                            
                            <div 
                                className="text-gray-700 leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: htmlContent }}
                            />
                            
                            {post.tags && post.tags.length > 0 && (
                                <footer className="mt-8 pt-6 border-t border-gray-200">
                                    <h3 className="text-sm font-medium text-gray-700 mb-3">タグ</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {post.tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-gray-200 transition-colors"
                                            >
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </footer>
                            )}
                        </div>
                    </article>

                    {/* ナビゲーション */}
                    <div className="max-w-4xl mx-auto mt-8">
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <Link 
                                href="/blog"
                                className="inline-flex items-center text-pink-600 hover:text-pink-700 font-medium transition-colors"
                            >
                                <ArrowLeft size={20} className="mr-2" />
                                ブログ一覧に戻る
                            </Link>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
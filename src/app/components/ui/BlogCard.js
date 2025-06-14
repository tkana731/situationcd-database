import Link from 'next/link';

export default function BlogCard({ post, layout = 'vertical' }) {
    if (layout === 'horizontal') {
        return (
            <article className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow border border-gray-100">
                <div className="md:flex">
                    {post.thumbnail && (
                        <div className="md:w-1/3 lg:w-1/4">
                            <Link href={`/blog/${post.slug}`}>
                                <img
                                    src={post.thumbnail}
                                    alt={post.title}
                                    className="w-full h-48 md:h-full object-cover hover:opacity-90 transition-opacity"
                                />
                            </Link>
                        </div>
                    )}
                    
                    <div className={`p-6 ${post.thumbnail ? 'md:w-2/3 lg:w-3/4' : 'w-full'}`}>
                        <div className="flex items-center gap-4 mb-3 text-sm text-gray-500">
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
                        
                        <h2 className="text-xl font-bold mb-3 leading-tight">
                            <Link 
                                href={`/blog/${post.slug}`}
                                className="text-gray-800 hover:text-pink-600 transition-colors"
                            >
                                {post.title}
                            </Link>
                        </h2>
                        
                        {post.excerpt && (
                            <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                                {post.excerpt}
                            </p>
                        )}
                        
                        {post.tags && post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {post.tags.slice(0, 4).map((tag) => (
                                    <span
                                        key={tag}
                                        className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs hover:bg-gray-200 transition-colors"
                                    >
                                        #{tag}
                                    </span>
                                ))}
                                {post.tags.length > 4 && (
                                    <span className="text-gray-400 text-xs self-center">
                                        +{post.tags.length - 4}
                                    </span>
                                )}
                            </div>
                        )}
                        
                        <div className="mt-4">
                            <Link 
                                href={`/blog/${post.slug}`}
                                className="text-pink-600 hover:text-pink-700 text-sm font-medium inline-flex items-center transition-colors"
                            >
                                続きを読む →
                            </Link>
                        </div>
                    </div>
                </div>
            </article>
        );
    }

    // 縦型レイアウト（既存のデザイン）
    return (
        <article className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            {post.thumbnail && (
                <Link href={`/blog/${post.slug}`}>
                    <img
                        src={post.thumbnail}
                        alt={post.title}
                        className="w-full h-48 object-cover hover:opacity-90 transition-opacity"
                    />
                </Link>
            )}
            
            <div className="p-6">
                <h2 className="text-xl font-semibold mb-2">
                    <Link 
                        href={`/blog/${post.slug}`}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                    >
                        {post.title}
                    </Link>
                </h2>
                
                {post.excerpt && (
                    <p className="text-gray-600 mb-4 text-sm line-clamp-3">
                        {post.excerpt}
                    </p>
                )}
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                    <time dateTime={post.publishedAt}>
                        {new Date(post.publishedAt).toLocaleDateString('ja-JP', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </time>
                    
                    {post.category && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                            {post.category}
                        </span>
                    )}
                </div>
                
                {post.tags && post.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1">
                        {post.tags.slice(0, 3).map((tag) => (
                            <span
                                key={tag}
                                className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs"
                            >
                                #{tag}
                            </span>
                        ))}
                        {post.tags.length > 3 && (
                            <span className="text-gray-400 text-xs">
                                +{post.tags.length - 3}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </article>
    );
}
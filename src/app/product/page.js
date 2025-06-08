'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Info, Tag, ExternalLink, Share2 } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import PlaceholderImage from '../components/ui/PlaceholderImage';
import SchemaOrg from '../components/SchemaOrg';
import Breadcrumb from '../components/ui/Breadcrumb';
import { getProductById } from '../../lib/firebase/products';

// 日付フォーマット関数
const formatDate = (dateValue) => {
    if (!dateValue) return '未定';

    // 文字列の場合はそのまま表示形式に変換
    if (typeof dateValue === 'string') {
        // YYYY-MM-DD 形式を YYYY/MM/DD 形式に変換
        if (dateValue.includes('-')) {
            return dateValue.replace(/-/g, '/');
        }
        return dateValue;
    }

    // タイムスタンプオブジェクトの場合はDate型に変換
    if (typeof dateValue === 'object' && dateValue.seconds) {
        const date = new Date(dateValue.seconds * 1000);
        return date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).replace(/\//g, '/');
    }

    return dateValue;
};

// 実際のコンテンツコンポーネント
function ProductDetail() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const productId = searchParams.get('id');

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [shareUrl, setShareUrl] = useState('');

    useEffect(() => {
        const fetchProductDetails = async () => {
            try {
                setLoading(true);

                if (!productId) {
                    throw new Error('作品IDが指定されていません');
                }

                const productData = await getProductById(productId);

                if (!productData) {
                    throw new Error('指定された作品が見つかりませんでした');
                }

                // データの前処理（特にタイムスタンプオブジェクトの処理）
                const processedProduct = {
                    ...productData,
                    // タイムスタンプを文字列に変換
                    releaseDate: formatDate(productData.releaseDate),
                    // 配列が未定義の場合に空配列を設定
                    cast: Array.isArray(productData.cast) ? productData.cast : [],
                    tags: Array.isArray(productData.tags) ? productData.tags : [],
                    // 特典情報がなければ空オブジェクトを設定
                    bonuses: productData.bonuses || {}
                };

                setProduct(processedProduct);

                // シェアURLを設定
                if (typeof window !== 'undefined') {
                    const currentUrl = window.location.href;
                    setShareUrl(currentUrl);
                }
            } catch (error) {
                console.error('作品詳細の取得中にエラーが発生しました:', error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProductDetails();
    }, [productId]);

    const handleBack = () => {
        router.back();
    };

    const handleTagClick = (tag) => {
        router.push(`/search?tag=${encodeURIComponent(tag)}`);
    };

    const handleActorClick = (actor) => {
        router.push(`/search?actor=${encodeURIComponent(actor)}`);
    };

    const handleShareOnX = () => {
        if (!product) return;

        const text = `${product.title} | シチュエーションCDデータベース`;
        const url = encodeURIComponent(shareUrl);
        const hashtags = 'シチュエーションCD,シチュCD';

        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${url}&hashtags=${hashtags}`;

        window.open(twitterUrl, '_blank', 'noopener,noreferrer');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col bg-gray-50">
                <Header />
                <main className="flex-grow container mx-auto px-4 py-8">
                    <div className="text-center py-12">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-pink-400 border-r-transparent"></div>
                        <p className="mt-4 text-gray-600">作品情報を読み込み中...</p>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen flex flex-col bg-gray-50">
                <Header />
                <main className="flex-grow container mx-auto px-4 py-8">
                    {/* 戻るボタン */}
                    <button
                        onClick={handleBack}
                        className="mb-6 flex items-center gap-2 px-4 py-2 bg-white text-pink-600 rounded-full shadow-md border border-pink-100 hover:bg-pink-50 hover:border-pink-200 hover:shadow-lg transition-all duration-300 group"
                    >
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform duration-300" />
                        <span className="font-medium">一覧に戻る</span>
                    </button>

                    <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                        <p className="text-lg text-gray-700 mb-4">
                            {error || '作品情報の取得中にエラーが発生しました'}
                        </p>
                        <p className="text-gray-600">別の作品を選択するか、トップページに戻ってみてください。</p>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            {/* SchemaOrgコンポーネントを追加 */}
            <SchemaOrg product={product} />
            <SchemaOrg 
                type="breadcrumb" 
                breadcrumbs={[
                    { name: '作品一覧', href: '/products' },
                    { name: product.title }
                ]} 
            />

            <Header />

            <main className="flex-grow">
                <div className="container mx-auto px-4 py-8">
                    {/* パンくずリスト */}
                    <Breadcrumb items={[
                        { name: '作品一覧', href: '/products' },
                        { name: product.title }
                    ]} />

                    {/* 戻るボタンとシェアボタン */}
                    <div className="flex justify-between items-center mb-6">
                        <button
                            onClick={handleBack}
                            className="flex items-center gap-2 px-4 py-2 bg-white text-pink-600 rounded-full shadow-md border border-pink-100 hover:bg-pink-50 hover:border-pink-200 hover:shadow-lg transition-all duration-300 group"
                        >
                            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform duration-300" />
                            <span className="font-medium">一覧に戻る</span>
                        </button>

                        {/* シェアボタン */}
                        <button
                            onClick={handleShareOnX}
                            className="flex items-center gap-2 px-4 py-2 bg-white text-[#1DA1F2] rounded-full shadow-md border border-gray-200 hover:bg-gray-50 hover:border-[#1DA1F2] hover:shadow-lg transition-all duration-300"
                        >
                            <Share2 size={18} />
                            <span className="font-medium">Xでシェア</span>
                        </button>
                    </div>

                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        <div className="p-6">
                            <h1 className="text-2xl font-bold text-gray-800 mb-2">{product.title}</h1>
                            {product.series && (
                                <p className="text-lg text-gray-600 mb-6">シリーズ：{product.series}</p>
                            )}

                            <div className="flex flex-col md:flex-row gap-8">
                                {/* 画像表示部分 */}
                                <div className="md:w-1/3">
                                    {product.thumbnailUrl ? (
                                        <img
                                            src={product.thumbnailUrl}
                                            alt={product.title}
                                            className="w-full rounded-lg"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'block';
                                            }}
                                        />
                                    ) : (
                                        <PlaceholderImage width="100%" height="400" />
                                    )}
                                    {/* バックアップとして用意しておくプレースホルダー（デフォルトは非表示） */}
                                    {product.thumbnailUrl && (
                                        <div style={{ display: 'none', width: '100%' }}>
                                            <PlaceholderImage width="100%" height="400" />
                                        </div>
                                    )}
                                </div>

                                <div className="md:w-2/3">
                                    <div className="mb-8">
                                        <h2 className="text-xl font-bold mb-4 flex items-center">
                                            <Info size={20} className="mr-2 text-pink-500" />
                                            基本情報
                                        </h2>
                                        <table className="w-full border-collapse">
                                            <tbody>
                                                <tr className="border-b border-gray-100">
                                                    <th className="py-3 text-left text-gray-600 w-1/4">発売日</th>
                                                    <td className="py-3">{product.releaseDate}</td>
                                                </tr>
                                                <tr className="border-b border-gray-100">
                                                    <th className="py-3 text-left text-gray-600">メーカー</th>
                                                    <td className="py-3">
                                                        {product.maker && (
                                                            <span className="text-pink-600 hover:underline cursor-pointer"
                                                                onClick={() => router.push(`/search?q=${encodeURIComponent(product.maker)}`)}>
                                                                {product.maker}
                                                            </span>
                                                        )}
                                                        {!product.maker && <span className="text-gray-500">不明</span>}
                                                    </td>
                                                </tr>
                                                <tr className="border-b border-gray-100">
                                                    <th className="py-3 text-left text-gray-600">キャスト</th>
                                                    <td className="py-3">
                                                        {product.cast && product.cast.length > 0 ? (
                                                            <div className="flex flex-wrap gap-2">
                                                                {product.cast.map((actor, index) => (
                                                                    <span
                                                                        key={index}
                                                                        className="text-pink-600 hover:underline cursor-pointer after:content-[','] last:after:content-[''] after:text-gray-500"
                                                                        onClick={() => handleActorClick(actor)}
                                                                    >
                                                                        {actor}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-500">情報なし</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="mb-8">
                                        <h2 className="text-xl font-bold mb-4 flex items-center">
                                            <Tag size={20} className="mr-2 text-pink-500" />
                                            タグ
                                        </h2>
                                        {product.tags && product.tags.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {product.tags.map((tag, index) => (
                                                    <span
                                                        key={index}
                                                        className="bg-pink-50 text-pink-600 px-3 py-1.5 rounded-full hover:bg-pink-100 transition-colors cursor-pointer"
                                                        onClick={() => handleTagClick(tag)}
                                                    >
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-500">タグ情報なし</p>
                                        )}
                                    </div>

                                    {/* 販売情報部分 - DLsiteがるまにのみ表示 */}
                                    <div>
                                        <h2 className="text-xl font-bold mb-6 flex items-center">
                                            <ExternalLink size={20} className="mr-2 text-pink-500" />
                                            販売情報
                                        </h2>

                                        <div className="flex flex-wrap gap-4">
                                            {/* DLsiteがるまにボタン */}
                                            {product.dlafUrl && (
                                                <a
                                                    href={product.dlafUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-center gap-2 bg-[#052A83] hover:bg-[#041e61] text-white text-center py-2.5 px-4 rounded-md transition-colors font-medium text-sm whitespace-nowrap w-52"
                                                >
                                                    <ExternalLink size={16} />
                                                    DLsiteがるまにで聴く
                                                </a>
                                            )}

                                            {/* ポケットドラマCD */}
                                            {product.pocketdramaUrl && (
                                                <a
                                                    href={product.pocketdramaUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-center gap-2 bg-[#3561A9] hover:bg-[#2a4e89] text-white text-center py-2.5 px-4 rounded-md transition-colors font-medium text-sm whitespace-nowrap w-52"
                                                >
                                                    <ExternalLink size={16} />
                                                    ポケドラで聴く
                                                </a>
                                            )}

                                            {/* ステラプレイヤー */}
                                            {product.stellaplayerUrl && (
                                                <a
                                                    href={product.stellaplayerUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-center gap-2 bg-[#FF8D8D] hover:bg-[#e57e7e] text-white text-center py-2.5 px-4 rounded-md transition-colors font-medium text-sm whitespace-nowrap w-52"
                                                >
                                                    <ExternalLink size={16} />
                                                    ステラプレイヤーで聴く
                                                </a>
                                            )}
                                        </div>

                                        {/* 販売情報がない場合のメッセージ */}
                                        {!product.dlafUrl && !product.pocketdramaUrl && !product.stellaplayerUrl && (
                                            <p className="text-gray-500">販売情報は準備中です</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div >
                </div >
            </main >
            <Footer />
        </div >
    );
}

// メインのページコンポーネント
export default function ProductDetailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex flex-col bg-gray-50">
                <Header />
                <main className="flex-grow container mx-auto px-4 py-8">
                    <div className="text-center py-12">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-pink-400 border-r-transparent"></div>
                        <p className="mt-4 text-gray-600">読み込み中...</p>
                    </div>
                </main>
                <Footer />
            </div>
        }>
            <ProductDetail />
        </Suspense>
    );
}
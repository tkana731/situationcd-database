// src/app/actor/[name]/page.js

import { notFound } from 'next/navigation';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import ActorContent from './ActorContent';
import { getAllActors, searchProductsPaginated } from '../../../lib/firebase/products';

// 静的パスを生成する関数
export async function generateStaticParams() {
    // ビルド時のみ実行（開発環境では空配列を返す）
    if (process.env.NODE_ENV !== 'production') {
        return [];
    }

    try {
        const actors = await getAllActors();

        return actors.map(actor => ({
            name: actor.name  // URLエンコードはNext.jsが自動で行う
        }));
    } catch (error) {
        console.error('Error fetching actors for static params:', error);
        return [];
    }
}

export async function generateMetadata({ params }) {
    const resolvedParams = await params;
    const actorName = decodeURIComponent(resolvedParams.name);
    // 末尾にスラッシュを追加
    const canonicalUrl = `https://situationcd.com/actor/${encodeURIComponent(actorName)}/`;

    // 声優の出演作品を取得してメタディスクリプションを生成
    const { products } = await searchProductsPaginated({ actor: actorName }, 1, 10);
    
    let description = `${actorName}の出演作品は、`;
    
    // 作品名を最大3つまで含める
    if (products.length > 0) {
        const productNames = products.slice(0, 3).map(p => p.title);
        description += productNames.join('、');
        if (products.length > 3) {
            description += 'など';
        }
        description += 'を掲載しています。';
        
        // タグを収集
        const allTags = new Set();
        products.forEach(product => {
            if (product.tags && Array.isArray(product.tags)) {
                product.tags.forEach(tag => allTags.add(tag));
            }
        });
        
        // タグを最大3つまで含める
        if (allTags.size > 0) {
            const tagArray = Array.from(allTags).slice(0, 3);
            description += tagArray.join('、');
            if (allTags.size > 3) {
                description += 'など';
            }
            description += 'のジャンルが楽しめます。';
        }
    } else {
        description += 'シチュエーションCDの一覧です。';
    }

    return {
        title: `${actorName}の出演作品一覧 | シチュエーションCDデータベース`,
        description: description,
        keywords: `${actorName},出演作品,シチュエーションCD,声優,ドラマCD`,
        openGraph: {
            title: `${actorName}の出演作品一覧`,
            description: description,
            url: canonicalUrl,
            siteName: 'シチュエーションCDデータベース',
            locale: 'ja_JP',
            type: 'website',
        },
        alternates: {
            canonical: canonicalUrl,
        }
    };
}

export default async function ActorPage({ params }) {
    const resolvedParams = await params;
    const actorName = decodeURIComponent(resolvedParams.name);

    // サーバーサイドでデータを取得
    const { products, totalCount, hasMore } = await searchProductsPaginated({ actor: actorName }, 1, 20);

    // 作品が存在しない場合は404を返す
    if (totalCount === 0) {
        notFound();
    }

    // Firestoreタイムスタンプをシリアライズ
    const serializedProducts = products.map(product => ({
        ...product,
        createdAt: product.createdAt?.toDate?.() ? product.createdAt.toDate().toISOString() : product.createdAt,
        updatedAt: product.updatedAt?.toDate?.() ? product.updatedAt.toDate().toISOString() : product.updatedAt
    }));

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Header />
            <main className="flex-grow">
                <ActorContent 
                    actorName={actorName}
                    initialProducts={serializedProducts}
                    initialTotalCount={totalCount}
                    initialHasMore={hasMore}
                />
            </main>
            <Footer />
        </div>
    );
}
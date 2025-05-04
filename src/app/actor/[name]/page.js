// src/app/actor/[name]/page.js

import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import ActorContent from './ActorContent';
import { getAllActors } from '../../../lib/firebase/products';

// 静的パスを生成する関数
export async function generateStaticParams() {
    // 実際の声優データを取得
    try {
        const actors = await getAllActors();

        return actors.map(actor => ({
            name: encodeURIComponent(actor.name)
        }));
    } catch (error) {
        console.error('Error fetching actors for static params:', error);
        return [];
    }
}

export async function generateMetadata({ params }) {
    const resolvedParams = await params;
    const actorName = decodeURIComponent(resolvedParams.name);

    // プリレンダリング時にFirebaseが初期化されていない可能性があるため、
    // デフォルト値を使用
    const defaultProductCount = 0;

    return {
        title: `${actorName}の出演作品一覧 | シチュエーションCDデータベース`,
        description: `${actorName}が出演するシチュエーションCDの一覧です。`,
        keywords: `${actorName},出演作品,シチュエーションCD,声優,ドラマCD`,
        openGraph: {
            title: `${actorName}の出演作品一覧`,
            description: `${actorName}が出演するシチュエーションCDの一覧`,
            url: `https://situationcd.com/actor/${encodeURIComponent(actorName)}`,
            siteName: 'シチュエーションCDデータベース',
            locale: 'ja_JP',
            type: 'website',
        }
    };
}

export default function ActorPage() {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Header />
            <main className="flex-grow">
                <ActorContent />
            </main>
            <Footer />
        </div>
    );
}
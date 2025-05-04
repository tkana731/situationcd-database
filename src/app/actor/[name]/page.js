// /src/app/actor/[name]/page.js

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
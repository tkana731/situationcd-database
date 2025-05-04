// src/app/year/[year]/page.js

import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import YearContent from './YearContent';

export async function generateStaticParams() {
    const currentYear = new Date().getFullYear();
    const years = [];

    // 2010年から現在の年までのパラメータを生成
    for (let y = 2010; y <= currentYear; y++) {
        years.push({ year: y.toString() });
    }

    return years;
}

export async function generateMetadata({ params }) {
    const resolvedParams = await params;

    // プリレンダリング時にFirebaseが初期化されていない可能性があるため、
    // デフォルト値を使用
    const defaultProductCount = 0;

    return {
        title: `${resolvedParams.year}年の作品一覧 | シチュエーションCDデータベース`,
        description: `${resolvedParams.year}年に発売されたシチュエーションCDの一覧です。`,
        keywords: `シチュエーションCD,${resolvedParams.year}年,発売作品,ドラマCD,女性向け`,
        openGraph: {
            title: `${resolvedParams.year}年の作品一覧`,
            description: `${resolvedParams.year}年に発売されたシチュエーションCDの一覧`,
            url: `https://situationcd.com/year/${resolvedParams.year}`,
            siteName: 'シチュエーションCDデータベース',
            locale: 'ja_JP',
            type: 'website',
        }
    };
}

export default function YearPage() {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Header />
            <main className="flex-grow">
                <YearContent />
            </main>
            <Footer />
        </div>
    );
}
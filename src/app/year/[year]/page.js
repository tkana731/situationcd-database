// src/app/year/[year]/page.js

import { notFound } from 'next/navigation';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import YearContent from './YearContent';
import { getProductsByYear, getProductCountsByMonth } from '../../../lib/firebase/products';

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
    const year = resolvedParams.year;
    // 末尾にスラッシュを追加
    const canonicalUrl = `https://situationcd.com/year/${encodeURIComponent(year)}/`;

    return {
        title: `${year}年の作品一覧 | シチュエーションCDデータベース`,
        description: `${year}年に発売されたシチュエーションCDの一覧です。`,
        keywords: `シチュエーションCD,${year}年,発売作品,ドラマCD,女性向け`,
        openGraph: {
            title: `${year}年の作品一覧`,
            description: `${year}年に発売されたシチュエーションCDの一覧`,
            url: canonicalUrl,
            siteName: 'シチュエーションCDデータベース',
            locale: 'ja_JP',
            type: 'website',
        },
        // canonicalを明示的に設定
        alternates: {
            canonical: canonicalUrl,
        }
    };
}

export default async function YearPage({ params }) {
    const resolvedParams = await params;
    const year = resolvedParams.year;

    // サーバーサイドでデータを取得
    const { products, totalCount } = await getProductsByYear(year, 1, 1000);
    const monthlyCounts = await getProductCountsByMonth(year);

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
                <YearContent 
                    year={year}
                    initialProducts={serializedProducts}
                    initialMonthlyCounts={monthlyCounts}
                />
            </main>
            <Footer />
        </div>
    );
}
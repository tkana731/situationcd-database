// /src/app/years/page.js

'use client';

import { useEffect, useState } from 'react';
import { Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Breadcrumb from '../components/ui/Breadcrumb';
import { getProductCountsByYear } from '../../lib/firebase/products';

export default function YearsPage() {
    const [years, setYears] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchYears = async () => {
            try {
                setLoading(true);
                // 年別の作品数を取得
                const yearCounts = await getProductCountsByYear();
                
                // 年をキーとして降順でソート
                const sortedYears = Object.entries(yearCounts)
                    .filter(([year, count]) => count > 0) // 作品がある年のみ
                    .sort(([a], [b]) => parseInt(b) - parseInt(a))
                    .map(([year, count]) => ({
                        year: year,
                        count: count
                    }));
                
                setYears(sortedYears);
            } catch (error) {
                console.error('年代データの取得中にエラーが発生しました:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchYears();
    }, []);

    const handleYearClick = (year) => {
        router.push(`/year/${year}`);
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Header />

            <main className="flex-grow">
                <div className="container mx-auto px-4 py-8">
                    {/* パンくずリスト */}
                    <Breadcrumb items={[
                        { name: '年代別' }
                    ]} />

                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
                            <Calendar size={20} className="mr-2 text-pink-500" />
                            年代別作品一覧
                        </h1>
                        <p className="text-gray-600">リリース年から作品を探せます</p>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-pink-400 border-r-transparent"></div>
                            <p className="mt-4 text-gray-600">年代データを読み込み中...</p>
                        </div>
                    ) : years.length > 0 ? (
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {years.map((yearData) => (
                                    <button
                                        key={yearData.year}
                                        onClick={() => handleYearClick(yearData.year)}
                                        className="flex items-center justify-between bg-white border border-pink-200 text-gray-700 px-4 py-3 rounded-lg hover:bg-pink-50 hover:border-pink-300 transition-colors"
                                    >
                                        <span className="font-medium">{yearData.year}年</span>
                                        <span className="bg-pink-100 text-pink-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                            {yearData.count}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                            <p className="text-lg text-gray-700 mb-4">年代データが見つかりませんでした</p>
                            <p className="text-gray-600">現在年代データの準備中です。また後でご確認ください。</p>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
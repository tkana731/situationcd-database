// /src/app/year/[year]/YearContent.js

'use client';

import { useEffect, useState, useRef } from 'react';
import { Box, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import ProductGrid from '../../components/ui/ProductGrid';
import Pagination from '../../components/ui/Pagination';
import { getProductsByYear } from '../../../lib/firebase/products';

export default function YearContent() {
    const params = useParams();
    const router = useRouter();
    const year = params?.year;
    const dropdownRef = useRef(null);
    const monthNavDropdownRef = useRef(null);

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [groupedByMonth, setGroupedByMonth] = useState({});
    const [groupedByDate, setGroupedByDate] = useState({});
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMonthNavDropdown, setIsMonthNavDropdown] = useState(false);
    const [sortType, setSortType] = useState('month'); // 'month' または 'date'
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [hasMore, setHasMore] = useState(false);

    useEffect(() => {
        const fetchProductsByYear = async () => {
            if (!year) return;

            try {
                setLoading(true);
                const { products: productsData, totalCount: count, hasMore: more } =
                    await getProductsByYear(year, page, 20);

                setProducts(productsData);
                setTotalCount(count);
                setHasMore(more);

                // 月別にグループ化
                const groupedMonth = {};
                // 日付別にグループ化
                const groupedDate = {};

                productsData.forEach(product => {
                    if (product.releaseDate) {
                        // 月別グループ化
                        const month = product.releaseDate.substring(5, 7);
                        if (!groupedMonth[month]) {
                            groupedMonth[month] = [];
                        }
                        groupedMonth[month].push(product);

                        // 日付別グループ化（YYYY-MM-DD をキーに使用）
                        const date = product.releaseDate;
                        if (!groupedDate[date]) {
                            groupedDate[date] = [];
                        }
                        groupedDate[date].push(product);
                    }
                });

                setGroupedByMonth(groupedMonth);
                setGroupedByDate(groupedDate);
            } catch (error) {
                console.error('作品データの取得中にエラーが発生しました:', error);
                setProducts([]);
                setTotalCount(0);
                setHasMore(false);
            } finally {
                setLoading(false);
            }
        };

        fetchProductsByYear();
    }, [year, page]);

    // ページ変更時に先頭にスクロール
    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }, [page]);

    // スクロール位置の監視
    useEffect(() => {
        const handleScroll = () => {
            if (window.pageYOffset > 400) {
                setShowScrollButton(true);
            } else {
                setShowScrollButton(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // 特定の月にスクロール
    const scrollToMonth = (month) => {
        const elementId = sortType === 'month' ? `month-${month}` : `month-date-${month}`;
        const element = document.getElementById(elementId);
        if (element) {
            const headerOffset = 100; // ヘッダーの高さ分オフセット
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
        // スマホの場合はドロップダウンを閉じる
        setIsMonthNavDropdown(false);
    };

    // トップに戻るボタンのハンドラ
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    // 月名の取得
    const getMonthName = (month) => {
        const months = [
            '1月', '2月', '3月', '4月', '5月', '6月',
            '7月', '8月', '9月', '10月', '11月', '12月'
        ];
        return months[parseInt(month) - 1];
    };

    // 日付フォーマット（YYYY-MM-DD を M月D日 に変換）
    const formatDate = (dateString) => {
        const [year, month, day] = dateString.split('-');
        return `${parseInt(month)}月${parseInt(day)}日`;
    };

    // 年のリストを生成
    const generateYearList = () => {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let y = currentYear; y >= 2010; y--) {
            years.push(y);
        }
        return years;
    };

    // ドロップダウン切替
    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    // 外部クリックでドロップダウンを閉じる
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (isDropdownOpen && dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsDropdownOpen(false);
            }
            if (isMonthNavDropdown && monthNavDropdownRef.current && !monthNavDropdownRef.current.contains(e.target)) {
                setIsMonthNavDropdown(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [isDropdownOpen, isMonthNavDropdown]);

    // 月リストを取得
    const getAvailableMonths = () => {
        const months = Object.keys(sortType === 'month' ? groupedByMonth : groupedByDate)
            .map(key => {
                // 日別表示の場合はYYYY-MM-DDから月を抽出
                const month = sortType === 'month' ? key : key.substring(5, 7);
                return month;
            })
            .filter((value, index, self) => self.indexOf(value) === index) // 重複削除
            .sort((a, b) => parseInt(a) - parseInt(b));

        return months;
    };

    // ページ変更ハンドラ
    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

    // 総ページ数の計算
    const totalPages = Math.ceil(totalCount / 20);

    if (!year) {
        return (
            <div className="container mx-auto px-4 py-8">
                <p className="text-center text-gray-600">読み込み中...</p>
            </div>
        );
    }

    const availableMonths = getAvailableMonths();

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                    <Calendar size={20} className="mr-2 text-pink-500" />
                    {year}年の作品一覧
                </h1>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <p className="text-gray-600">{totalCount}件の作品</p>

                    <div className="flex flex-wrap gap-4 items-center">
                        {/* 年選択ドロップダウン */}
                        <div className="dropdown-container relative" ref={dropdownRef}>
                            <button
                                onClick={toggleDropdown}
                                className="px-4 py-2 rounded-md flex items-center bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                            >
                                {year}年
                                <ChevronDown size={16} className={`ml-2 transform transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-10 max-h-96 overflow-y-auto">
                                    {generateYearList().map(y => (
                                        <button
                                            key={y}
                                            onClick={() => {
                                                router.push(`/year/${y}`);
                                                setIsDropdownOpen(false);
                                            }}
                                            className={`block w-full text-left px-4 py-2 hover:bg-pink-50 ${y.toString() === year ? 'text-pink-600 font-medium' : 'text-gray-700'
                                                }`}
                                        >
                                            {y}年
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 表示形式切り替え */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setSortType('month')}
                                className={`px-4 py-2 rounded-md text-sm border ${sortType === 'month'
                                    ? 'bg-pink-50 text-pink-600 border-pink-200 font-medium'
                                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                月別表示
                            </button>
                            <button
                                onClick={() => setSortType('date')}
                                className={`px-4 py-2 rounded-md text-sm border ${sortType === 'date'
                                    ? 'bg-pink-50 text-pink-600 border-pink-200 font-medium'
                                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                日別表示
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 月別ナビゲーション */}
            {!loading && availableMonths.length > 0 && (
                <div className="mb-8 bg-white rounded-lg shadow-sm p-4">
                    <h2 className="text-sm font-medium text-gray-700 mb-3">各月にジャンプ</h2>

                    {/* デスクトップ: ボタン形式 */}
                    <div className="hidden md:flex flex-wrap gap-2">
                        {availableMonths.map(month => (
                            <button
                                key={month}
                                onClick={() => scrollToMonth(month)}
                                className="px-3 py-1.5 text-sm bg-pink-50 text-pink-600 hover:bg-pink-100 rounded-md transition-colors"
                            >
                                {getMonthName(month)}
                            </button>
                        ))}
                    </div>

                    {/* モバイル: ドロップダウン形式 */}
                    <div className="md:hidden month-nav-dropdown relative" ref={monthNavDropdownRef}>
                        <button
                            onClick={() => setIsMonthNavDropdown(!isMonthNavDropdown)}
                            className="w-full px-4 py-2 rounded-md flex items-center justify-between bg-white text-gray-700 border border-gray-200"
                        >
                            <span>月を選択してジャンプ</span>
                            <ChevronDown size={16} className={`transform transition-transform ${isMonthNavDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        {isMonthNavDropdown && (
                            <div className="absolute left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-20 max-h-64 overflow-y-auto">
                                {availableMonths.map(month => (
                                    <button
                                        key={month}
                                        onClick={() => scrollToMonth(month)}
                                        className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-pink-50 hover:text-pink-600"
                                    >
                                        {getMonthName(month)}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-pink-400 border-r-transparent"></div>
                    <p className="mt-4 text-gray-600">データを読み込み中...</p>
                </div>
            ) : products.length > 0 ? (
                <>
                    {sortType === 'month' ? (
                        // 月別表示
                        Object.keys(groupedByMonth)
                            .sort((a, b) => parseInt(a) - parseInt(b))
                            .map(month => (
                                <div
                                    key={month}
                                    className="mb-12"
                                    id={`month-${month}`} // スクロール用ID
                                >
                                    <h2 className="text-xl font-bold mb-6 flex items-center">
                                        <Box size={18} className="mr-2 text-pink-500" />
                                        {year}年{getMonthName(month)}
                                    </h2>
                                    <ProductGrid products={groupedByMonth[month]} />
                                </div>
                            ))
                    ) : (
                        // 日別表示
                        Object.keys(groupedByDate)
                            .sort((a, b) => new Date(a) - new Date(b))
                            .map((date, index) => {
                                const month = date.substring(5, 7);
                                const isFirstDayOfMonth = index === 0 ||
                                    Object.keys(groupedByDate).sort((a, b) => new Date(a) - new Date(b))[index - 1].substring(5, 7) !== month;

                                return (
                                    <div
                                        key={date}
                                        className="mb-12"
                                        id={isFirstDayOfMonth ? `month-date-${month}` : undefined}
                                    >
                                        <h2 className="text-xl font-bold mb-6 flex items-center">
                                            <Box size={18} className="mr-2 text-pink-500" />
                                            {year}年{formatDate(date)}
                                        </h2>
                                        <ProductGrid products={groupedByDate[date]} />
                                    </div>
                                );
                            })
                    )}

                    {/* ページネーション */}
                    <div className="mt-10">
                        <Pagination
                            currentPage={page}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                            colorScheme="pink"
                        />
                    </div>
                </>
            ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                    <p className="text-lg text-gray-700 mb-4">{year}年の作品が見つかりませんでした</p>
                    <p className="text-gray-600">別の年を選択してみてください。</p>
                </div>
            )}

            {/* ページトップに戻るボタン */}
            {showScrollButton && (
                <button
                    onClick={scrollToTop}
                    className="fixed bottom-6 right-6 bg-pink-500 hover:bg-pink-600 text-white p-3 rounded-full shadow-lg transition-opacity duration-300 z-50"
                    aria-label="ページトップに戻る"
                >
                    <ChevronUp size={24} />
                </button>
            )}
        </div>
    );
}
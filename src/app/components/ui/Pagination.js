// /src/app/components/ui/Pagination.js

'use client';

import { useEffect, useState } from 'react';

export default function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    colorScheme = 'pink' // 'pink' or 'blue'
}) {
    const [windowWidth, setWindowWidth] = useState(
        typeof window !== 'undefined' ? window.innerWidth : 1024
    );

    // 画面サイズの変更を監視
    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };

        if (typeof window !== 'undefined') {
            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
        }
    }, []);

    // モバイル表示かどうかを判定
    const isMobile = windowWidth < 640;

    // ページネーションボタンハンドラー
    const handlePrevPage = () => {
        onPageChange(Math.max(currentPage - 1, 1));
    };

    const handleNextPage = () => {
        onPageChange(Math.min(currentPage + 1, totalPages));
    };

    // 表示するページボタンの範囲計算
    const getPageNumbers = () => {
        const pageNumbers = [];
        // モバイルでは表示するページ数を減らす
        const range = isMobile ? 1 : 2;

        // 最初のページは常に表示
        pageNumbers.push(1);

        // 現在のページから前後range分のページのみ表示
        for (let i = Math.max(2, currentPage - range); i <= Math.min(totalPages - 1, currentPage + range); i++) {
            if (i - pageNumbers[pageNumbers.length - 1] > 1) {
                pageNumbers.push(null); // 省略を表す
            }
            pageNumbers.push(i);
        }

        // 最後のページは常に表示
        if (totalPages > 1) {
            if (pageNumbers[pageNumbers.length - 1] !== totalPages) {
                if (totalPages - pageNumbers[pageNumbers.length - 1] > 1) {
                    pageNumbers.push(null);
                }
                pageNumbers.push(totalPages);
            }
        }

        return pageNumbers;
    };

    // カラースキームの取得
    const getColorClasses = () => {
        const schemes = {
            pink: {
                active: 'bg-pink-600 text-white shadow-lg scale-110',
                inactive: 'bg-white text-gray-700 border border-gray-200 hover:border-pink-300 hover:text-pink-600 hover:shadow-sm',
                button: 'bg-white text-pink-600 border border-pink-200 hover:bg-pink-50 shadow-sm',
                buttonDisabled: 'bg-gray-100 text-gray-300 cursor-not-allowed',
            },
            blue: {
                active: 'bg-blue-600 text-white shadow-lg scale-110',
                inactive: 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-600 hover:shadow-sm',
                button: 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 shadow-sm',
                buttonDisabled: 'bg-gray-100 text-gray-300 cursor-not-allowed',
            }
        };
        return schemes[colorScheme] || schemes.pink;
    };

    const colors = getColorClasses();

    if (totalPages <= 1) return null;

    return (
        <div className="flex flex-wrap justify-center items-center gap-1 sm:gap-2">
            {/* モバイル表示では「最初へ」ボタンを非表示 */}
            {!isMobile && (
                <button
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                    className={`px-2 sm:px-4 py-1 sm:py-2 rounded-full text-sm ${currentPage === 1 ? colors.buttonDisabled : colors.button}`}
                >
                    最初へ
                </button>
            )}

            {/* 「前へ」ボタン - モバイルでもコンパクトに表示 */}
            <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className={`px-2 sm:px-4 py-1 sm:py-2 rounded-full text-sm ${currentPage === 1 ? colors.buttonDisabled : colors.button}`}
            >
                前へ
            </button>

            {/* ページ番号ボタン - モバイルではサイズ縮小 */}
            {getPageNumbers().map((pageNum, index) => (
                pageNum === null ? (
                    <span key={`ellipsis-${index}`} className="px-1 py-1 text-gray-500">
                        ...
                    </span>
                ) : (
                    <button
                        key={pageNum}
                        onClick={() => onPageChange(pageNum)}
                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full transition-all text-sm ${pageNum === currentPage ? colors.active : colors.inactive
                            }`}
                    >
                        {pageNum}
                    </button>
                )
            ))}

            {/* 「次へ」ボタン - モバイルでもコンパクトに表示 */}
            <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className={`px-2 sm:px-4 py-1 sm:py-2 rounded-full text-sm ${currentPage === totalPages ? colors.buttonDisabled : colors.button}`}
            >
                次へ
            </button>

            {/* モバイル表示では「最後へ」ボタンを非表示 */}
            {!isMobile && (
                <button
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className={`px-2 sm:px-4 py-1 sm:py-2 rounded-full text-sm ${currentPage === totalPages ? colors.buttonDisabled : colors.button}`}
                >
                    最後へ
                </button>
            )}
        </div>
    );
}
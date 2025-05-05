// /src/app/components/ui/Pagination.js

'use client';

export default function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    colorScheme = 'pink' // 'pink' or 'blue'
}) {
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
        const range = 2; // 現在のページの前後に表示する数

        // 最初のページは常に表示
        pageNumbers.push(1);

        // 現在のページから前後2ページのみ表示
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
        <div className="flex justify-center items-center gap-2">
            {/* 前のページへ */}
            <button
                onClick={() => onPageChange(1)}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-full ${currentPage === 1 ? colors.buttonDisabled : colors.button}`}
            >
                最初へ
            </button>
            <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-full ${currentPage === 1 ? colors.buttonDisabled : colors.button}`}
            >
                前へ
            </button>

            {/* ページ番号 */}
            {getPageNumbers().map((pageNum, index) => (
                pageNum === null ? (
                    <span key={`ellipsis-${index}`} className="px-2 py-2">
                        ...
                    </span>
                ) : (
                    <button
                        key={pageNum}
                        onClick={() => onPageChange(pageNum)}
                        className={`w-10 h-10 rounded-full transition-all ${pageNum === currentPage ? colors.active : colors.inactive
                            }`}
                    >
                        {pageNum}
                    </button>
                )
            ))}

            {/* 次のページへ */}
            <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-full ${currentPage === totalPages ? colors.buttonDisabled : colors.button}`}
            >
                次へ
            </button>
            <button
                onClick={() => onPageChange(totalPages)}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-full ${currentPage === totalPages ? colors.buttonDisabled : colors.button}`}
            >
                最後へ
            </button>
        </div>
    );
}
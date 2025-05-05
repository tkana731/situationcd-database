// src/lib/firebase/dlsiteAffiliateGenerator.js

/**
 * DLsiteがるまにURLからDLsiteアフィリエイトURLを生成
 * @param {string} dlsiteUrl - DLsiteがるまにURL
 * @returns {string|null} DLsiteアフィリエイトURL
 */
export const generateDLsiteAffiliateUrl = (dlsiteUrl) => {
    if (!dlsiteUrl) return null;

    try {
        const url = new URL(dlsiteUrl);
        const pathname = url.pathname;

        // DLsiteURLからproduct_idを抽出
        const match = pathname.match(/product_id\/(RJ\d+|BJ\d+)\.html/);
        if (!match) return null;

        const productId = match[1];

        // サイトタイプを判定（girls, girls-drama, pro など）
        let siteType = 'girls';
        if (pathname.includes('/girls-drama/')) {
            siteType = 'girls-drama';
        } else if (pathname.includes('/pro/')) {
            siteType = 'pro';
        }

        // アフィリエイトURLを生成
        return `https://dlaf.jp/${siteType}/dlaf/=/t/s/link/work/aid/situationcd/id/${productId}.html`;
    } catch (error) {
        console.error('Error generating affiliate URL:', error);
        return null;
    }
};
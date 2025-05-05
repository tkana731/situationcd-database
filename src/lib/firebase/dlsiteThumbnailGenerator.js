// src/lib/firebase/dlsiteThumbnailGenerator.js

/**
 * DLsiteがるまにURLからサムネイル画像URLを生成
 * @param {string} dlsiteUrl - DLsiteがるまにURL
 * @returns {string|null} サムネイル画像URL
 */
export const generateThumbnailUrl = (dlsiteUrl) => {
    if (!dlsiteUrl) return null;

    // DLsiteがるまにURLからproduct_idを抽出
    const match = dlsiteUrl.match(/product_id\/(BJ\d+|RJ\d+)\.html/);
    if (!match) return null;

    const productId = match[1];
    const isGirls = productId.startsWith('BJ');

    // RJかBJかで数値形式の処理を分ける
    if (isGirls) {
        // BJの場合（既存の処理）
        const baseId = parseInt(productId.substring(2));
        const roundedBase = Math.ceil(baseId / 1000) * 1000;

        // folderNameの生成
        let folderName;
        if (productId.match(/^BJ0/)) {
            // BJ01852219のパターン：先頭の0を維持して8桁にパディング
            folderName = `BJ${roundedBase.toString().padStart(8, '0')}`;
        } else {
            // BJ609911のパターン：先頭の0を削除
            folderName = `BJ${roundedBase}`;
        }

        // サムネイル画像URLを生成（BJ用）
        return `https://img.dlsite.jp/modpub/images2/work/books/${folderName}/${productId}_img_main.jpg`;
    } else {
        // RJの場合（新規追加）
        const baseId = parseInt(productId.substring(2));
        const roundedBase = Math.ceil(baseId / 1000) * 1000;

        // folderNameの生成
        const folderName = `RJ${roundedBase}`;

        // サムネイル画像URLを生成（RJ用）
        return `https://img.dlsite.jp/modpub/images2/work/doujin/${folderName}/${productId}_img_main.jpg`;
    }
};
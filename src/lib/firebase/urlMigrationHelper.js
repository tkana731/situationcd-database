// src/lib/firebase/urlMigrationHelper.js

import {
    collection,
    getDocs,
    doc,
    updateDoc,
    writeBatch,
    query,
    where
} from 'firebase/firestore';

/**
 * レーベンシュタイン距離を計算する関数
 * @param {string} a 文字列1
 * @param {string} b 文字列2
 * @returns {number} 距離
 */
export const levenshteinDistance = (a, b) => {
    const matrix = Array(b.length + 1).fill().map(() => Array(a.length + 1).fill(0));

    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= b.length; j++) {
        for (let i = 1; i <= a.length; i++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[j][i] = Math.min(
                matrix[j][i - 1] + 1, // 挿入
                matrix[j - 1][i] + 1, // 削除
                matrix[j - 1][i - 1] + cost // 置換
            );
        }
    }

    return matrix[b.length][a.length];
};

/**
 * タイトルを正規化する関数
 * @param {string} str 正規化する文字列
 * @param {Object} options 正規化オプション
 * @returns {string} 正規化された文字列
 */
export const normalizeTitle = (str, options = {}) => {
    if (!str) return '';

    const {
        removePatterns = [],
    } = options;

    // 正規化処理を適用
    let normalized = str;

    // 指定された正規表現パターンを削除
    removePatterns.forEach(pattern => {
        normalized = normalized.replace(pattern, '');
    });

    // 共通の正規化処理
    normalized = normalized.toLowerCase()
        .replace(/[「」【】『』（）()［］\[\]]/g, '') // 括弧類を削除
        .replace(/\s+/g, ' ') // 連続する空白を1つに圧縮
        .replace(/(ドラマcd|シチュエーションcd)/gi, '') // ドラマCDやシチュエーションCDという表記を削除
        .trim();

    return normalized;
};

/**
 * 2つの文字列の類似度を計算する関数
 * @param {string} str1 文字列1
 * @param {string} str2 文字列2
 * @param {Object} options 正規化オプション
 * @returns {number} 類似度（0.0〜1.0）
 */
export const calculateSimilarity = (str1, str2, options = {}) => {
    if (!str1 || !str2) return 0;

    const normalizedStr1 = normalizeTitle(str1, options);
    const normalizedStr2 = normalizeTitle(str2, options);

    // 完全一致の場合は1.0を返す
    if (normalizedStr1 === normalizedStr2) return 1.0;

    // レーベンシュタイン距離を計算
    const distance = levenshteinDistance(normalizedStr1, normalizedStr2);
    const maxLength = Math.max(normalizedStr1.length, normalizedStr2.length);

    // 距離を類似度に変換（1.0が完全一致、0.0が完全不一致）
    return maxLength === 0 ? 1.0 : 1.0 - distance / maxLength;
};

/**
 * 製品データをマッチングしてURLを更新する
 * @param {Object} db Firestoreインスタンス
 * @param {Array} csvData CSVデータ
 * @param {Object} config 設定オプション
 * @param {Function} addLog ログ追加関数
 * @returns {Object} 更新統計情報
 */
export const migrateProductUrls = async (db, csvData, config, addLog) => {
    const {
        urlField, // 'pocketdramaUrl' または 'stellaplayerUrl' など
        titleColumn, // CSVのタイトル列名
        urlColumn, // CSVのURL列名
        similarityThreshold, // 類似度のしきい値
        removePatterns, // 正規化時に削除するパターンの配列
        specialPatternDescriptions = [], // パターン説明のテキスト配列
    } = config;

    // 統計情報の初期化
    const stats = {
        total: csvData.length,
        matched: 0,
        updated: 0,
        skipped: 0,
        noMatch: 0,
        alreadySet: 0,
        ambiguous: 0, // 複数の候補がある場合
        specialPatternRemoved: 0 // 特別なパターンを削除した件数
    };

    addLog('マイグレーション処理を開始します...');
    addLog(`類似度しきい値: ${similarityThreshold} (高いほど厳密にマッチング)`);

    // 既に値が設定されている製品のIDを取得
    const filledUrlQuery = query(
        collection(db, 'products'),
        where(urlField, '>', '') // 空文字より大きい = 何か値が入っている
    );
    const filledUrlSnap = await getDocs(filledUrlQuery);
    const filledUrlIds = new Set(filledUrlSnap.docs.map(doc => doc.id));

    addLog(`Firestoreから${urlField}設定済みの製品${filledUrlIds.size}件を確認しました`);
    stats.alreadySet = filledUrlIds.size;

    // すべての製品を取得
    const allProductsQuery = query(collection(db, 'products'));
    const allProductsSnap = await getDocs(allProductsQuery);

    // 値が入っているIDを除外してターゲット製品を取得
    const targetProducts = allProductsSnap.docs
        .filter(doc => !filledUrlIds.has(doc.id))
        .map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

    addLog(`Firestoreから${urlField}未設定の製品${targetProducts.length}件を取得しました`);

    // バッチ処理の準備
    let batch = writeBatch(db);
    let operationCount = 0;
    const MAX_BATCH_SIZE = 500;

    // CSV内の各行を処理
    for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];
        const csvTitle = row[titleColumn];
        const url = row[urlColumn];

        // タイトルまたはURLが空の場合はスキップ
        if (!csvTitle || !url) {
            addLog(`行 ${i + 2}: タイトルまたはURLが空です。スキップします。`);
            stats.skipped++;
            continue;
        }

        // 特別なパターンの検出
        let hasSpecialPattern = false;
        let cleanedTitle = csvTitle;

        // 正規表現パターンをチェック
        for (const pattern of removePatterns) {
            if (pattern.test(cleanedTitle)) {
                cleanedTitle = cleanedTitle.replace(pattern, '');
                hasSpecialPattern = true;
            }
        }

        if (hasSpecialPattern) {
            addLog(`行 ${i + 2}: 特別なパターンを削除: "${csvTitle}" → "${cleanedTitle}"`);
            stats.specialPatternRemoved++;
        }

        // 類似度に基づいてマッチングする製品を検索
        const matchCandidates = targetProducts
            .map(product => ({
                product,
                similarity: calculateSimilarity(product.title, csvTitle, { removePatterns })
            }))
            .filter(candidate => candidate.similarity >= similarityThreshold)
            .sort((a, b) => b.similarity - a.similarity); // 類似度の降順でソート

        if (matchCandidates.length === 0) {
            addLog(`行 ${i + 2}: タイトル "${csvTitle}" に一致する製品が見つかりません。`);
            stats.noMatch++;
            continue;
        }

        if (matchCandidates.length > 1 &&
            matchCandidates[0].similarity === matchCandidates[1].similarity) {
            // 最も類似度が高い複数の候補がある場合（同率一位）
            addLog(`行 ${i + 2}: タイトル "${csvTitle}" に対して複数の候補があります。スキップします。`);
            addLog(`  候補: ${matchCandidates.slice(0, 3).map(c => `"${c.product.title}" (類似度: ${c.similarity.toFixed(3)})`).join(', ')}`);
            stats.ambiguous++;
            continue;
        }

        // 最も類似度が高い製品を選択
        const matchedCandidate = matchCandidates[0];
        const matchedProduct = matchedCandidate.product;

        stats.matched++;

        addLog(`行 ${i + 2}: タイトル "${csvTitle}" がマッチしました。`);
        addLog(`  マッチした製品: "${matchedProduct.title}" (類似度: ${matchedCandidate.similarity.toFixed(3)})`);

        // URLを更新
        const docRef = doc(db, 'products', matchedProduct.id);
        const updateData = {
            [urlField]: url,
            updatedAt: new Date()
        };

        batch.update(docRef, updateData);

        stats.updated++;
        addLog(`行 ${i + 2}: 製品 "${matchedProduct.title}" の${urlField}を更新しました。`);
        addLog(`  新しいURL: ${url}`);

        operationCount++;

        // バッチサイズの上限に達したら一旦コミット
        if (operationCount >= MAX_BATCH_SIZE) {
            addLog(`バッチ処理を実行します (${operationCount}件)...`);
            await batch.commit();
            batch = writeBatch(db);
            operationCount = 0;
        }

        // 進捗ログ
        if ((i + 1) % 10 === 0 || i === csvData.length - 1) {
            addLog(`${i + 1}/${csvData.length} 件処理中...`);
        }
    }

    // 残りのバッチをコミット
    if (operationCount > 0) {
        addLog(`残りのバッチ処理を実行します (${operationCount}件)...`);
        await batch.commit();
    }

    const completeMessage = `マイグレーション完了: 
        処理済み ${stats.total}件、
        マッチング ${stats.matched}件、 
        更新 ${stats.updated}件、
        特別パターン削除 ${stats.specialPatternRemoved}件、
        スキップ ${stats.skipped}件、
        一致なし ${stats.noMatch}件、
        既設定 ${stats.alreadySet}件、
        曖昧な一致 ${stats.ambiguous}件`;
    addLog(completeMessage);

    return stats;
};
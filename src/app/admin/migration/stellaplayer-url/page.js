// src/app/admin/migration/stellaplayer-url/page.js

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { db } from '../../../../lib/firebase/config';
import {
    collection,
    getDocs,
    doc,
    updateDoc,
    writeBatch,
    query,
    where
} from 'firebase/firestore';
import { readFileAsText, parseCSV } from '../../../../app/components/admin/import/csvHelpers';

export default function StellaplayerUrlMigrationPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [logMessages, setLogMessages] = useState([]);
    const [stats, setStats] = useState(null);
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState({ header: [], data: [] });
    const [similarityThreshold, setSimilarityThreshold] = useState(0.7); // 類似度のしきい値（0.0～1.0）

    // ログメッセージを追加
    const addLog = (message) => {
        setLogMessages(prev => [
            ...prev,
            `${new Date().toLocaleTimeString()}: ${message}`
        ]);
    };

    // レーベンシュタイン距離を計算する関数
    const levenshteinDistance = (a, b) => {
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

    // 2つの文字列の類似度を計算する関数（0.0～1.0の値を返す）
    const calculateSimilarity = (str1, str2) => {
        if (!str1 || !str2) return 0;

        // 特殊文字や余分なスペースを削除して正規化
        const normalizeStr = (str) => {
            // ステラプレイヤー特有のパターン削除
            let normalized = str;

            // (CV：XXX)のパターンを削除
            const cvPattern = /\(CV：[^)]*\)/g;
            normalized = normalized.replace(cvPattern, '');

            // 【ステラワース限定版】のパターンを削除
            const stellaworksPattern = /【ステラワース限定版】/g;
            normalized = normalized.replace(stellaworksPattern, '');

            // その他の正規化処理
            normalized = normalized.toLowerCase()
                .replace(/[「」【】『』（）()［］\[\]]/g, '') // 括弧類を削除
                .replace(/\s+/g, ' ') // 連続する空白を1つに圧縮
                .replace(/(ドラマcd|シチュエーションcd)/gi, '') // ドラマCDやシチュエーションCDという表記を削除
                .trim();

            return normalized;
        };

        const normalizedStr1 = normalizeStr(str1);
        const normalizedStr2 = normalizeStr(str2);

        // 正規化前後の文字列に大きな変化があった場合のログ（デバッグ用）
        if (str1 !== normalizedStr1 && str1.length - normalizedStr1.length > 10) {
            // console.log(`大きな変化: "${str1}" => "${normalizedStr1}"`);
        }

        // 完全一致の場合は1.0を返す
        if (normalizedStr1 === normalizedStr2) return 1.0;

        // レーベンシュタイン距離を計算
        const distance = levenshteinDistance(normalizedStr1, normalizedStr2);
        const maxLength = Math.max(normalizedStr1.length, normalizedStr2.length);

        // 距離を類似度に変換（1.0が完全一致、0.0が完全不一致）
        return maxLength === 0 ? 1.0 : 1.0 - distance / maxLength;
    };

    // CSVファイルが選択されたときの処理
    const handleFileChange = async (e) => {
        const selectedFile = e.target.files[0];
        setFile(selectedFile);
        setPreview({ header: [], data: [] });
        setError(null);
        setSuccess(null);

        if (selectedFile) {
            // ファイルの拡張子チェック
            if (!selectedFile.name.endsWith('.csv')) {
                setError('CSVファイルのみアップロードできます');
                return;
            }

            try {
                // ファイルを読み込む
                const content = await readFileAsText(selectedFile);

                // CSVをパース
                const { header, data } = parseCSV(content);

                // タイトル列とURL列が含まれているか確認
                if (!header.includes('c-card__name')) {
                    setError('CSVファイルにタイトル列(c-card__name)が見つかりません。');
                    return;
                }

                if (!header.includes('c-card href')) {
                    setError('CSVファイルにURL列(c-card href)が見つかりません。');
                    return;
                }

                // プレビュー用に最初の5行を設定
                setPreview({
                    header,
                    data: data.slice(0, 5)
                });

                addLog(`CSVファイル "${selectedFile.name}" を読み込みました。${data.length}行のデータがあります。`);
            } catch (err) {
                console.error('Error parsing CSV:', err);
                setError('CSVファイルの解析に失敗しました: ' + err.message);
            }
        }
    };

    // しきい値変更ハンドラ
    const handleThresholdChange = (e) => {
        const value = parseFloat(e.target.value);
        setSimilarityThreshold(value);
    };

    // マイグレーション処理
    const handleMigration = async () => {
        if (!file) {
            setError('CSVファイルを選択してください');
            return;
        }

        if (!confirm(`CSVファイルのタイトルをマッチングして、ステラプレイヤーのURLを更新しますか？\n\n類似度しきい値: ${similarityThreshold} (高いほど厳密にマッチング)`)) {
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);
        setStats(null);
        setLogMessages([]);

        try {
            // ファイルの再読み込みとパース
            const content = await readFileAsText(file);
            const { header, data } = parseCSV(content);

            addLog('マイグレーション処理を開始します...');
            addLog(`類似度しきい値: ${similarityThreshold} (高いほど厳密にマッチング)`);

            // stellaplayerUrlが有効な値（空でも nullでもない）の製品のIDリストを取得
            const filledUrlQuery = query(
                collection(db, 'products'),
                where('stellaplayerUrl', '>', '') // 空文字より大きい = 何か値が入っている
            );
            const filledUrlSnap = await getDocs(filledUrlQuery);
            const filledUrlIds = new Set(filledUrlSnap.docs.map(doc => doc.id));

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

            addLog(`FirestoreからステラプレイヤーURL未設定の製品${targetProducts.length}件を取得しました`);

            // 統計情報の初期化
            const stats = {
                total: data.length,
                matched: 0,
                updated: 0,
                skipped: 0,
                noMatch: 0,
                alreadySet: 0,
                ambiguous: 0, // 複数の候補がある場合
                cvPatternRemoved: 0, // CV：パターンを削除した件数
                stellaworksPatternRemoved: 0 // ステラワース限定版パターンを削除した件数
            };

            // バッチ処理の準備
            let batch = writeBatch(db);
            let operationCount = 0;
            const MAX_BATCH_SIZE = 500;

            // CSV内の各行を処理
            for (let i = 0; i < data.length; i++) {
                const row = data[i];
                const csvTitle = row['c-card__name'];
                const stellaplayerUrl = row['c-card href'];

                // タイトルまたはURLが空の場合はスキップ
                if (!csvTitle || !stellaplayerUrl) {
                    addLog(`行 ${i + 2}: タイトルまたはステラプレイヤーURLが空です。スキップします。`);
                    stats.skipped++;
                    continue;
                }

                // 特別なパターンの検出と削除
                let hasSpecialPattern = false;
                let cleanedTitle = csvTitle;

                // (CV：XXX)パターンの検出と削除
                const cvPattern = /\(CV：[^)]*\)/g;
                if (cvPattern.test(csvTitle)) {
                    cleanedTitle = cleanedTitle.replace(cvPattern, '').trim();
                    hasSpecialPattern = true;
                    stats.cvPatternRemoved++;
                }

                // 【ステラワース限定版】パターンの検出と削除
                const stellaworksPattern = /【ステラワース限定版】/g;
                if (stellaworksPattern.test(cleanedTitle)) {
                    cleanedTitle = cleanedTitle.replace(stellaworksPattern, '').trim();
                    hasSpecialPattern = true;
                    stats.stellaworksPatternRemoved++;
                }

                if (hasSpecialPattern) {
                    addLog(`行 ${i + 2}: 特別なパターンを削除: "${csvTitle}" → "${cleanedTitle}"`);
                }

                // 類似度に基づいてマッチングする製品を検索
                const matchCandidates = targetProducts
                    .map(product => ({
                        product,
                        similarity: calculateSimilarity(product.title, csvTitle)
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

                // ステラプレイヤーURLを更新
                const docRef = doc(db, 'products', matchedProduct.id);
                batch.update(docRef, {
                    stellaplayerUrl: stellaplayerUrl,
                    updatedAt: new Date()
                });

                stats.updated++;
                addLog(`行 ${i + 2}: 製品 "${matchedProduct.title}" のステラプレイヤーURLを更新しました。`);
                addLog(`  新しいURL: ${stellaplayerUrl}`);

                operationCount++;

                // バッチサイズの上限に達したら一旦コミット
                if (operationCount >= MAX_BATCH_SIZE) {
                    addLog(`バッチ処理を実行します (${operationCount}件)...`);
                    await batch.commit();
                    batch = writeBatch(db);
                    operationCount = 0;
                }

                // 進捗ログ
                if ((i + 1) % 10 === 0 || i === data.length - 1) {
                    addLog(`${i + 1}/${data.length} 件処理中...`);
                }
            }

            // 残りのバッチをコミット
            if (operationCount > 0) {
                addLog(`残りのバッチ処理を実行します (${operationCount}件)...`);
                await batch.commit();
            }

            setStats(stats);
            setSuccess(`マイグレーション完了: ${stats.updated}件の製品のステラプレイヤーURLを更新しました`);
            const completeMessage = `マイグレーション完了: 
                処理済み ${stats.total}件、
                マッチング ${stats.matched}件、 
                更新 ${stats.updated}件、
                CV：パターン削除 ${stats.cvPatternRemoved}件、
                ステラワース限定版削除 ${stats.stellaworksPatternRemoved}件、
                スキップ ${stats.skipped}件、
                一致なし ${stats.noMatch}件、
                既設定 ${stats.alreadySet}件、
                曖昧な一致 ${stats.ambiguous}件`;
            addLog(completeMessage);
        } catch (err) {
            console.error('Error during migration:', err);
            setError('マイグレーション中にエラーが発生しました: ' + err.message);
            addLog(`エラー: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">ステラプレイヤーURLマイグレーション</h1>
                <div className="flex space-x-2">
                    <Link
                        href="/admin/products"
                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                    >
                        作品一覧に戻る
                    </Link>
                </div>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                <div className="flex">
                    <div className="ml-3">
                        <p className="text-sm text-blue-700">
                            <strong>注意:</strong> この機能はステラプレイヤーCSVファイルのタイトル列と既存の製品データをマッチングして、ステラプレイヤーのURLを更新します。
                        </p>
                        <p className="text-sm text-blue-700 mt-2">
                            タイトルが完全に一致しない場合でも、文字列の類似度が高い場合にマッチングします。
                        </p>
                        <p className="text-sm text-blue-700 mt-2">
                            <strong>特別処理:</strong> 以下のようなパターンは自動的に削除してマッチングします：
                        </p>
                        <ul className="text-sm text-blue-700 ml-4 list-disc">
                            <li>(CV：XXX) - 声優名を含む括弧</li>
                            <li>【ステラワース限定版】</li>
                        </ul>
                        <p className="text-sm text-blue-700 mt-2">
                            CSVファイルには以下の列が必要です：
                        </p>
                        <ul className="text-sm text-blue-700 ml-4 list-disc">
                            <li>タイトル列 (c-card__name)</li>
                            <li>ステラプレイヤーURL列 (c-card href)</li>
                        </ul>
                        <p className="text-sm text-blue-700 mt-2">
                            処理は自動的に実行され、ステラプレイヤーURL未設定の製品のみマッチング対象になります。
                        </p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                    {success}
                </div>
            )}

            {/* ファイルアップロード部分 */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    CSVファイルを選択
                </label>
                <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100"
                />
            </div>

            {/* 類似度しきい値設定 */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    タイトルの類似度しきい値: {similarityThreshold.toFixed(2)}
                </label>
                <input
                    type="range"
                    min="0.5"
                    max="0.9"
                    step="0.05"
                    value={similarityThreshold}
                    onChange={handleThresholdChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>ゆるく (0.5)</span>
                    <span>バランス (0.7)</span>
                    <span>厳密に (0.9)</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    低い値: より多くのマッチングが見つかりますが、誤マッチの可能性が高くなります。<br />
                    高い値: マッチング数は減りますが、確実な一致のみが選ばれます。
                </p>
            </div>

            {/* プレビュー表示 */}
            {preview.header.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-2">プレビュー (最初の5行)</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full border">
                            <thead className="bg-gray-50">
                                <tr>
                                    {preview.header.map((column, index) => (
                                        <th key={index} className="py-2 px-3 border text-left text-xs font-medium text-gray-500 uppercase">
                                            {column}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {preview.data.map((row, rowIndex) => (
                                    <tr key={rowIndex}>
                                        {preview.header.map((column, colIndex) => (
                                            <td key={colIndex} className="py-2 px-3 border text-sm text-gray-500">
                                                {row[column] || ''}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="flex justify-center mb-8">
                <button
                    onClick={handleMigration}
                    disabled={loading || !file}
                    className={`px-6 py-3 rounded-md font-medium ${loading || !file
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                >
                    {loading ? '処理中...' : 'マイグレーション実行'}
                </button>
            </div>

            {loading && (
                <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                        <div className="bg-blue-600 h-2.5 rounded-full animate-pulse"></div>
                    </div>
                    <p className="text-sm text-center text-gray-600 mt-2">処理中です。しばらくお待ちください...</p>
                </div>
            )}

            {stats && (
                <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                    <h2 className="text-lg font-semibold mb-2">マイグレーション結果</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded shadow">
                            <ul className="list-disc pl-5 text-sm">
                                <li className="mb-1">処理対象: {stats.total}件</li>
                                <li className="mb-1 text-blue-600">マッチング成功: {stats.matched}件</li>
                                <li className="mb-1 text-green-600">更新済み: {stats.updated}件</li>
                                <li className="mb-1 text-purple-600">CV：パターン削除: {stats.cvPatternRemoved}件</li>
                                <li className="mb-1 text-purple-600">ステラワース限定版削除: {stats.stellaworksPatternRemoved}件</li>
                                <li className="mb-1 text-yellow-600">スキップ: {stats.skipped}件</li>
                                <li className="mb-1 text-red-600">一致なし: {stats.noMatch}件</li>
                                <li className="mb-1 text-orange-600">曖昧な一致: {stats.ambiguous}件</li>
                                <li className="mb-1 text-gray-600">既に設定済み: {stats.alreadySet}件</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {logMessages.length > 0 && (
                <div className="mt-6">
                    <h2 className="text-lg font-semibold mb-2">処理ログ</h2>
                    <div className="bg-gray-800 text-gray-200 p-4 rounded-md h-64 overflow-y-auto font-mono text-sm">
                        {logMessages.map((msg, index) => (
                            <div key={index} className="mb-1">{msg}</div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
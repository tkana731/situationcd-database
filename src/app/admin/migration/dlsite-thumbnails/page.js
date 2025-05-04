// src/app/admin/migration/dlsite-thumbnails/page.js

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

export default function DLsiteThumbnailMigrationPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [logMessages, setLogMessages] = useState([]);
    const [stats, setStats] = useState(null);

    // ログメッセージを追加
    const addLog = (message) => {
        setLogMessages(prev => [
            ...prev,
            `${new Date().toLocaleTimeString()}: ${message}`
        ]);
    };

    // DLsiteがるまにURLからサムネイル画像URLを生成
    const generateThumbnailUrl = (dlsiteUrl) => {
        if (!dlsiteUrl) return null;

        // DLsiteがるまにURLからproduct_idを抽出
        const match = dlsiteUrl.match(/product_id\/(BJ\d+)\.html/);
        if (!match) return null;

        const productId = match[1];

        // BJ609911 → 609911、BJ01923873 → 1923873 のように数値に変換
        const baseId = parseInt(productId.substring(2));
        const roundedBase = Math.ceil(baseId / 1000) * 1000;

        // folderNameの生成
        let folderName;
        // product_id が以下のようなパターンかチェック
        if (productId.match(/^BJ0/)) {
            // BJ01852219のパターン：先頭の0を維持して8桁にパディング
            folderName = `BJ${roundedBase.toString().padStart(8, '0')}`;
        } else {
            // BJ609911のパターン：先頭の0を削除
            folderName = `BJ${roundedBase}`;
        }

        // サムネイル画像URLを生成
        return `https://img.dlsite.jp/modpub/images2/work/books/${folderName}/${productId}_img_main.jpg`;
    };

    // マイグレーション処理
    const handleMigration = async () => {
        if (!confirm('DLsiteがるまにURLからサムネイル画像URLを自動生成して更新しますか？')) {
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);
        setStats(null);
        setLogMessages([]);

        try {
            addLog('マイグレーション処理を開始します...');

            // DLsiteURLは持っているがサムネイルURLが空の製品を取得
            const productsQuery = query(
                collection(db, 'products'),
                where('dlsiteUrl', '!=', '')
            );

            const querySnapshot = await getDocs(productsQuery);

            addLog(`DLsiteURLを持つ製品: ${querySnapshot.size}件`);

            // サムネイルURLが空の製品をフィルタリング
            const productsToUpdate = [];
            querySnapshot.forEach(docSnap => {
                const data = docSnap.data();
                // thumbnailUrlが空文字列、null、未定義の場合に対象とする
                //if (!data.thumbnailUrl || data.thumbnailUrl === '') {
                productsToUpdate.push({
                    id: docSnap.id,
                    data: data
                });
                //}
            });

            const stats = {
                total: productsToUpdate.length,
                processed: 0,
                updated: 0,
                skipped: 0,
                failed: 0
            };

            addLog(`処理対象: ${stats.total}件の製品`);

            // バッチ処理の準備
            let batch = writeBatch(db);
            let operationCount = 0;
            const MAX_BATCH_SIZE = 500;

            for (const item of productsToUpdate) {
                try {
                    const productData = item.data;
                    const dlsiteUrl = productData.dlsiteUrl;

                    // サムネイルURLを生成
                    const thumbnailUrl = generateThumbnailUrl(dlsiteUrl);

                    if (thumbnailUrl) {
                        // Firestoreを更新
                        const docRef = doc(db, 'products', item.id);
                        batch.update(docRef, {
                            thumbnailUrl: thumbnailUrl,
                            updatedAt: new Date()
                        });

                        stats.updated++;
                        addLog(`更新: ${productData.title}`);
                        addLog(`  DLsiteURL: ${dlsiteUrl}`);
                        addLog(`  サムネイルURL: ${thumbnailUrl}`);
                    } else {
                        stats.skipped++;
                        addLog(`スキップ: ${productData.title} - DLsiteURLからproduct_idを抽出できませんでした`);
                    }

                    stats.processed++;
                    operationCount++;

                    // バッチサイズの上限に達したら一旦コミット
                    if (operationCount >= MAX_BATCH_SIZE) {
                        addLog(`バッチ処理を実行します (${operationCount}件)...`);
                        await batch.commit();
                        batch = writeBatch(db);
                        operationCount = 0;
                    }

                    // 進捗ログ
                    if (stats.processed % 10 === 0 || stats.processed === stats.total) {
                        addLog(`${stats.processed}/${stats.total} 件処理中...`);
                    }
                } catch (err) {
                    console.error(`Error processing product ${item.id}:`, err);
                    addLog(`エラー: 製品 ${item.id} の処理中にエラーが発生しました: ${err.message}`);
                    stats.failed++;
                }
            }

            // 残りのバッチをコミット
            if (operationCount > 0) {
                addLog(`残りのバッチ処理を実行します (${operationCount}件)...`);
                await batch.commit();
            }

            setStats(stats);
            setSuccess(`マイグレーション完了: ${stats.updated}件の製品を更新しました`);
            addLog(`マイグレーション完了: 処理済み ${stats.processed}件、更新 ${stats.updated}件、スキップ ${stats.skipped}件、失敗 ${stats.failed}件`);
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
                <h1 className="text-2xl font-bold">DLsiteサムネイルURLマイグレーション</h1>
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
                            <strong>注意:</strong> この機能は、DLsiteがるまにURLを持っているがサムネイル画像URLが未入力の製品に対して、サムネイル画像URLを自動生成して設定します。
                        </p>
                        <p className="text-sm text-blue-700 mt-2">
                            処理は自動的に実行され、生成されたURLは直接Firestoreに保存されます。
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

            <div className="flex justify-center mb-8">
                <button
                    onClick={handleMigration}
                    disabled={loading}
                    className={`px-6 py-3 rounded-md font-medium ${loading
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
                                <li className="mb-1">処理済み: {stats.processed}件</li>
                                <li className="mb-1 text-green-600">更新済み: {stats.updated}件</li>
                                <li className="mb-1 text-yellow-600">スキップ: {stats.skipped}件</li>
                                <li className="mb-1 text-red-600">失敗: {stats.failed}件</li>
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
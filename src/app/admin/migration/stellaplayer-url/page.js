// src/app/admin/migration/stellaplayer-url/page.js

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { db } from '../../../../lib/firebase/config';
import { readFileAsText, parseCSV } from '../../../../app/components/admin/import/csvHelpers';
import { migrateProductUrls } from '../../../../lib/firebase/urlMigrationHelper';

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

            // ステラプレイヤーURL更新用の設定
            const config = {
                urlField: 'stellaplayerUrl',
                titleColumn: 'c-card__name',
                urlColumn: 'c-card href',
                similarityThreshold,
                removePatterns: [
                    /\(CV：[^)]*\)/g,
                    /【ステラワース限定版】/g
                ],
                specialPatternDescriptions: [
                    '(CV：XXX)',
                    '【ステラワース限定版】'
                ]
            };

            // 共通のマイグレーション処理を実行
            const result = await migrateProductUrls(db, data, config, addLog);

            setStats(result);
            setSuccess(`マイグレーション完了: ${result.updated}件の製品のステラプレイヤーURLを更新しました`);
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
                                <li className="mb-1 text-purple-600">特別パターン削除: {stats.specialPatternRemoved}件</li>
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
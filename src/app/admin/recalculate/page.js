'use client';

import { useState } from 'react';
import Link from 'next/link';
import { db } from '../../../lib/firebase/config';
import {
    collection,
    getDocs,
    doc,
    setDoc,
    updateDoc,
    deleteDoc,
    writeBatch,
    serverTimestamp,
    query
} from 'firebase/firestore';
import { safeDocumentId } from '../../../lib/firebase/helpers';

export default function RecalculatePage() {
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

    // 再集計処理
    const handleRecalculate = async () => {
        if (!confirm('タグと声優の出現数を再集計します。この処理には時間がかかる場合があります。続行しますか？')) {
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);
        setStats(null);
        setLogMessages([]);

        try {
            addLog('再集計処理を開始します...');
            const results = await recalculateAllData();
            setStats(results);
            setSuccess('タグと声優の再集計が完了しました');
            addLog(`再集計完了`);
        } catch (err) {
            console.error('Error recalculating data:', err);
            setError('再集計中にエラーが発生しました: ' + err.message);
            addLog(`エラー: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // タグと声優の再集計
    const recalculateAllData = async () => {
        const stats = {
            products: 0,
            tags: {
                total: 0,
                created: 0,
                updated: 0,
                deleted: 0,
                items: new Map()
            },
            actors: {
                total: 0,
                created: 0,
                updated: 0,
                deleted: 0,
                items: new Map()
            }
        };

        // 全製品データの取得
        addLog('全製品データを取得中...');
        const productsQuery = query(collection(db, 'products'));
        const productsSnapshot = await getDocs(productsQuery);
        stats.products = productsSnapshot.size;
        addLog(`${stats.products}件の製品データを読み込みました`);

        // タグと声優の出現数を集計
        addLog('タグと声優の出現数を集計中...');
        productsSnapshot.forEach(productDoc => {
            const productData = productDoc.data();

            // タグの集計
            if (productData.tags && Array.isArray(productData.tags)) {
                productData.tags.forEach(tag => {
                    if (!tag) return;
                    const count = stats.tags.items.get(tag) || 0;
                    stats.tags.items.set(tag, count + 1);
                });
            }

            // 声優の集計
            if (productData.cast && Array.isArray(productData.cast)) {
                productData.cast.forEach(actor => {
                    if (!actor) return;
                    const count = stats.actors.items.get(actor) || 0;
                    stats.actors.items.set(actor, count + 1);
                });
            }
        });

        stats.tags.total = stats.tags.items.size;
        stats.actors.total = stats.actors.items.size;
        addLog(`${stats.tags.total}種類のタグと${stats.actors.total}人の声優を集計しました`);

        // 既存のタグデータを取得
        addLog('既存のタグデータを取得中...');
        const tagsSnapshot = await getDocs(collection(db, 'tags'));
        const existingTags = new Map();
        tagsSnapshot.forEach(doc => {
            const data = doc.data();
            existingTags.set(doc.id, {
                id: doc.id,
                name: data.name,
                count: data.count || 0
            });
        });
        addLog(`${existingTags.size}件の既存タグを読み込みました`);

        // 既存の声優データを取得
        addLog('既存の声優データを取得中...');
        const actorsSnapshot = await getDocs(collection(db, 'actors'));
        const existingActors = new Map();
        actorsSnapshot.forEach(doc => {
            const data = doc.data();
            existingActors.set(doc.id, {
                id: doc.id,
                name: data.name,
                count: data.count || 0
            });
        });
        addLog(`${existingActors.size}件の既存声優を読み込みました`);

        // タグデータを更新
        addLog('タグデータを更新中...');
        const tagBatch = writeBatch(db);
        let tagOperationCount = 0;
        const MAX_BATCH_SIZE = 500;

        // 新しいタグIDのセット（既存と新規の両方を含む）
        const allTagIds = new Set();

        // 更新または作成が必要なタグを処理
        for (const [tagName, count] of stats.tags.items.entries()) {
            const safeTagId = safeDocumentId(tagName);
            allTagIds.add(safeTagId);
            const tagRef = doc(db, 'tags', safeTagId);

            if (existingTags.has(safeTagId)) {
                // 既存のタグを更新
                const existingCount = existingTags.get(safeTagId).count || 0;
                if (existingCount !== count) {
                    tagBatch.update(tagRef, {
                        count: count,
                        updatedAt: serverTimestamp()
                    });
                    stats.tags.updated++;
                }
            } else {
                // 新しいタグを作成
                tagBatch.set(tagRef, {
                    name: tagName,
                    count: count,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
                stats.tags.created++;
            }

            tagOperationCount++;

            // バッチサイズの上限に達したら一旦コミット
            if (tagOperationCount >= MAX_BATCH_SIZE) {
                await tagBatch.commit();
                tagOperationCount = 0;
            }
        }

        // 利用されていないタグを削除
        for (const [tagId, tagData] of existingTags.entries()) {
            if (!allTagIds.has(tagId)) {
                const tagRef = doc(db, 'tags', tagId);
                tagBatch.delete(tagRef);
                stats.tags.deleted++;

                tagOperationCount++;

                // バッチサイズの上限に達したら一旦コミット
                if (tagOperationCount >= MAX_BATCH_SIZE) {
                    await tagBatch.commit();
                    tagOperationCount = 0;
                }
            }
        }

        // 残りのタグバッチをコミット
        if (tagOperationCount > 0) {
            await tagBatch.commit();
        }

        addLog(`タグデータの更新完了: ${stats.tags.created}件作成、${stats.tags.updated}件更新、${stats.tags.deleted}件削除`);

        // 声優データを更新
        addLog('声優データを更新中...');
        const actorBatch = writeBatch(db);
        let actorOperationCount = 0;

        // 新しい声優IDのセット（既存と新規の両方を含む）
        const allActorIds = new Set();

        // 更新または作成が必要な声優を処理
        for (const [actorName, count] of stats.actors.items.entries()) {
            const safeActorId = safeDocumentId(actorName);
            allActorIds.add(safeActorId);
            const actorRef = doc(db, 'actors', safeActorId);

            if (existingActors.has(safeActorId)) {
                // 既存の声優を更新
                const existingCount = existingActors.get(safeActorId).count || 0;
                if (existingCount !== count) {
                    actorBatch.update(actorRef, {
                        count: count,
                        updatedAt: serverTimestamp()
                    });
                    stats.actors.updated++;
                }
            } else {
                // 新しい声優を作成
                actorBatch.set(actorRef, {
                    name: actorName,
                    count: count,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
                stats.actors.created++;
            }

            actorOperationCount++;

            // バッチサイズの上限に達したら一旦コミット
            if (actorOperationCount >= MAX_BATCH_SIZE) {
                await actorBatch.commit();
                actorOperationCount = 0;
            }
        }

        // 利用されていない声優を削除
        for (const [actorId, actorData] of existingActors.entries()) {
            if (!allActorIds.has(actorId)) {
                const actorRef = doc(db, 'actors', actorId);
                actorBatch.delete(actorRef);
                stats.actors.deleted++;

                actorOperationCount++;

                // バッチサイズの上限に達したら一旦コミット
                if (actorOperationCount >= MAX_BATCH_SIZE) {
                    await actorBatch.commit();
                    actorOperationCount = 0;
                }
            }
        }

        // 残りの声優バッチをコミット
        if (actorOperationCount > 0) {
            await actorBatch.commit();
        }

        addLog(`声優データの更新完了: ${stats.actors.created}件作成、${stats.actors.updated}件更新、${stats.actors.deleted}件削除`);

        return stats;
    };

    return (
        <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">タグ・声優の再集計</h1>
                <div className="flex space-x-2">
                    <Link
                        href="/admin/products"
                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                    >
                        作品一覧に戻る
                    </Link>
                </div>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                <div className="flex">
                    <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                            <strong>注意:</strong> この機能は全作品データをスキャンし、タグと声優の出現数を再集計します。
                            処理には時間がかかる場合があります。実行中はページを閉じないでください。
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
                    onClick={handleRecalculate}
                    disabled={loading}
                    className={`px-6 py-3 rounded-md font-medium ${loading
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                >
                    {loading ? '処理中...' : 'タグと声優の出現数を再集計'}
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
                    <h2 className="text-lg font-semibold mb-2">集計結果</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded shadow">
                            <h3 className="text-md font-semibold mb-2">タグデータ</h3>
                            <ul className="list-disc pl-5 text-sm">
                                <li className="mb-1">合計タグ種類: {stats.tags.total}</li>
                                <li className="mb-1 text-green-600">新規作成: {stats.tags.created}件</li>
                                <li className="mb-1 text-blue-600">更新: {stats.tags.updated}件</li>
                                <li className="mb-1 text-red-600">削除: {stats.tags.deleted}件</li>
                            </ul>
                        </div>
                        <div className="bg-white p-4 rounded shadow">
                            <h3 className="text-md font-semibold mb-2">声優データ</h3>
                            <ul className="list-disc pl-5 text-sm">
                                <li className="mb-1">合計声優数: {stats.actors.total}</li>
                                <li className="mb-1 text-green-600">新規作成: {stats.actors.created}件</li>
                                <li className="mb-1 text-blue-600">更新: {stats.actors.updated}件</li>
                                <li className="mb-1 text-red-600">削除: {stats.actors.deleted}件</li>
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
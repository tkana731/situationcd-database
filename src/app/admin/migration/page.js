// /src/app/admin/migration/page.js

'use client';

import { useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, query, limit } from 'firebase/firestore';

// Firebaseの設定
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Firebase初期化
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function MigrationPage() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [progress, setProgress] = useState(0);
    const [total, setTotal] = useState(0);
    const [logMessages, setLogMessages] = useState([]);

    // 日付文字列をYYYY-MM-DD形式に変換する関数
    const formatDateToYYYYMMDD = (dateStr) => {
        if (!dateStr) return '';

        // すでにYYYY-MM-DD形式の場合はそのまま返す
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            return dateStr;
        }

        // YYYY/MM/DD形式を変換
        if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(dateStr)) {
            const parts = dateStr.split('/');
            return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        }

        // その他の形式は適切に処理
        try {
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
                return date.toISOString().split('T')[0];
            }
        } catch (e) {
            // パースエラー - 空文字を返す
        }

        return '';
    };

    // ログメッセージを追加
    const addLog = (message) => {
        setLogMessages(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    };

    // マイグレーション実行
    const runMigration = async () => {
        if (loading) return;

        try {
            setLoading(true);
            setError(null);
            setResult(null);
            setProgress(0);
            setLogMessages([]);

            // 全作品を取得
            addLog('全作品の取得を開始...');
            const productsQuery = query(collection(db, 'products'));
            const querySnapshot = await getDocs(productsQuery);

            const products = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setTotal(products.length);
            addLog(`${products.length}件の作品を取得しました`);

            // 変換が必要な作品をカウント
            const needsMigration = products.filter(product => {
                if (!product.releaseDate) return false;

                // すでにYYYY-MM-DD形式かチェック
                if (typeof product.releaseDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(product.releaseDate)) {
                    return false;
                }

                return true;
            });

            addLog(`${needsMigration.length}件の作品が変換対象です`);

            // 変換処理
            let successCount = 0;
            let errorCount = 0;

            for (let i = 0; i < products.length; i++) {
                const product = products[i];
                setProgress(i + 1);

                if (!product.releaseDate ||
                    (typeof product.releaseDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(product.releaseDate))) {
                    // 変換不要
                    continue;
                }

                try {
                    const formattedDate = formatDateToYYYYMMDD(product.releaseDate);

                    if (formattedDate) {
                        // Firestoreを更新
                        const docRef = doc(db, 'products', product.id);
                        await updateDoc(docRef, {
                            releaseDate: formattedDate
                        });
                        successCount++;
                        addLog(`ID: ${product.id} - "${product.releaseDate}" → "${formattedDate}" に変換`);
                    } else {
                        errorCount++;
                        addLog(`ID: ${product.id} - "${product.releaseDate}" の変換に失敗しました`);
                    }
                } catch (e) {
                    errorCount++;
                    addLog(`ID: ${product.id} - 更新中にエラーが発生しました: ${e.message}`);
                }
            }

            // 結果表示
            setResult({
                total: products.length,
                converted: successCount,
                failed: errorCount,
                skipped: products.length - successCount - errorCount
            });

            addLog('マイグレーション完了');

        } catch (e) {
            setError(e.message);
            addLog(`エラーが発生しました: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white shadow rounded-lg p-6">
            <h1 className="text-2xl font-bold mb-6">リリース日フォーマット マイグレーション</h1>
            <p className="mb-6 text-gray-700">
                このツールは製品の<code className="bg-gray-100 px-1">releaseDate</code>フィールドをYYYY-MM-DD形式に変換します。
                マイグレーション実行後は発売日でのソートが正しく機能するようになります。
            </p>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                            <strong>注意:</strong> マイグレーションを実行する前にデータのバックアップを取ることをお勧めします。
                        </p>
                    </div>
                </div>
            </div>

            <div className="mb-6">
                <button
                    onClick={runMigration}
                    disabled={loading}
                    className={`px-4 py-2 rounded-md ${loading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-500 hover:bg-blue-600'} text-white font-medium`}
                >
                    {loading ? 'マイグレーション実行中...' : 'マイグレーションを実行'}
                </button>
            </div>

            {loading && (
                <div className="mb-6">
                    <p className="text-sm text-gray-600 mb-2">処理中: {progress} / {total}</p>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${total > 0 ? (progress / total) * 100 : 0}%` }}></div>
                    </div>
                </div>
            )}

            {result && (
                <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
                    <h2 className="text-lg font-semibold text-green-800 mb-2">マイグレーション結果</h2>
                    <ul className="list-disc pl-5 text-green-700">
                        <li>総製品数: {result.total}件</li>
                        <li>変換成功: {result.converted}件</li>
                        <li>変換失敗: {result.failed}件</li>
                        <li>変換不要: {result.skipped}件</li>
                    </ul>
                </div>
            )}

            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                    <h2 className="text-lg font-semibold text-red-800 mb-2">エラーが発生しました</h2>
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            {logMessages.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-2">ログ</h2>
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
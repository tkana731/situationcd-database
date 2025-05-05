// src/app/admin/products/import/page.js

'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { db } from '../../../../lib/firebase/config';

// 新しく作成したコンポーネントをインポート
import CSVFileUploader from '../../../../app/components/admin/import/CSVFileUploader';
import CSVPreviewTable from '../../../../app/components/admin/import/CSVPreviewTable';
import FieldMapping from '../../../../app/components/admin/import/FieldMapping';
import ImportResultSummary from '../../../../app/components/admin/import/ImportResultSummary';
import LogViewer from '../../../../app/components/admin/import/LogViewer';

// ヘルパー関数をインポート
import { readFileAsText, parseCSV, downloadSampleCSV } from '../../../../app/components/admin/import/csvHelpers';
import { importToFirestore } from '../../../../app/components/admin/import/importToFirestore';

// リクエストアイドル状態を確認する関数
const requestIdleCallback =
    typeof window !== 'undefined'
        ? window.requestIdleCallback ||
        ((cb) => {
            const start = Date.now();
            return setTimeout(() => {
                cb({
                    didTimeout: false,
                    timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
                });
            }, 1);
        })
        : null;

export default function ImportProductsPage() {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [preview, setPreview] = useState({ header: [], data: [] });
    const [importStats, setImportStats] = useState(null);
    const [logMessages, setLogMessages] = useState([]);
    const [mappings, setMappings] = useState({});
    const [selectedPreset, setSelectedPreset] = useState('custom');
    const [mounted, setMounted] = useState(false);
    const [actorFilterEnabled, setActorFilterEnabled] = useState(false); // 声優フィルタのオン/オフ状態
    const fileInputRef = useRef(null);
    const router = useRouter();

    // マッピングプリセット
    const mappingPresets = {
        custom: {
            name: 'カスタム',
            mappings: {}
        },
        dlsite: {
            name: 'DLsite形式',
            mappings: {
                'work_name': 'title',
                'maker_name': 'maker',
                'author': 'cast',
                'author (2)': 'cast',
                'author (3)': 'cast',
                'author (4)': 'cast',
                'author (5)': 'cast',
                'author (6)': 'cast',
                'author (7)': 'cast',
                'author (8)': 'cast',
                'author (9)': 'cast',
                'author (10)': 'cast',
                'author (11)': 'cast',
                'author (12)': 'cast',
                'author (13)': 'cast',
                'author (14)': 'cast',
                'author (15)': 'cast',
                'search_tag': 'tags',
                'search_tag (2)': 'tags',
                'search_tag (3)': 'tags',
                'search_tag (4)': 'tags',
                'search_tag (5)': 'tags',
                'search_tag (6)': 'tags',
                'search_tag (7)': 'tags',
                'search_tag (8)': 'tags',
                'search_tag (9)': 'tags',
                'search_tag (10)': 'tags',
                'search_tag (11)': 'tags',
                'search_tag (12)': 'tags',
                'search_tag (13)': 'tags',
                'search_tag (14)': 'tags',
                'search_tag (15)': 'tags',
                'search_tag (16)': 'tags',
                'search_tag (17)': 'tags',
                'sales_date': 'releaseDate',
                'work_thumb_inner href': 'dlsiteUrl'
            }
        },
        standard: {
            name: '標準CSV形式',
            mappings: {
                'title': 'title',
                'series': 'series',
                'releaseDate': 'releaseDate',
                'maker': 'maker',
                'cast': 'cast',
                'tags': 'tags',
                'thumbnailUrl': 'thumbnailUrl',
                'dlsiteUrl': 'dlsiteUrl',
                'pocketdramaUrl': 'pocketdramaUrl',
                'stellaplayerUrl': 'stellaplayerUrl'
            }
        }
    };

    // Firestoreのフィールド定義
    const firestoreFields = [
        { id: 'title', name: 'タイトル', required: true },
        { id: 'series', name: 'シリーズ名', required: false },
        { id: 'releaseDate', name: '発売日', required: false },
        { id: 'maker', name: '制作会社', required: false },
        { id: 'cast', name: '声優', required: false, isArray: true },
        { id: 'tags', name: 'タグ', required: false, isArray: true },
        { id: 'thumbnailUrl', name: 'サムネイルURL', required: false },
        { id: 'dlsiteUrl', name: 'DLsiteがるまにURL', required: false },
        { id: 'pocketdramaUrl', name: 'ポケットドラマCDのURL', required: false },
        { id: 'stellaplayerUrl', name: 'ステラプレイヤーURL', required: false }
    ];

    // コンポーネントのマウント状態を確認
    useEffect(() => {
        // クライアントサイドでのみ実行するように
        if (typeof window !== 'undefined') {
            // マウント直後ではなく、アイドル時に状態を更新
            if (requestIdleCallback) {
                requestIdleCallback(() => {
                    setMounted(true);
                });
            } else {
                // requestIdleCallbackが使えない場合は少し遅延させる
                setTimeout(() => {
                    setMounted(true);
                }, 100);
            }
        }
    }, []);

    // プリセット選択時の処理
    useEffect(() => {
        if (!mounted) return;

        if (selectedPreset && mappingPresets[selectedPreset]) {
            setMappings(mappingPresets[selectedPreset].mappings);
        }
    }, [selectedPreset, mounted]);

    // CSVファイルが選択されたときの処理
    const handleFileChange = async (e) => {
        if (!mounted) return;

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

                // プレビュー用に最初の5行を設定
                setPreview({
                    header,
                    data: data.slice(0, 5)
                });

                addLog(`CSVファイル "${selectedFile.name}" を読み込みました。${data.length}行のデータがあります。`);

                // DLsiteのCSVか標準CSVかを自動判定
                if (header.includes('work_name') && header.includes('maker_name')) {
                    setSelectedPreset('dlsite');
                    addLog('DLsite形式のCSVと判定しました。マッピングを自動設定します。');
                } else if (header.includes('title') && header.includes('series')) {
                    setSelectedPreset('standard');
                    addLog('標準形式のCSVと判定しました。マッピングを自動設定します。');
                } else {
                    setSelectedPreset('custom');
                    // 空のマッピングを作成
                    const emptyMappings = {};
                    header.forEach(column => {
                        emptyMappings[column] = '';
                    });
                    setMappings(emptyMappings);
                    addLog('不明な形式のCSVです。マッピングを手動で設定してください。');
                }
            } catch (err) {
                console.error('Error parsing CSV:', err);
                setError('CSVファイルの解析に失敗しました: ' + err.message);
            }
        }
    };

    // マッピング変更処理
    const handleMappingChange = (csvColumn, firestoreField) => {
        if (!mounted) return;

        setMappings(prev => ({
            ...prev,
            [csvColumn]: firestoreField
        }));
    };

    // ログメッセージを追加
    const addLog = (message) => {
        if (!mounted) return;

        const timestamp = new Date().toLocaleTimeString();
        setLogMessages(prev => [
            ...prev,
            `${timestamp}: ${message}`
        ]);
    };

    // インポート実行
    const handleImport = async () => {
        if (!mounted) return;
        if (!file) {
            setError('CSVファイルを選択してください');
            return;
        }

        // 必須フィールドのマッピングチェック
        const requiredFields = firestoreFields.filter(field => field.required);
        const missingRequiredFields = requiredFields.filter(field =>
            !Object.values(mappings).includes(field.id)
        );

        if (missingRequiredFields.length > 0) {
            setError(`必須フィールド「${missingRequiredFields.map(f => f.name).join('、')}」のマッピングがありません。`);
            return;
        }

        setUploading(true);
        setError(null);
        setSuccess(null);
        setImportStats(null);

        try {
            // ファイルを読み込む
            const content = await readFileAsText(file);

            // CSVをパース
            const { header, data } = parseCSV(content);

            addLog(`インポート処理を開始します。合計 ${data.length} 件のデータを処理します...`);

            // 声優フィルタの状態をログに記録
            if (actorFilterEnabled) {
                addLog('声優フィルタが有効になっています。設定で指定された声優のみがインポートされます。');
            } else {
                addLog('声優フィルタは無効です。すべての作品がインポートされます。');
            }

            // Firestoreにデータをインポート
            const stats = await importToFirestore(db, data, header, mappings, firestoreFields, addLog, actorFilterEnabled);

            setImportStats(stats);
            setSuccess(`${stats.success}件のデータを正常にインポートしました`);
            addLog(`インポート完了。成功: ${stats.success}件、失敗: ${stats.failed}件、スキップ: ${stats.skipped}件`);

            // ファイル選択をリセット
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            setFile(null);
            setPreview({ header: [], data: [] });
        } catch (err) {
            console.error('Error importing data:', err);
            setError('インポート処理中にエラーが発生しました: ' + err.message);
            addLog(`エラー: ${err.message}`);
        } finally {
            setUploading(false);
        }
    };

    // サーバーサイドレンダリング用の初期表示
    if (!mounted) {
        return (
            <div className="bg-white shadow rounded-lg p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">CSVインポート</h1>
                    <div className="flex space-x-2">
                        <Link
                            href="/admin/products"
                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                        >
                            作品一覧に戻る
                        </Link>
                    </div>
                </div>
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">読み込み中...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">CSVインポート</h1>
                <div className="flex space-x-2">
                    <Link
                        href="/admin/products"
                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                    >
                        作品一覧に戻る
                    </Link>
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

            {/* ファイルアップローダーコンポーネント */}
            <CSVFileUploader
                handleFileChange={handleFileChange}
                file={file}
                downloadSampleCSV={downloadSampleCSV}
            />

            {/* プレビューテーブルコンポーネント */}
            <CSVPreviewTable
                header={preview.header}
                data={preview.data}
            />

            {/* フィールドマッピングコンポーネント */}
            {preview.header.length > 0 && (
                <FieldMapping
                    header={preview.header}
                    mappings={mappings}
                    selectedPreset={selectedPreset}
                    setSelectedPreset={setSelectedPreset}
                    mappingPresets={mappingPresets}
                    handleMappingChange={handleMappingChange}
                    firestoreFields={firestoreFields}
                />
            )}

            {/* 声優フィルタオプション */}
            <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="actorFilter"
                        checked={actorFilterEnabled}
                        onChange={(e) => setActorFilterEnabled(e.target.checked)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <label htmlFor="actorFilter" className="ml-2 text-sm font-medium text-gray-700">
                        声優フィルタを有効にする（設定で指定した声優のみをインポート）
                    </label>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                    有効にすると、設定ファイルで指定された声優のみが登録されます。無効の場合、すべての作品が登録されます。
                </p>
            </div>

            <div className="flex justify-center">
                <button
                    onClick={handleImport}
                    disabled={!file || uploading || preview.header.length === 0}
                    className={`px-6 py-3 rounded-md font-medium ${!file || uploading || preview.header.length === 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                >
                    {uploading ? 'インポート中...' : 'インポート実行'}
                </button>
            </div>

            {uploading && (
                <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                        <div className="bg-blue-600 h-2.5 rounded-full animate-pulse"></div>
                    </div>
                    <p className="text-sm text-center text-gray-600 mt-2">処理中です。しばらくお待ちください...</p>
                </div>
            )}

            {/* インポート結果の表示コンポーネント */}
            <ImportResultSummary importStats={importStats} />

            {/* ログ表示コンポーネント */}
            <LogViewer logMessages={logMessages} />
        </div>
    );
}
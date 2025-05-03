// /src/app/admin/products/import/page.js

'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { db } from '../../../../lib/firebase/config';
import { collection, addDoc, serverTimestamp, writeBatch, doc, getDocs, query } from 'firebase/firestore';
import { safeDocumentId } from '../../../../lib/firebase/helpers';

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

    // ファイル読み込み関数
    const readFileAsText = (file) => {
        return new Promise((resolve, reject) => {
            if (!mounted) {
                reject(new Error('コンポーネントがマウントされていません'));
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('ファイルの読み込みに失敗しました'));
            reader.readAsText(file, 'utf-8');
        });
    };

    // CSVパース関数
    const parseCSV = (content) => {
        // 改行で分割
        const lines = content.split(/\r\n|\n|\r/);
        // 空行を削除
        const nonEmptyLines = lines.filter(line => line.trim().length > 0);

        if (nonEmptyLines.length < 2) {
            throw new Error('CSVファイルにデータがありません');
        }

        // ヘッダー行をカンマで分割
        const header = nonEmptyLines[0].split(',').map(item => item.trim());

        // データ行をパース
        const data = [];
        for (let i = 1; i < nonEmptyLines.length; i++) {
            const line = nonEmptyLines[i];
            const values = parseCSVLine(line);

            if (values.length === header.length) {
                const row = {};
                header.forEach((key, index) => {
                    row[key] = values[index];
                });
                data.push(row);
            }
        }

        return { header, data };
    };

    // CSVの1行をパース（引用符内のカンマを考慮）
    const parseCSVLine = (line) => {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }

        // 最後のフィールドを追加
        result.push(current.trim());

        return result;
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

            // Firebase Firestoreにデータをインポート
            const stats = await importToFirestore(data, header);

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

    // 日付文字列を正規化する関数
    const normalizeDateString = (dateStr) => {
        if (!dateStr) return '';

        // DLsiteの日付形式（YYYY年MM月DD日）を変換
        const dlsitePattern = /(\d{4})年(\d{1,2})月(\d{1,2})日/;
        if (dlsitePattern.test(dateStr)) {
            const match = dateStr.match(dlsitePattern);
            return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
        }

        // YYYY/MM/DD 形式を変換
        const slashPattern = /(\d{4})\/(\d{1,2})\/(\d{1,2})/;
        if (slashPattern.test(dateStr)) {
            const match = dateStr.match(slashPattern);
            return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
        }

        // すでにYYYY-MM-DD形式の場合はそのまま返す
        const dashPattern = /^\d{4}-\d{2}-\d{2}$/;
        if (dashPattern.test(dateStr)) {
            return dateStr;
        }

        return dateStr;
    };

    // URL文字列を正規化する関数
    const normalizeUrl = (urlStr, type) => {
        if (!urlStr) return '';

        // DLsiteのURLを正規化
        if (type === 'dlsiteUrl' && urlStr.includes('/work/')) {
            // 相対パスの場合
            if (urlStr.startsWith('/')) {
                return `https://www.dlsite.com${urlStr}`;
            }
            return urlStr;
        }

        // 画像URLの正規化
        if (type === 'thumbnailUrl') {
            // 画像のURLが相対パスの場合
            if (urlStr.startsWith('/')) {
                return `https://img.dlsite.jp${urlStr}`;
            } else if (urlStr.startsWith('//')) {
                return `https:${urlStr}`;
            }
        }

        return urlStr;
    };

    // importToFirestore 関数内で、既存のデータをチェックする処理を追加
    const importToFirestore = async (data, header) => {
        const stats = {
            total: data.length,
            success: 0,
            failed: 0,
            skipped: 0,
            duplicates: 0, // 重複スキップのカウント用
            tagsCounted: new Map(),
            actorsCounted: new Map(),
            skippedItems: [] // スキップされたアイテムのリスト
        };

        // バッチ処理の準備
        let batch = writeBatch(db);
        let operationCount = 0;
        const MAX_BATCH_SIZE = 500; // Firestoreの上限は500

        // 事前に既存のタイトル一覧を取得
        addLog('既存のタイトルをチェック中...');
        const existingTitlesSnapshot = await getDocs(collection(db, 'products'));
        const existingTitles = new Set();
        existingTitlesSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.title) {
                existingTitles.add(data.title.trim().toLowerCase());
            }
        });
        addLog(`${existingTitles.size}件の既存タイトルを読み込みました。`);

        for (let i = 0; i < data.length; i++) {
            try {
                const row = data[i];
                const productData = {
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    cast: [],
                    tags: []
                };

                // マッピングに基づいてデータを整形
                let hasTitle = false;
                let title = '';

                // 各CSVカラムを対応するFirestoreフィールドに設定
                for (const csvColumn of header) {
                    const firestoreField = mappings[csvColumn];
                    if (firestoreField && row[csvColumn]) {
                        const value = row[csvColumn];

                        // フィールドタイプに応じた処理
                        const fieldDef = firestoreFields.find(f => f.id === firestoreField);

                        if (fieldDef && fieldDef.isArray) {
                            // 配列フィールドの場合
                            const existingArray = productData[firestoreField] || [];
                            const newValues = value.split(/,|、/).map(item => item.trim()).filter(item => item);

                            // 重複を避けて配列を結合
                            productData[firestoreField] = [...new Set([...existingArray, ...newValues])];

                            // カウンターの更新
                            if (firestoreField === 'tags') {
                                newValues.forEach(tag => {
                                    const count = stats.tagsCounted.get(tag) || 0;
                                    stats.tagsCounted.set(tag, count + 1);
                                });
                            } else if (firestoreField === 'cast') {
                                newValues.forEach(actor => {
                                    const count = stats.actorsCounted.get(actor) || 0;
                                    stats.actorsCounted.set(actor, count + 1);
                                });
                            }
                        } else if (firestoreField === 'releaseDate') {
                            // 日付フィールド
                            productData[firestoreField] = normalizeDateString(value);
                        } else if (firestoreField === 'dlsiteUrl') {
                            // DLsiteのURL
                            productData[firestoreField] = normalizeUrl(value, 'dlsiteUrl');
                        } else if (firestoreField === 'thumbnailUrl') {
                            // サムネイルURL
                            productData[firestoreField] = normalizeUrl(value, 'thumbnailUrl');
                        } else {
                            // 通常の文字列フィールド
                            productData[firestoreField] = value.trim();
                        }

                        // タイトルが設定されたかチェック
                        if (firestoreField === 'title') {
                            hasTitle = true;
                            title = value.trim();
                        }
                    }
                }

                // 必須フィールドのチェック
                if (!hasTitle || !productData.title) {
                    addLog(`行 ${i + 2}: タイトルが設定されていないためスキップします`);
                    stats.skipped++;
                    continue;
                }

                // 既存のタイトルと重複チェック
                if (existingTitles.has(title.toLowerCase())) {
                    addLog(`行 ${i + 2}: "${title}" は既に登録済みのためスキップします`);
                    stats.duplicates++;
                    stats.skippedItems.push({
                        title: title,
                        reason: '既に登録済み'
                    });
                    continue;
                }

                // Firestoreに追加
                const docRef = doc(collection(db, 'products'));
                batch.set(docRef, productData);
                stats.success++;
                operationCount++;

                // 登録したタイトルを既存リストに追加（同一CSVファイル内の重複も検出）
                existingTitles.add(title.toLowerCase());

                // バッチサイズの上限に達したら一旦コミット
                if (operationCount >= MAX_BATCH_SIZE) {
                    addLog(`バッチ処理を実行します (${operationCount}件)...`);
                    await batch.commit();
                    batch = writeBatch(db);
                    operationCount = 0;
                }

                // 進捗ログ
                if ((i + 1) % 50 === 0 || i === data.length - 1) {
                    addLog(`${i + 1}/${data.length} 件処理中...`);
                }
            } catch (err) {
                console.error(`Error importing row ${i + 2}:`, err);
                addLog(`行 ${i + 2}: インポート中にエラーが発生しました: ${err.message}`);
                stats.failed++;
            }
        }

        // 残りのバッチをコミット
        if (operationCount > 0) {
            addLog(`残りのバッチ処理を実行します (${operationCount}件)...`);
            await batch.commit();
        }

        // タグデータの更新
        addLog('タグデータを更新中...');
        await updateTagsAndActors(stats.tagsCounted, stats.actorsCounted);

        return stats;
    };

    // タグと声優のデータを更新
    const updateTagsAndActors = async (tagsCounted, actorsCounted) => {
        try {
            // 既存のタグと声優データを取得
            addLog('既存のタグデータを取得中...');
            const existingTagsSnapshot = await getDocs(collection(db, 'tags'));
            const existingTags = new Map();
            existingTagsSnapshot.forEach(doc => {
                const data = doc.data();
                existingTags.set(doc.id, {
                    id: doc.id,
                    name: data.name,
                    count: data.count || 0
                });
            });

            addLog('既存の声優データを取得中...');
            const existingActorsSnapshot = await getDocs(collection(db, 'actors'));
            const existingActors = new Map();
            existingActorsSnapshot.forEach(doc => {
                const data = doc.data();
                existingActors.set(doc.id, {
                    id: doc.id,
                    name: data.name,
                    count: data.count || 0
                });
            });

            // タグデータの更新
            addLog('タグデータを更新中...');
            const tagBatch = writeBatch(db);
            let tagOperationCount = 0;
            const MAX_BATCH_SIZE = 500;

            // 新規タグの処理
            for (const [tag, count] of tagsCounted.entries()) {
                if (!tag) continue;

                const safeTagId = safeDocumentId(tag);
                const tagRef = doc(db, 'tags', safeTagId);

                if (existingTags.has(safeTagId)) {
                    // 既存のタグは更新
                    const existingTag = existingTags.get(safeTagId);
                    const newCount = (existingTag.count || 0) + count;
                    tagBatch.update(tagRef, {
                        count: newCount,
                        updatedAt: serverTimestamp()
                    });
                } else {
                    // 新しいタグ
                    tagBatch.set(tagRef, {
                        name: tag,
                        count: count,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp()
                    });
                }

                tagOperationCount++;

                // バッチサイズの上限に達したら一旦コミット
                if (tagOperationCount >= MAX_BATCH_SIZE) {
                    await tagBatch.commit();
                    tagOperationCount = 0;
                }
            }

            // 残りのタグバッチをコミット
            if (tagOperationCount > 0) {
                await tagBatch.commit();
            }

            // 声優データの更新
            addLog('声優データを更新中...');
            const actorBatch = writeBatch(db);
            let actorOperationCount = 0;

            // 新規声優の処理
            for (const [actor, count] of actorsCounted.entries()) {
                if (!actor) continue;

                const safeActorId = safeDocumentId(actor);
                const actorRef = doc(db, 'actors', safeActorId);

                if (existingActors.has(safeActorId)) {
                    // 既存の声優は更新
                    const existingActor = existingActors.get(safeActorId);
                    const newCount = (existingActor.count || 0) + count;
                    actorBatch.update(actorRef, {
                        count: newCount,
                        updatedAt: serverTimestamp()
                    });
                } else {
                    // 新しい声優
                    actorBatch.set(actorRef, {
                        name: actor,
                        count: count,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp()
                    });
                }

                actorOperationCount++;

                // バッチサイズの上限に達したら一旦コミット
                if (actorOperationCount >= MAX_BATCH_SIZE) {
                    await actorBatch.commit();
                    actorOperationCount = 0;
                }
            }

            // 残りの声優バッチをコミット
            if (actorOperationCount > 0) {
                await actorBatch.commit();
            }

            addLog('タグと声優の更新が完了しました');
        } catch (error) {
            console.error('Error updating tags and actors:', error);
            addLog(`タグと声優の更新中にエラーが発生しました: ${error.message}`);
            throw error;
        }
    };

    // サンプルCSVのダウンロード
    const downloadSampleCSV = () => {
        if (!mounted) return;

        const header = 'title,series,releaseDate,maker,cast,tags,thumbnailUrl,dlsiteUrl,pocketdramaUrl,stellaplayerUrl';
        const sampleData = [
            '催眠性指導 ～千香の記録～,催眠性指導,2023-11-10,TubeGals,速水奏,催眠,https://example.com/image1.jpg,https://example.com/dl1,https://example.com/pd1,https://example.com/sp1',
            '蛇香のライラ ～ナミリンのハレンチな冒険～,蛇香のライラ,2023-12-05,spires,"椎名純平,紫苑ヨウ",幻想,https://example.com/image2.jpg,https://example.com/dl2,https://example.com/pd2,https://example.com/sp2'
        ].join('\n');

        const csvContent = `${header}\n${sampleData}`;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'sample_products.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                <div className="flex">
                    <div className="ml-3">
                        <p className="text-sm text-blue-700">
                            <strong>ヒント:</strong> CSVファイルを使って複数の作品を一括登録できます。
                            DLsiteのCSVや標準形式のCSVを自動判別しますが、必要に応じてマッピングを変更できます。
                        </p>
                        <button
                            onClick={downloadSampleCSV}
                            className="mt-2 text-blue-600 hover:text-blue-800 underline text-sm"
                        >
                            サンプルCSVをダウンロード
                        </button>
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

            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    CSVファイルを選択
                </label>
                <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100"
                />
            </div>

            {preview.header.length > 0 && (
                <>
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

                    {/* マッピング設定部分（プレビュー後に表示される）を修正 */}
                    <div className="mb-8">
                        <h2 className="text-lg font-semibold mb-4">フィールドマッピング設定</h2>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                マッピングプリセット
                            </label>
                            <select
                                value={selectedPreset}
                                onChange={(e) => setSelectedPreset(e.target.value)}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                            >
                                {Object.entries(mappingPresets).map(([key, preset]) => (
                                    <option key={key} value={key}>{preset.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            {preview.header.map((csvColumn) => (
                                <div
                                    key={csvColumn}
                                    className={`flex items-center p-3 rounded ${mappings[csvColumn] ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
                                        }`}
                                >
                                    <div className="w-1/2 pr-2">
                                        <div className="text-sm font-medium text-gray-700">{csvColumn}</div>
                                        <div className="text-xs text-gray-500">CSV列</div>
                                    </div>
                                    <div className="w-1/2">
                                        <select
                                            value={mappings[csvColumn] || ''}
                                            onChange={(e) => handleMappingChange(csvColumn, e.target.value)}
                                            className={`block w-full pl-3 pr-10 py-2 text-sm ${mappings[csvColumn]
                                                ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                                                : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                                                } rounded-md`}
                                        >
                                            <option value="">-- 無視 --</option>
                                            {firestoreFields.map((field) => (
                                                <option key={field.id} value={field.id}>
                                                    {field.name}{field.required ? ' *' : ''}
                                                </option>
                                            ))}
                                        </select>
                                        {mappings[csvColumn] && (
                                            <div className="mt-1 text-xs text-green-600">
                                                {firestoreFields.find(f => f.id === mappings[csvColumn])?.name || ''} に設定
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                            <div className="flex">
                                <div className="ml-3">
                                    <p className="text-sm text-yellow-700">
                                        <strong>注意:</strong> 「*」がついているフィールドは必須です。マッピングが完了したら「インポート実行」ボタンをクリックしてください。
                                    </p>
                                    <p className="text-sm text-yellow-700 mt-1">
                                        <span className="inline-block w-3 h-3 bg-green-50 border border-green-200 mr-1"></span>
                                        <strong>緑色の項目</strong>: マッピング設定済み
                                        <span className="inline-block w-3 h-3 bg-gray-50 border border-gray-200 mr-1 ml-3"></span>
                                        <strong>灰色の項目</strong>: 無視 (インポートされません)
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

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

            {importStats && (
                <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                    <h2 className="text-lg font-semibold mb-2">インポート結果</h2>
                    <ul className="list-disc pl-5 text-sm">
                        <li className="mb-1">総処理数: {importStats.total}件</li>
                        <li className="mb-1 text-green-600">成功: {importStats.success}件</li>
                        <li className="mb-1 text-red-600">失敗: {importStats.failed}件</li>
                        <li className="mb-1 text-gray-500">スキップ: {importStats.skipped}件 (タイトル未設定)</li>
                        <li className="mb-1 text-yellow-600">重複スキップ: {importStats.duplicates}件</li>
                        <li className="mb-1">タグ数: {importStats.tagsCounted ? importStats.tagsCounted.size : 0}種類</li>
                        <li className="mb-1">声優数: {importStats.actorsCounted ? importStats.actorsCounted.size : 0}人</li>
                    </ul>

                    {importStats.skippedItems && importStats.skippedItems.length > 0 && (
                        <div className="mt-4">
                            <h3 className="text-md font-semibold mb-2">重複によりスキップした作品 (最大20件表示)</h3>
                            <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">タイトル</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">理由</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {importStats.skippedItems.slice(0, 20).map((item, index) => (
                                            <tr key={index}>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{item.title}</td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{item.reason}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {importStats.skippedItems.length > 20 && (
                                <p className="text-xs text-gray-500 mt-1">全{importStats.skippedItems.length}件中20件を表示しています</p>
                            )}
                        </div>
                    )}
                </div>
            )}

            {logMessages.length > 0 && (
                <div className="mt-6">
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
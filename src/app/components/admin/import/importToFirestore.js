// src/app/components/admin/import/importToFirestore.js

import { collection, doc, getDocs, writeBatch, serverTimestamp } from 'firebase/firestore';
import { safeDocumentId } from '../../../../lib/firebase/helpers';
import { normalizeDateString, normalizeUrl } from './csvHelpers';

// インポート処理
export const importToFirestore = async (db, data, header, mappings, firestoreFields, addLog) => {
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
                    } else if (firestoreField === 'dlsiteUrl' || firestoreField === 'pocketdramaUrl' || firestoreField === 'stellaplayerUrl') {
                        // URL
                        productData[firestoreField] = normalizeUrl(value, firestoreField);
                        addLog(`行 ${i + 2}: ${firestoreField}設定 - ${productData[firestoreField]}`);
                    } else if (firestoreField === 'thumbnailUrl') {
                        // サムネイルURL
                        productData[firestoreField] = normalizeUrl(value, 'thumbnailUrl');
                        addLog(`行 ${i + 2}: サムネイルURL設定 - ${productData[firestoreField]}`);
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
    await updateTagsAndActors(db, stats.tagsCounted, stats.actorsCounted, addLog);

    return stats;
};

// タグと声優のデータを更新
const updateTagsAndActors = async (db, tagsCounted, actorsCounted, addLog) => {
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
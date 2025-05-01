// /src/app/components/admin/ProductForm/helpers.js

import { collection, getDocs, doc, getDoc, updateDoc, writeBatch, serverTimestamp, query } from 'firebase/firestore';

// ドキュメントIDに無効な文字を含む場合に安全な文字列に変換する関数
export const safeDocumentId = (str) => {
    // スラッシュ(/)、ピリオド(.)、角括弧([])、二重引用符(")、アスタリスク(*)など
    // Firestoreで使用できない文字を置き換え
    return str.replace(/[\/\.\[\]\*"`]/g, '_');
};

// すべての作品からタグの出現数を集計する関数
export const recalculateTagCounts = async (db) => {
    try {
        // すべての作品を取得
        const productsQuery = query(collection(db, 'products'));
        const querySnapshot = await getDocs(productsQuery);

        // タグごとの出現数を集計
        const tagCounts = new Map();

        querySnapshot.forEach(doc => {
            const productData = doc.data();
            if (productData.tags && Array.isArray(productData.tags)) {
                productData.tags.forEach(tag => {
                    const count = tagCounts.get(tag) || 0;
                    tagCounts.set(tag, count + 1);
                });
            }
        });

        // タグコレクションを更新
        const batch = writeBatch(db);

        // まず既存のタグドキュメントを取得
        const tagsSnapshot = await getDocs(collection(db, 'tags'));
        const existingTags = new Set();

        tagsSnapshot.forEach(doc => {
            existingTags.add(doc.id);
        });

        // タグカウントを更新または作成
        for (const [tag, count] of tagCounts.entries()) {
            const safeTagId = safeDocumentId(tag);
            const tagRef = doc(db, 'tags', safeTagId);

            if (existingTags.has(safeTagId)) {
                // 既存のタグを更新
                batch.update(tagRef, {
                    count: count,
                    name: tag,
                    updatedAt: serverTimestamp()
                });
            } else {
                // 新しいタグを作成
                batch.set(tagRef, {
                    name: tag,
                    count: count,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
            }

            // 処理済みタグを記録
            existingTags.delete(safeTagId);
        }

        // 残りの使用されていないタグを削除
        for (const unusedTagId of existingTags) {
            batch.delete(doc(db, 'tags', unusedTagId));
        }

        // バッチ処理を実行
        await batch.commit();
        console.log('All tag counts recalculated successfully');
        return true;
    } catch (err) {
        console.error('Error recalculating tag counts:', err);
        return false;
    }
};

// すべての作品から声優の出現数を集計する関数
export const recalculateActorCounts = async (db) => {
    try {
        // すべての作品を取得
        const productsQuery = query(collection(db, 'products'));
        const querySnapshot = await getDocs(productsQuery);

        // 声優ごとの出現数を集計
        const actorCounts = new Map();

        querySnapshot.forEach(doc => {
            const productData = doc.data();
            if (productData.cast && Array.isArray(productData.cast)) {
                productData.cast.forEach(actor => {
                    const count = actorCounts.get(actor) || 0;
                    actorCounts.set(actor, count + 1);
                });
            }
        });

        // 声優コレクションを更新
        const batch = writeBatch(db);

        // まず既存の声優ドキュメントを取得
        const actorsSnapshot = await getDocs(collection(db, 'actors'));
        const existingActors = new Set();

        actorsSnapshot.forEach(doc => {
            existingActors.add(doc.id);
        });

        // 声優カウントを更新または作成
        for (const [actor, count] of actorCounts.entries()) {
            const safeActorId = safeDocumentId(actor);
            const actorRef = doc(db, 'actors', safeActorId);

            if (existingActors.has(safeActorId)) {
                // 既存の声優を更新
                batch.update(actorRef, {
                    count: count,
                    name: actor,
                    updatedAt: serverTimestamp()
                });
            } else {
                // 新しい声優を作成
                batch.set(actorRef, {
                    name: actor,
                    count: count,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
            }

            // 処理済み声優を記録
            existingActors.delete(safeActorId);
        }

        // 残りの使用されていない声優を削除
        for (const unusedActorId of existingActors) {
            batch.delete(doc(db, 'actors', unusedActorId));
        }

        // バッチ処理を実行
        await batch.commit();
        console.log('All actor counts recalculated successfully');
        return true;
    } catch (err) {
        console.error('Error recalculating actor counts:', err);
        return false;
    }
};

// 特典コレクションの更新
export const updateBonusCollection = async (db, actualProductId, allBonuses, selectedBonuses) => {
    try {
        const batch = writeBatch(db);

        // 全ての特典をチェック
        for (const bonus of allBonuses) {
            let needsUpdate = false;
            let relatedProducts = [...(bonus.relatedProducts || [])];

            // この特典が選択されているか確認
            const selectedBonus = selectedBonuses.find(b => b.id === bonus.id);

            // 既存の関連製品エントリを探す
            const existingEntryIndex = relatedProducts.findIndex(rp => rp.productId === actualProductId);

            if (selectedBonus) {
                // この特典が選択されている場合
                const selectedSites = Object.entries(selectedBonus.sites)
                    .filter(([_, isSelected]) => isSelected)
                    .map(([site, _]) => site);

                if (selectedSites.length > 0) {
                    if (existingEntryIndex >= 0) {
                        // 既存のエントリを更新
                        if (JSON.stringify(relatedProducts[existingEntryIndex].sites.sort()) !== JSON.stringify(selectedSites.sort())) {
                            relatedProducts[existingEntryIndex].sites = selectedSites;
                            needsUpdate = true;
                        }
                    } else {
                        // 新しいエントリを追加
                        relatedProducts.push({
                            productId: actualProductId,
                            sites: selectedSites
                        });
                        needsUpdate = true;
                    }
                } else {
                    // サイトが選択されていない場合、既存のエントリがあれば削除
                    if (existingEntryIndex >= 0) {
                        relatedProducts.splice(existingEntryIndex, 1);
                        needsUpdate = true;
                    }
                }
            } else {
                // この特典が選択されていない場合、既存のエントリがあれば削除
                if (existingEntryIndex >= 0) {
                    relatedProducts.splice(existingEntryIndex, 1);
                    needsUpdate = true;
                }
            }

            // 更新が必要な場合のみFirestoreを更新
            if (needsUpdate) {
                const bonusRef = doc(db, 'bonuses', bonus.id);
                batch.update(bonusRef, {
                    relatedProducts,
                    updatedAt: serverTimestamp()
                });
            }
        }

        // バッチ処理を実行
        await batch.commit();
        console.log('Bonuses collection updated successfully');
        return true;
    } catch (err) {
        console.error('Error updating bonuses collection:', err);
        throw err; // エラーを上位に伝播
    }
};
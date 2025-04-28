// /src/lib/firebase/bonuses.js

import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    serverTimestamp
} from 'firebase/firestore';
import { db } from './config';

// 全ての特典を取得
export async function getAllBonuses(limitCount = 50) {
    try {
        const bonusesQuery = query(
            collection(db, 'bonuses'),
            orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(bonusesQuery);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting all bonuses:', error);
        return [];
    }
}

// 特定の製品に関連する特典を取得
export async function getBonusesForProduct(productId) {
    try {
        const bonusesQuery = query(
            collection(db, 'bonuses'),
            where('relatedProducts', 'array-contains', { productId })
        );

        const querySnapshot = await getDocs(bonusesQuery);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error(`Error getting bonuses for product ${productId}:`, error);
        return [];
    }
}

// 製品と販売サイトに基づいて特典を取得
export async function getBonusesForProductAndSite(productId, siteId) {
    try {
        // 注意: この実装はFirestoreの制約により完全に正確ではない可能性があります
        // 実際には全特典を取得してクライアント側でフィルタリングする方が確実です
        const allBonuses = await getAllBonuses();

        return allBonuses.filter(bonus => {
            return bonus.relatedProducts.some(rp =>
                rp.productId === productId && rp.sites.includes(siteId)
            );
        });
    } catch (error) {
        console.error(`Error getting bonuses for product ${productId} and site ${siteId}:`, error);
        return [];
    }
}

// 特典をIDで取得
export async function getBonusById(bonusId) {
    try {
        const docRef = doc(db, 'bonuses', bonusId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return {
                id: docSnap.id,
                ...docSnap.data()
            };
        } else {
            console.log(`No bonus found with ID: ${bonusId}`);
            return null;
        }
    } catch (error) {
        console.error('Error getting bonus by ID:', error);
        return null;
    }
}

// 新しい特典を追加
export async function addBonus(bonusData) {
    try {
        const dataWithTimestamp = {
            ...bonusData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'bonuses'), dataWithTimestamp);
        return docRef.id;
    } catch (error) {
        console.error('Error adding bonus:', error);
        throw error;
    }
}

// 特典を更新
export async function updateBonus(bonusId, bonusData) {
    try {
        const docRef = doc(db, 'bonuses', bonusId);

        const dataWithTimestamp = {
            ...bonusData,
            updatedAt: serverTimestamp()
        };

        await updateDoc(docRef, dataWithTimestamp);
        return true;
    } catch (error) {
        console.error('Error updating bonus:', error);
        throw error;
    }
}

// 特典を削除
export async function deleteBonus(bonusId) {
    try {
        const docRef = doc(db, 'bonuses', bonusId);
        await deleteDoc(docRef);
        return true;
    } catch (error) {
        console.error('Error deleting bonus:', error);
        throw error;
    }
}
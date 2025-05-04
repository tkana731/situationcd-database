// /src/lib/firebase/products.js

import { initializeApp } from 'firebase/app';
import {
    getFirestore,
    collection,
    getDocs,
    getDoc,
    doc,
    query,
    where,
    orderBy,
    limit
} from 'firebase/firestore';

// Firebaseの設定
const firebaseConfig = {
    // ここに既存のFirebase設定を入れてください
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Firebase初期化（アプリがブラウザで実行されている場合のみ初期化）
let app;
let db;

if (typeof window !== 'undefined') {
    // クライアントサイドでのみ実行
    try {
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
    } catch (error) {
        console.error('Firebase initialization error:', error);
    }
}

// 全作品を取得する関数
export async function getAllProducts(limitCount = 50, sortOrder = 'latest') {
    if (!db) {
        console.error('Firestore not initialized');
        return [];
    }

    try {
        let productsQuery;

        // ソート順によってクエリを変更
        switch (sortOrder) {
            case 'latest':
                // 登録日時の新しい順（新着順）
                productsQuery = query(
                    collection(db, 'products'),
                    orderBy('createdAt', 'desc'),
                    limit(limitCount)
                );
                break;
            case 'newest':
                // 発売日が新しい順 - releaseDate フィールドが YYYY-MM-DD 形式であることを前提
                productsQuery = query(
                    collection(db, 'products'),
                    orderBy('releaseDate', 'desc'),
                    limit(limitCount)
                );
                break;
            case 'oldest':
                // 発売日が古い順 - releaseDate フィールドが YYYY-MM-DD 形式であることを前提
                productsQuery = query(
                    collection(db, 'products'),
                    orderBy('releaseDate', 'asc'),
                    limit(limitCount)
                );
                break;
            default:
                // デフォルトは登録日時の新しい順
                productsQuery = query(
                    collection(db, 'products'),
                    orderBy('createdAt', 'desc'),
                    limit(limitCount)
                );
        }

        const querySnapshot = await getDocs(productsQuery);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting all products:', error);
        return [];
    }
}

// 作品を検索する関数
export async function searchProducts(searchParams) {
    if (!db) {
        console.error('Firestore not initialized');
        return [];
    }

    console.log('searchProducts called with params:', searchParams);

    try {
        let productsQuery;

        // タグで検索
        if (searchParams.tag) {
            productsQuery = query(
                collection(db, 'products'),
                where('tags', 'array-contains', searchParams.tag),
                orderBy('releaseDate', 'desc')
            );
        }
        // 声優で検索
        else if (searchParams.actor) {
            productsQuery = query(
                collection(db, 'products'),
                where('cast', 'array-contains', searchParams.actor),
                orderBy('releaseDate', 'desc')
            );
        }
        // キーワードで検索（タイトル、メーカー、キャスト）
        else if (searchParams.q) {
            // Firestoreは完全一致しかサポートしていないため、
            // キーワード検索は簡易的な実装になっています

            // 全件を取得（limitなし）
            const allProductsQuery = query(
                collection(db, 'products'),
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(allProductsQuery);
            const allProducts = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            const filteredResults = allProducts.filter(product =>
                product.title.toLowerCase().includes(searchParams.q.toLowerCase()) ||
                (product.maker && product.maker.toLowerCase().includes(searchParams.q.toLowerCase())) ||
                // 声優（cast配列）の検索を追加
                (Array.isArray(product.cast) && product.cast.some(actor =>
                    actor.toLowerCase().includes(searchParams.q.toLowerCase())
                ))
            );

            return filteredResults;
        }
        // デフォルトは新着順
        else {
            return await getAllProducts();
        }

        const querySnapshot = await getDocs(productsQuery);
        const allResults = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log('Query results length:', allResults.length);

        return allResults;
    } catch (error) {
        console.error('Error searching products:', error);
        return [];
    }
}

// IDで作品を取得する関数（特典情報も含める）
export async function getProductById(productId) {
    if (!db) {
        console.error('Firestore not initialized');
        return null;
    }

    try {
        // 作品情報を取得
        const docRef = doc(db, 'products', productId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            console.log(`No product found with ID: ${productId}`);
            return null;
        }

        const productData = {
            id: docSnap.id,
            ...docSnap.data()
        };

        // 特典情報を取得（この作品IDに関連する特典を検索）
        const bonusesQuery = query(
            collection(db, 'bonuses'),
            where('relatedProducts', 'array-contains', {
                productId: productId,
                sites: ['dlsite', 'pocketdrama', 'stellaplayer']
            })
        );

        // 上記のクエリではうまく動作しない可能性があるため、別の方法で特典をフィルタリング
        const allBonusesQuery = collection(db, 'bonuses');
        const bonusesSnapshot = await getDocs(allBonusesQuery);

        // 販売サイト別の特典情報を整理
        const bonusesBySite = {
            dlsite: [],
            pocketdrama: [],
            stellaplayer: []
        };

        bonusesSnapshot.forEach(bonusDoc => {
            const bonusData = bonusDoc.data();

            // relatedProductsがあるか確認
            if (Array.isArray(bonusData.relatedProducts)) {
                // この製品に関連する特典であるかチェック
                bonusData.relatedProducts.forEach(relatedProduct => {
                    if (relatedProduct.productId === productId && Array.isArray(relatedProduct.sites)) {
                        // 各サイトに特典を追加
                        relatedProduct.sites.forEach(site => {
                            if (bonusesBySite[site]) {
                                bonusesBySite[site].push({
                                    id: bonusDoc.id,
                                    ...bonusData
                                });
                            }
                        });
                    }
                });
            }
        });

        return {
            ...productData,
            bonuses: bonusesBySite
        };
    } catch (error) {
        console.error('Error getting product by ID:', error);
        return null;
    }
}

// タグ一覧を取得する関数
export async function getAllTags(limitCount = 50) {
    if (!db) {
        console.error('Firestore not initialized');
        return [];
    }

    try {
        const tagsQuery = query(
            collection(db, 'tags'),
            orderBy('count', 'desc'),
            limit(limitCount)
        );

        const querySnapshot = await getDocs(tagsQuery);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting all tags:', error);
        return [];
    }
}

// 声優一覧を取得する関数
export async function getAllActors(limitCount = 50) {
    if (!db) {
        console.error('Firestore not initialized');
        return [];
    }

    try {
        const actorsQuery = query(
            collection(db, 'actors'),
            orderBy('count', 'desc'),
            limit(limitCount)
        );

        const querySnapshot = await getDocs(actorsQuery);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting all actors:', error);
        return [];
    }
}
// /src/lib/firebase/products.js

import { initializeApp, getApps } from 'firebase/app';
import {
    getFirestore,
    collection,
    getDocs,
    getDoc,
    doc,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    startAt,
    endAt
} from 'firebase/firestore';

// Firebaseの設定
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Firebase初期化（サーバーとクライアントの両方で動作するように）
let app;
let db;

if (!getApps().length) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApps()[0];
}

try {
    db = getFirestore(app);
} catch (error) {
    console.error('Firebase initialization error:', error);
}

// ページング付きで製品を取得する関数
export async function getProductsPaginated(page = 1, pageSize = 20, sortOrder = 'latest') {
    if (!db) {
        console.error('Firestore not initialized');
        return { products: [], totalCount: 0, lastVisible: null };
    }

    try {
        // ソート順によってクエリを変更
        let orderByField;
        let orderDirection;

        switch (sortOrder) {
            case 'latest':
                orderByField = 'createdAt';
                orderDirection = 'desc';
                break;
            case 'newest':
                orderByField = 'releaseDate';
                orderDirection = 'desc';
                break;
            case 'oldest':
                orderByField = 'releaseDate';
                orderDirection = 'asc';
                break;
            default:
                orderByField = 'createdAt';
                orderDirection = 'desc';
        }

        // トータルカウントを取得する別のクエリ
        // 注意: これは小規模なコレクションでのみ推奨されます
        // 大規模なコレクションの場合はカウンターを使用するべきです
        const countQuery = query(collection(db, 'products'));
        const countSnapshot = await getDocs(countQuery);
        const totalCount = countSnapshot.size;

        // メインクエリを構築
        let productsQuery = query(
            collection(db, 'products'),
            orderBy(orderByField, orderDirection),
            limit(pageSize)
        );

        // 2ページ目以降の場合、前のページの最後のドキュメントを取得
        if (page > 1) {
            // 前のページの最後のドキュメントを取得するクエリ
            const prevPageQuery = query(
                collection(db, 'products'),
                orderBy(orderByField, orderDirection),
                limit((page - 1) * pageSize)
            );

            const prevPageSnapshot = await getDocs(prevPageQuery);
            const prevPageDocs = prevPageSnapshot.docs;

            if (prevPageDocs.length === 0) {
                return { products: [], totalCount, lastVisible: null };
            }

            // 最後のドキュメントを取得
            const lastVisible = prevPageDocs[prevPageDocs.length - 1];

            // カーソルベースのページングでクエリを更新
            productsQuery = query(
                collection(db, 'products'),
                orderBy(orderByField, orderDirection),
                startAfter(lastVisible),
                limit(pageSize)
            );
        }

        const querySnapshot = await getDocs(productsQuery);
        const products = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // 次のページのために最後のドキュメントを保存
        const lastVisible = querySnapshot.docs.length > 0
            ? querySnapshot.docs[querySnapshot.docs.length - 1]
            : null;

        return {
            products,
            totalCount,
            lastVisible,
            hasMore: products.length === pageSize
        };
    } catch (error) {
        console.error('Error getting paginated products:', error);
        return { products: [], totalCount: 0, lastVisible: null, hasMore: false };
    }
}

// 検索用の関数もページング対応
export async function searchProductsPaginated(searchParams, page = 1, pageSize = 20) {
    if (!db) {
        console.error('Firestore not initialized');
        return { products: [], totalCount: 0, hasMore: false };
    }

    try {
        let productsQuery;
        let countQuery;

        // タグで検索
        if (searchParams.tag) {
            countQuery = query(
                collection(db, 'products'),
                where('tags', 'array-contains', searchParams.tag)
            );

            productsQuery = query(
                collection(db, 'products'),
                where('tags', 'array-contains', searchParams.tag),
                orderBy('releaseDate', 'desc'),
                limit(pageSize)
            );

            if (page > 1) {
                // 前のページの最後のドキュメントを取得するクエリ
                const prevPageQuery = query(
                    collection(db, 'products'),
                    where('tags', 'array-contains', searchParams.tag),
                    orderBy('releaseDate', 'desc'),
                    limit((page - 1) * pageSize)
                );

                const prevPageSnapshot = await getDocs(prevPageQuery);
                const prevPageDocs = prevPageSnapshot.docs;

                if (prevPageDocs.length > 0) {
                    const lastVisible = prevPageDocs[prevPageDocs.length - 1];

                    productsQuery = query(
                        collection(db, 'products'),
                        where('tags', 'array-contains', searchParams.tag),
                        orderBy('releaseDate', 'desc'),
                        startAfter(lastVisible),
                        limit(pageSize)
                    );
                }
            }
        }
        // 声優で検索
        else if (searchParams.actor) {
            countQuery = query(
                collection(db, 'products'),
                where('cast', 'array-contains', searchParams.actor)
            );

            productsQuery = query(
                collection(db, 'products'),
                where('cast', 'array-contains', searchParams.actor),
                orderBy('releaseDate', 'desc'),
                limit(pageSize)
            );

            if (page > 1) {
                // 前のページの最後のドキュメントを取得するクエリ
                const prevPageQuery = query(
                    collection(db, 'products'),
                    where('cast', 'array-contains', searchParams.actor),
                    orderBy('releaseDate', 'desc'),
                    limit((page - 1) * pageSize)
                );

                const prevPageSnapshot = await getDocs(prevPageQuery);
                const prevPageDocs = prevPageSnapshot.docs;

                if (prevPageDocs.length > 0) {
                    const lastVisible = prevPageDocs[prevPageDocs.length - 1];

                    productsQuery = query(
                        collection(db, 'products'),
                        where('cast', 'array-contains', searchParams.actor),
                        orderBy('releaseDate', 'desc'),
                        startAfter(lastVisible),
                        limit(pageSize)
                    );
                }
            }
        }
        // キーワード検索
        // 注意: Firestoreは全文検索に最適ではないため、大規模なアプリケーションではAlgoliaなどの
        // 専用の検索サービスを検討してください
        else if (searchParams.q) {
            const keyword = searchParams.q.toLowerCase();

            // 注意: ここでは簡易的な対応として全件取得してフィルタリングしていますが、
            // 実際のプロダクションでは全文検索サービスの利用を強く推奨します
            const allProductsQuery = query(
                collection(db, 'products'),
                orderBy('createdAt', 'desc'),
                limit(1000) // 最大1000件に制限
            );

            const querySnapshot = await getDocs(allProductsQuery);
            const allProducts = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            const filteredResults = allProducts.filter(product =>
                (product.title && product.title.toLowerCase().includes(keyword)) ||
                (product.maker && product.maker.toLowerCase().includes(keyword)) ||
                (Array.isArray(product.cast) && product.cast.some(actor =>
                    actor.toLowerCase().includes(keyword))
                )
            );

            // クライアントサイドでページングを実装
            const totalCount = filteredResults.length;
            const startIndex = (page - 1) * pageSize;
            const products = filteredResults.slice(startIndex, startIndex + pageSize);

            return {
                products,
                totalCount,
                hasMore: startIndex + pageSize < totalCount
            };
        }
        // デフォルトは新着順
        else {
            return await getProductsPaginated(page, pageSize, 'latest');
        }

        // トータルカウントを取得（タグ検索や声優検索の場合）
        const countSnapshot = await getDocs(countQuery);
        const totalCount = countSnapshot.size;

        // 実際の商品データを取得
        const querySnapshot = await getDocs(productsQuery);
        const products = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return {
            products,
            totalCount,
            hasMore: products.length === pageSize
        };
    } catch (error) {
        console.error('Error searching products with pagination:', error);
        return { products: [], totalCount: 0, hasMore: false };
    }
}

// 特定の年の作品を取得する関数（ページネーション対応）
export async function getProductsByYear(year, page = 1, pageSize = 20) {
    if (!db) {
        console.error('Firestore not initialized');
        return { products: [], totalCount: 0, hasMore: false };
    }

    try {
        const startDate = `${year}-01-01`;
        const endDate = `${year}-12-31`;

        // カウントクエリ
        const countQuery = query(
            collection(db, 'products'),
            where('releaseDate', '>=', startDate),
            where('releaseDate', '<=', endDate)
        );

        const countSnapshot = await getDocs(countQuery);
        const totalCount = countSnapshot.size;

        // データクエリ
        let productsQuery = query(
            collection(db, 'products'),
            where('releaseDate', '>=', startDate),
            where('releaseDate', '<=', endDate),
            orderBy('releaseDate', 'asc'),
            limit(pageSize)
        );

        if (page > 1) {
            // 前のページの最後のドキュメントを取得するクエリ
            const prevPageQuery = query(
                collection(db, 'products'),
                where('releaseDate', '>=', startDate),
                where('releaseDate', '<=', endDate),
                orderBy('releaseDate', 'asc'),
                limit((page - 1) * pageSize)
            );

            const prevPageSnapshot = await getDocs(prevPageQuery);
            const prevPageDocs = prevPageSnapshot.docs;

            if (prevPageDocs.length === 0) {
                return { products: [], totalCount, hasMore: false };
            }

            // 最後のドキュメントを取得
            const lastVisible = prevPageDocs[prevPageDocs.length - 1];

            // カーソルベースのページングでクエリを更新
            productsQuery = query(
                collection(db, 'products'),
                where('releaseDate', '>=', startDate),
                where('releaseDate', '<=', endDate),
                orderBy('releaseDate', 'asc'),
                startAfter(lastVisible),
                limit(pageSize)
            );
        }

        const querySnapshot = await getDocs(productsQuery);
        const products = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return {
            products,
            totalCount,
            hasMore: products.length === pageSize
        };
    } catch (error) {
        console.error('Error getting products by year:', error);
        return { products: [], totalCount: 0, hasMore: false };
    }
}

// 特定の年の月別作品数を取得する関数
export async function getProductCountsByMonth(year) {
    if (!db) {
        console.error('Firestore not initialized');
        return {};
    }

    try {
        const startDate = `${year}-01-01`;
        const endDate = `${year}-12-31`;

        // その年のすべての作品を取得（ページングなし）
        const productsQuery = query(
            collection(db, 'products'),
            where('releaseDate', '>=', startDate),
            where('releaseDate', '<=', endDate)
        );

        const querySnapshot = await getDocs(productsQuery);

        // 月別のカウント
        const monthlyCounts = {};

        // 1〜12月の初期化
        for (let i = 1; i <= 12; i++) {
            const month = i.toString().padStart(2, '0');
            monthlyCounts[month] = 0;
        }

        // 作品の月をカウント
        querySnapshot.forEach(doc => {
            const data = doc.data();
            if (data.releaseDate) {
                const month = data.releaseDate.substring(5, 7);
                monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;
            }
        });

        return monthlyCounts;
    } catch (error) {
        console.error('Error getting product counts by month:', error);
        return {};
    }
}

// 全作品を取得する関数（管理ツール用など限定的な用途に使用）
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

// 作品を検索する関数（下位互換性のため残す、ページネーションなし）
export async function searchProducts(searchParams) {
    if (!db) {
        console.error('Firestore not initialized');
        return [];
    }

    console.log('searchProducts called with params:', searchParams);

    try {
        const { products } = await searchProductsPaginated(searchParams, 1, 1000);
        return products;
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
export async function getAllTags(limitCount = 9999) {
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
export async function getAllActors(limitCount = 9999) {
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

// 直近1か月に発売される作品を取得する関数
export async function getUpcomingProducts(limitCount = 8) {
    if (!db) {
        console.error('Firestore not initialized');
        return [];
    }

    try {
        // 現在の日付を取得
        const today = new Date();
        // 今日の日付をYYYY-MM-DD形式に変換
        const todayStr = today.toISOString().split('T')[0];

        // 1か月後の日付を計算
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        const nextMonthStr = nextMonth.toISOString().split('T')[0];

        // 今日から1か月後までの発売予定作品を取得
        const upcomingQuery = query(
            collection(db, 'products'),
            where('releaseDate', '>=', todayStr),
            where('releaseDate', '<=', nextMonthStr),
            orderBy('releaseDate', 'asc'),
            limit(limitCount)
        );

        const querySnapshot = await getDocs(upcomingQuery);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting upcoming products:', error);

        // エラー時の代替手段: 今後発売の作品をリリース日順に取得
        try {
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];

            const alternativeQuery = query(
                collection(db, 'products'),
                where('releaseDate', '>=', todayStr),
                orderBy('releaseDate', 'asc'),
                limit(limitCount)
            );

            const alternativeSnapshot = await getDocs(alternativeQuery);
            return alternativeSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (fallbackError) {
            console.error('Fallback query also failed:', fallbackError);
            return [];
        }
    }
}

// タグで作品を取得する関数
export async function getProductsByTags(tags, limitCount = 20) {
    if (!db) {
        console.error('Firestore not initialized');
        return [];
    }

    try {
        const productsQuery = query(
            collection(db, 'products'),
            where('tags', 'array-contains-any', tags),
            orderBy('releaseDate', 'desc'),
            limit(limitCount)
        );

        const querySnapshot = await getDocs(productsQuery);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting products by tags:', error);
        return [];
    }
}

// 声優で作品を取得する関数
export async function getProductsByCast(cast, limitCount = 20) {
    if (!db) {
        console.error('Firestore not initialized');
        return [];
    }

    try {
        const productsQuery = query(
            collection(db, 'products'),
            where('cast', 'array-contains-any', cast),
            orderBy('releaseDate', 'desc'),
            limit(limitCount)
        );

        const querySnapshot = await getDocs(productsQuery);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting products by cast:', error);
        return [];
    }
}

// 年別の作品数を取得する関数
export async function getProductCountsByYear() {
    if (!db) {
        console.error('Firestore not initialized');
        return {};
    }

    try {
        const q = query(collection(db, 'products'));
        const querySnapshot = await getDocs(q);
        const yearCounts = {};

        // 作品の年をカウント
        querySnapshot.forEach(doc => {
            const data = doc.data();
            if (data.releaseDate) {
                const year = data.releaseDate.substring(0, 4);
                yearCounts[year] = (yearCounts[year] || 0) + 1;
            }
        });

        return yearCounts;
    } catch (error) {
        console.error('Error getting product counts by year:', error);
        return {};
    }
}
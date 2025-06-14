// /src/lib/firebase/blogs.js

import { initializeApp, getApps } from 'firebase/app';
import {
    getFirestore,
    collection,
    getDocs,
    getDoc,
    doc,
    query,
    orderBy,
    limit,
    where
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

// Firebase初期化
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

// 全てのブログ記事を取得（公開済みのみ）
export async function getAllBlogPosts() {
    if (!db) {
        console.error('Firestore not initialized');
        return [];
    }

    try {
        const blogsQuery = query(
            collection(db, 'blog_posts'),
            where('published', '==', true),
            orderBy('publishedAt', 'desc')
        );

        const querySnapshot = await getDocs(blogsQuery);
        const posts = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                // Timestampを文字列に変換
                publishedAt: data.publishedAt?.toDate?.()?.toISOString() || data.publishedAt,
                createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
                updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
            };
        });
        
        return posts;
    } catch (error) {
        console.error('Error getting blog posts:', error);
        return [];
    }
}

// 最新のブログ記事を取得
export async function getLatestBlogPosts(limitCount = 5) {
    if (!db) {
        console.error('Firestore not initialized');
        return [];
    }

    try {
        const blogsQuery = query(
            collection(db, 'blog_posts'),
            where('published', '==', true),
            orderBy('publishedAt', 'desc'),
            limit(limitCount)
        );

        const querySnapshot = await getDocs(blogsQuery);
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                // Timestampを文字列に変換
                publishedAt: data.publishedAt?.toDate?.()?.toISOString() || data.publishedAt,
                createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
                updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
            };
        });
    } catch (error) {
        console.error('Error getting latest blog posts:', error);
        return [];
    }
}

// スラッグでブログ記事を取得
export async function getBlogPostBySlug(slug) {
    if (!db) {
        console.error('Firestore not initialized');
        return null;
    }

    try {
        const blogsQuery = query(
            collection(db, 'blog_posts'),
            where('slug', '==', slug),
            where('published', '==', true)
        );

        const querySnapshot = await getDocs(blogsQuery);
        
        if (querySnapshot.empty) {
            return null;
        }

        const doc = querySnapshot.docs[0];
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            // Timestampを文字列に変換
            publishedAt: data.publishedAt?.toDate?.()?.toISOString() || data.publishedAt,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
        };
    } catch (error) {
        console.error('Error getting blog post by slug:', error);
        return null;
    }
}

// IDでブログ記事を取得
export async function getBlogPostById(id) {
    if (!db) {
        console.error('Firestore not initialized');
        return null;
    }

    try {
        const docRef = doc(db, 'blog_posts', id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return null;
        }

        const blogData = docSnap.data();
        
        // 公開されていない記事は返さない
        if (!blogData.published) {
            return null;
        }

        return {
            id: docSnap.id,
            ...blogData,
            // Timestampを文字列に変換
            publishedAt: blogData.publishedAt?.toDate?.()?.toISOString() || blogData.publishedAt,
            createdAt: blogData.createdAt?.toDate?.()?.toISOString() || blogData.createdAt,
            updatedAt: blogData.updatedAt?.toDate?.()?.toISOString() || blogData.updatedAt
        };
    } catch (error) {
        console.error('Error getting blog post by ID:', error);
        return null;
    }
}

// カテゴリでブログ記事を取得
export async function getBlogPostsByCategory(category) {
    if (!db) {
        console.error('Firestore not initialized');
        return [];
    }

    try {
        const blogsQuery = query(
            collection(db, 'blog_posts'),
            where('category', '==', category),
            where('published', '==', true),
            orderBy('publishedAt', 'desc')
        );

        const querySnapshot = await getDocs(blogsQuery);
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                // Timestampを文字列に変換
                publishedAt: data.publishedAt?.toDate?.()?.toISOString() || data.publishedAt,
                createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
                updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
            };
        });
    } catch (error) {
        console.error('Error getting blog posts by category:', error);
        return [];
    }
}

// 全てのスラッグを取得（Static Site Generation用）
export async function getAllBlogSlugs() {
    if (!db) {
        console.error('Firestore not initialized');
        return [];
    }

    try {
        const blogsQuery = query(
            collection(db, 'blog_posts'),
            where('published', '==', true)
        );

        const querySnapshot = await getDocs(blogsQuery);
        return querySnapshot.docs.map(doc => ({
            slug: doc.data().slug
        }));
    } catch (error) {
        console.error('Error getting blog slugs:', error);
        return [];
    }
}
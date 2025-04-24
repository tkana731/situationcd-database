// /src/lib/firebase/contact.js

import { initializeApp } from 'firebase/app';
import {
    getFirestore,
    collection,
    addDoc,
    serverTimestamp
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

// お問い合わせを送信する関数
export async function submitContactForm(formData) {
    if (!db) {
        console.error('Firestore not initialized');
        throw new Error('データベース接続エラー');
    }

    try {
        // バリデーション
        if (!formData.name || !formData.email || !formData.message) {
            throw new Error('必須項目が入力されていません');
        }

        // Firestoreにデータを保存
        const docRef = await addDoc(collection(db, 'contacts'), {
            name: formData.name,
            email: formData.email,
            subject: formData.subject || '（件名なし）',
            message: formData.message,
            createdAt: serverTimestamp(),
            status: 'new' // 新規問い合わせのステータス
        });

        return {
            success: true,
            id: docRef.id
        };
    } catch (error) {
        console.error('Error submitting contact form:', error);
        throw error;
    }
}
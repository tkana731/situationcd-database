// /src/lib/firebase/config.js

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth'; // 認証機能を追加

// 環境変数からFirebase設定を読み込む
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Firebase初期化（複数回初期化されないように）
let firebaseApp;
if (typeof window !== 'undefined' && !getApps().length) {
    firebaseApp = initializeApp(firebaseConfig);
} else if (typeof window !== 'undefined') {
    firebaseApp = getApps()[0];
}

// Firestoreの初期化
const db = typeof window !== 'undefined' ? getFirestore(firebaseApp) : null;

// Authenticationの初期化
const auth = typeof window !== 'undefined' ? getAuth(firebaseApp) : null;

export { db, auth, firebaseConfig };
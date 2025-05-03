// src/lib/firebase/helpers.js

// ドキュメントIDに無効な文字を含む場合に安全な文字列に変換する関数
export const safeDocumentId = (str) => {
    if (!str) return '_empty_';

    // スラッシュ(/)、ピリオド(.)、角括弧([])、二重引用符(")、アスタリスク(*)など
    // Firestoreで使用できない文字を置き換え
    return str.replace(/[\/\.\[\]\*"`]/g, '_');
};
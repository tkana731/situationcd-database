/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        domains: ['firebasestorage.googleapis.com'],
        formats: ['image/avif', 'image/webp'],
    },
    // output設定を環境に応じて切り替え
    output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
    // 末尾スラッシュを有効にする（全ての環境で）
    trailingSlash: true,
    // 静的HTMLエクスポート時に適切なcanonicalを確保
    poweredByHeader: false,
    // 404ページを明示的に設定
    async generateStaticParams() {
        return [];
    },
}
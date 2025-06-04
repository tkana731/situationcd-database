/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        domains: ['firebasestorage.googleapis.com'],
        formats: ['image/avif', 'image/webp'],
    },
    // output設定を環境に応じて切り替え
    output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
    // 静的エクスポート時にはtrailingSlashを有効にする
    trailingSlash: true,
}

export default nextConfig;
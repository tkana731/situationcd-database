/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        domains: ['firebasestorage.googleapis.com'],
        formats: ['image/avif', 'image/webp'],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
        minimumCacheTTL: 31536000, // 1年
    },
    // output設定を環境に応じて切り替え
    output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
    // 静的エクスポート時にはtrailingSlashを有効にする
    trailingSlash: true,
    // 圧縮とキャッシュ設定
    compress: true,
    // パフォーマンス最適化
    experimental: {
        optimizePackageImports: ['lucide-react'],
    },
}

export default nextConfig;
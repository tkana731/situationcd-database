/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        domains: ['firebasestorage.googleapis.com'],
    },
    output: 'export',
    // 本番環境用の設定
    // productionBrowserSourceMaps: false,
    // swcMinify: true,
}

export default nextConfig;
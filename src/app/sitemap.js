// src/app/sitemap.js

import { getAllActors } from '../lib/firebase/products';

export const dynamic = 'force-static';
export const revalidate = false;

export default async function sitemap() {
    const baseUrl = 'https://situationcd.com';

    // 現在の年を取得
    const currentYear = new Date().getFullYear();

    // 基本的なURLの定義
    const routes = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 1.0,
        },
        {
            url: `${baseUrl}/products`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/tags`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/actors`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/about`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: `${baseUrl}/privacy`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${baseUrl}/contact`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.6,
        },
    ];

    // 発売年のURLを追加
    for (let year = 2010; year <= currentYear; year++) {
        routes.push({
            url: `${baseUrl}/year/${year}/`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.7,
        });
    }

    // 人気声優のURLを追加（上位20名程度）
    try {
        const actors = await getAllActors(20);
        actors.forEach(actor => {
            routes.push({
                url: `${baseUrl}/actor/${encodeURIComponent(actor.name)}/`,
                lastModified: new Date(),
                changeFrequency: 'weekly',
                priority: 0.6,
            });
        });
    } catch (error) {
        console.error('Error generating actor URLs:', error);
    }

    return routes;
}
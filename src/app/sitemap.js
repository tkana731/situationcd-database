// src/app/sitemap.js

import { getAllActors, getAllTags } from '../lib/firebase/products';

export const dynamic = 'force-static';
export const revalidate = false;

export default async function sitemap() {
    const baseUrl = 'https://situationcd.com';

    // 現在の年を取得
    const currentYear = new Date().getFullYear();

    // 基本的なURLの定義（末尾スラッシュを確保）
    const routes = [
        {
            url: `${baseUrl}/`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 1.0,
        },
        {
            url: `${baseUrl}/products/`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/tags/`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/actors/`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/about/`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: `${baseUrl}/privacy/`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${baseUrl}/contact/`,
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

    // 特定のサンプル声優URLを追加（問題が報告されたURL）
    const sampleActors = [
        'aki',
        '佐和真中',
        '土門熱'
    ];

    sampleActors.forEach(actor => {
        routes.push({
            url: `${baseUrl}/actor/${encodeURIComponent(actor)}/`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
        });
    });

    // 声優のURLを追加
    try {
        const actors = await getAllActors(); // 全声優を取得
        actors.forEach(actor => {
            // サンプル声優と重複しない場合のみ追加
            if (!sampleActors.includes(actor.name)) {
                routes.push({
                    url: `${baseUrl}/actor/${encodeURIComponent(actor.name)}/`,
                    lastModified: new Date(),
                    changeFrequency: 'weekly',
                    priority: 0.6,
                });
            }
        });
    } catch (error) {
        console.error('Error generating actor URLs:', error);
    }

    // 人気タグのURLを追加（静的ページとして）
    try {
        const tags = await getAllTags();
        const popularTags = tags.slice(0, 30); // 上位30タグのみ
        popularTags.forEach(tag => {
            routes.push({
                url: `${baseUrl}/tag/${encodeURIComponent(tag.name)}/`,
                lastModified: new Date(),
                changeFrequency: 'weekly',
                priority: 0.7,
            });
        });
    } catch (error) {
        console.error('Error generating tag URLs:', error);
    }

    return routes;
}
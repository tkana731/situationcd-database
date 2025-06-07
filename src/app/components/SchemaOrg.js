// src/app/components/SchemaOrg.js
'use client';

import { useEffect } from 'react';

export default function SchemaOrg({ product, type = 'product' }) {
    useEffect(() => {
        let schema;

        if (type === 'website') {
            schema = {
                '@context': 'https://schema.org',
                '@type': 'WebSite',
                name: 'シチュエーションCDデータベース',
                description: '女性向けシチュエーションCDの総合情報サイト',
                url: 'https://situationcd.com',
                potentialAction: {
                    '@type': 'SearchAction',
                    target: {
                        '@type': 'EntryPoint',
                        urlTemplate: 'https://situationcd.com/search?q={search_term_string}'
                    },
                    'query-input': 'required name=search_term_string'
                },
                publisher: {
                    '@type': 'Organization',
                    name: 'シチュエーションCDデータベース',
                    url: 'https://situationcd.com'
                }
            };
        } else if (product && type === 'product') {
            schema = {
                '@context': 'https://schema.org',
                '@type': 'Product',
                name: product.title,
                description: `${product.title}は、${product.maker || ''}制作のシチュエーションCDです。${product.tags ? product.tags.join('、') : ''}などのジャンルが楽しめます。`,
                ...(product.thumbnailUrl && { 
                    image: {
                        '@type': 'ImageObject',
                        url: product.thumbnailUrl,
                        caption: product.title
                    }
                }),
                brand: {
                    '@type': 'Brand',
                    name: product.maker || 'シチュエーションCD'
                },
                category: 'シチュエーションCD',
                ...(product.cast && product.cast.length > 0 && {
                    performer: product.cast.map(actor => ({
                        '@type': 'Person',
                        name: actor,
                        jobTitle: '声優'
                    }))
                }),
                ...(product.releaseDate && { 
                    releaseDate: product.releaseDate,
                    datePublished: product.releaseDate
                }),
                genre: product.tags || [],
                aggregateRating: {
                    '@type': 'AggregateRating',
                    ratingValue: '4.5',
                    reviewCount: '1',
                    bestRating: '5',
                    worstRating: '1'
                },
                offers: {
                    '@type': 'Offer',
                    availability: 'https://schema.org/InStock',
                    itemCondition: 'https://schema.org/NewCondition'
                }
            };
        } else if (type === 'breadcrumb' && product) {
            schema = {
                '@context': 'https://schema.org',
                '@type': 'BreadcrumbList',
                itemListElement: [
                    {
                        '@type': 'ListItem',
                        position: 1,
                        name: 'ホーム',
                        item: 'https://situationcd.com'
                    },
                    {
                        '@type': 'ListItem',
                        position: 2,
                        name: '作品一覧',
                        item: 'https://situationcd.com/products'
                    },
                    {
                        '@type': 'ListItem',
                        position: 3,
                        name: product.title,
                        item: `https://situationcd.com/product/${product.id}`
                    }
                ]
            };
        }

        if (schema) {
            const script = document.createElement('script');
            script.type = 'application/ld+json';
            script.textContent = JSON.stringify(schema);
            script.id = `schema-${type}`;
            document.head.appendChild(script);

            return () => {
                const existingScript = document.getElementById(`schema-${type}`);
                if (existingScript) {
                    document.head.removeChild(existingScript);
                }
            };
        }
    }, [product, type]);

    return null;
}
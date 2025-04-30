// src/app/components/SchemaOrg.js
'use client';

import { useEffect } from 'react';

export default function SchemaOrg({ product }) {
    useEffect(() => {
        if (!product) return;

        const schema = {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.title,
            description: `${product.title}は、${product.maker || ''}制作のシチュエーションCDです。`,
            ...(product.thumbnailUrl && { image: product.thumbnailUrl }),
            ...(product.cast && product.cast.length > 0 && {
                performer: product.cast.map(actor => ({
                    '@type': 'Person',
                    name: actor
                }))
            }),
            ...(product.releaseDate && { releaseDate: product.releaseDate }),
            genre: product.tags || [],
        };

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(schema);
        document.head.appendChild(script);

        return () => {
            document.head.removeChild(script);
        };
    }, [product]);

    return null;
}
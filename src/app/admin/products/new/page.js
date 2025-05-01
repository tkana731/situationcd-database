'use client';

import ProductForm from '@/app/components/admin/ProductForm';  // これでindex.jsが読み込まれます

export default function NewProductPage() {
    return (
        <div>
            <ProductForm productId="new" />
        </div>
    );
}
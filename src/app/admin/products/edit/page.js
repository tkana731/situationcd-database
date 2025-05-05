'use client';

import { useSearchParams } from 'next/navigation';
import ProductForm from '../../../components/admin/ProductForm';

export default function EditProductPage() {
    const searchParams = useSearchParams();
    const productId = searchParams.get('id');

    if (!productId) {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded my-4">
                <p>作品IDが指定されていません。</p>
            </div>
        );
    }

    return (
        <div>
            <ProductForm productId={productId} />
        </div>
    );
}
// /src/app/admin/bonuses/edit/page.js

'use client';

import { useSearchParams } from 'next/navigation';
import BonusForm from '@/app/components/admin/BonusForm';

export default function EditBonusPage() {
    const searchParams = useSearchParams();
    const bonusId = searchParams.get('id');

    if (!bonusId) {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded my-4">
                <p>特典IDが指定されていません。</p>
            </div>
        );
    }

    return (
        <div>
            <BonusForm bonusId={bonusId} />
        </div>
    );
}
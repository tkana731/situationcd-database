// /src/app/admin/bonuses/new/page.js

'use client';

import BonusForm from '@/app/components/admin/BonusForm';

export default function NewBonusPage() {
    return (
        <div>
            <BonusForm bonusId="new" />
        </div>
    );
}
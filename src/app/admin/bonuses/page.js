// /src/app/admin/bonuses/page.js

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAllBonuses, deleteBonus } from '../../../lib/firebase/bonuses';

export default function BonusesAdminPage() {
    const [bonuses, setBonuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const fetchBonuses = async () => {
            try {
                setLoading(true);
                const bonusesData = await getAllBonuses();
                setBonuses(bonusesData);
            } catch (err) {
                console.error('Error fetching bonuses:', err);
                setError('特典データの取得に失敗しました');
            } finally {
                setLoading(false);
            }
        };

        fetchBonuses();
    }, []);

    const handleDelete = async (id, name) => {
        if (window.confirm(`「${name}」を削除してもよろしいですか？`)) {
            try {
                await deleteBonus(id);
                setBonuses(bonuses.filter(bonus => bonus.id !== id));
            } catch (err) {
                console.error('Error deleting bonus:', err);
                alert('削除に失敗しました');
            }
        }
    };

    if (loading) {
        return (
            <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">特典データを読み込み中...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded my-4">
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">特典一覧</h1>
                <div className="flex space-x-2">
                    <Link
                        href="/admin/bonuses/new"
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                    >
                        新規特典登録
                    </Link>
                </div>
            </div>

            {bonuses.length === 0 ? (
                <p className="text-gray-500 text-center py-8">登録されている特典はありません</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    特典名
                                </th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    タイプ
                                </th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    出演声優
                                </th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    関連作品数
                                </th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    操作
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {bonuses.map((bonus) => (
                                <tr key={bonus.id} className="hover:bg-gray-50">
                                    <td className="py-3 px-4 whitespace-nowrap">
                                        <div className="font-medium text-gray-900">{bonus.name}</div>
                                        <div className="text-sm text-gray-500">{bonus.conditions}</div>
                                    </td>
                                    <td className="py-3 px-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${bonus.type === '購入特典' ? 'bg-green-100 text-green-800' :
                                                bonus.type === '連動購入特典' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-purple-100 text-purple-800'}`}>
                                            {bonus.type}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">
                                            {bonus.castList && bonus.castList.length > 0
                                                ? bonus.castList.join(', ')
                                                : '未設定'}
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">
                                            {bonus.relatedProducts ? bonus.relatedProducts.length : 0}作品
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 whitespace-nowrap">
                                        <div className="flex space-x-2">
                                            <Link
                                                href={`/admin/bonuses/edit?id=${bonus.id}`}
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                編集
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(bonus.id, bonus.name)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                削除
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
// /src/app/components/admin/BonusSelector.js

'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, X } from 'lucide-react';

const BonusSelector = ({
    allBonuses,
    filteredBonuses,
    selectedBonuses,
    showNewBonusForm,
    searchQuery,
    setSearchQuery,
    setFilteredBonuses,
    handleSelectBonus,
    handleAddNewProduct
}) => {

    // 検索クエリが変更されたときにフィルタリング
    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredBonuses(allBonuses);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = allBonuses.filter(bonus =>
                bonus.name.toLowerCase().includes(query) ||
                (bonus.conditions && bonus.conditions.toLowerCase().includes(query)) ||
                (Array.isArray(bonus.castList) && bonus.castList.some(cast =>
                    cast.toLowerCase().includes(query)
                ))
            );
            setFilteredBonuses(filtered);
        }
    }, [searchQuery, allBonuses, setFilteredBonuses]);

    return (
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="flex items-center mb-4">
                <div className="relative flex-grow mr-4">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={16} className="text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="特典を検索..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <button
                    type="button"
                    onClick={handleAddNewProduct}
                    className="flex items-center bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                >
                    {showNewBonusForm ? (
                        <>
                            <X size={16} className="mr-1" />
                            キャンセル
                        </>
                    ) : (
                        <>
                            <Plus size={16} className="mr-1" />
                            新規特典を追加
                        </>
                    )}
                </button>
            </div>

            {/* 検索結果一覧 */}
            {!showNewBonusForm && filteredBonuses.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="max-h-48 overflow-y-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        特典名
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        タイプ
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        出演声優
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        操作
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredBonuses.map(bonus => {
                                    const isSelected = selectedBonuses.some(b => b.id === bonus.id);
                                    return (
                                        <tr
                                            key={bonus.id}
                                            className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{bonus.name}</div>
                                                {bonus.conditions && (
                                                    <div className="text-xs text-gray-500">{bonus.conditions}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                    ${bonus.type === '購入特典' ? 'bg-green-100 text-green-800' :
                                                        bonus.type === '連動購入特典' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-purple-100 text-purple-800'}`}>
                                                    {bonus.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500">
                                                    {(bonus.castList || []).join(', ')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    type="button"
                                                    onClick={() => handleSelectBonus(bonus)}
                                                    className={`px-3 py-1 rounded-md ${isSelected
                                                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                        : 'bg-blue-500 text-white hover:bg-blue-600'
                                                        }`}
                                                >
                                                    {isSelected ? '選択解除' : '選択'}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {!showNewBonusForm && filteredBonuses.length === 0 && (
                <div className="bg-white p-6 text-center border border-gray-200 rounded-lg">
                    <p className="text-gray-500">検索条件に一致する特典が見つかりませんでした</p>
                </div>
            )}
        </div>
    );
};

export default BonusSelector;
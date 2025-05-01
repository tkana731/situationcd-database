// /src/app/components/admin/SelectedBonusList.js

'use client';

import { X } from 'lucide-react';

const SelectedBonusList = ({
    selectedBonuses,
    handleRemoveBonus,
    handleBonusSiteToggle
}) => {
    return (
        <div className="mb-6">
            <h3 className="text-md font-semibold mb-3">選択済みの特典</h3>

            {selectedBonuses.length === 0 ? (
                <div className="bg-white p-6 text-center border border-gray-200 rounded-lg">
                    <p className="text-gray-500">特典が選択されていません</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {selectedBonuses.map(bonus => (
                        <div key={bonus.id} className="bg-white p-4 rounded-lg border border-gray-200">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center">
                                        <span className="font-medium text-gray-900">{bonus.name}</span>
                                        <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                            ${bonus.type === '購入特典' ? 'bg-green-100 text-green-800' :
                                                bonus.type === '連動購入特典' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-purple-100 text-purple-800'}`}>
                                            {bonus.type}
                                        </span>
                                    </div>
                                    {bonus.conditions && (
                                        <p className="text-sm text-gray-500 mt-1">{bonus.conditions}</p>
                                    )}
                                    {bonus.castList && bonus.castList.length > 0 && (
                                        <p className="text-sm text-gray-600 mt-1">
                                            <span className="font-medium">出演:</span> {bonus.castList.join(', ')}
                                        </p>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveBonus(bonus.id)}
                                    className="text-red-600 hover:text-red-800"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="mt-3 pt-3 border-t border-gray-100">
                                <span className="text-sm font-medium text-gray-700">入手可能なサイト:</span>
                                <div className="flex flex-wrap gap-3 mt-2">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id={`site-dlsite-${bonus.id}`}
                                            checked={bonus.sites.dlsite}
                                            onChange={() => handleBonusSiteToggle(bonus.id, 'dlsite')}
                                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                        />
                                        <label htmlFor={`site-dlsite-${bonus.id}`} className="ml-2 text-sm text-gray-700">
                                            DLsiteがるまに
                                        </label>
                                    </div>
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id={`site-pocketdrama-${bonus.id}`}
                                            checked={bonus.sites.pocketdrama}
                                            onChange={() => handleBonusSiteToggle(bonus.id, 'pocketdrama')}
                                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                        />
                                        <label htmlFor={`site-pocketdrama-${bonus.id}`} className="ml-2 text-sm text-gray-700">
                                            ポケットドラマCD
                                        </label>
                                    </div>
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id={`site-stellaplayer-${bonus.id}`}
                                            checked={bonus.sites.stellaplayer}
                                            onChange={() => handleBonusSiteToggle(bonus.id, 'stellaplayer')}
                                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                        />
                                        <label htmlFor={`site-stellaplayer-${bonus.id}`} className="ml-2 text-sm text-gray-700">
                                            ステラプレイヤー
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SelectedBonusList;
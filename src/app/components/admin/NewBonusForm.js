// /src/app/components/admin/NewBonusForm.js

'use client';

import { useState, useEffect } from 'react';

const NewBonusForm = ({
    newBonus,
    newBonusCastInput,
    handleNewBonusChange,
    handleNewBonusCastChange,
    handleNewBonusSiteToggle,
    handleNewBonusSubmit
}) => {
    return (
        <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
            <h3 className="text-lg font-medium mb-3">新規特典を追加</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        特典名 <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="name"
                        value={newBonus.name}
                        onChange={handleNewBonusChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        ref={(input) => {
                            // コンポーネントがマウントされた時にカーソルを『』の間に配置
                            if (input && newBonus.name === '『』') {
                                input.focus();
                                input.setSelectionRange(1, 1);
                            }
                        }}
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        特典タイプ
                    </label>
                    <select
                        name="type"
                        value={newBonus.type}
                        onChange={handleNewBonusChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="購入特典">購入特典</option>
                        <option value="連動購入特典">連動購入特典</option>
                        <option value="全巻購入特典">全巻購入特典</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        入手条件
                    </label>
                    <input
                        type="text"
                        name="conditions"
                        value={newBonus.conditions}
                        onChange={handleNewBonusChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="例: 2023年12月31日までの期間限定"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        出演声優 (カンマ区切りで複数入力可)
                    </label>
                    <input
                        type="text"
                        value={newBonusCastInput}
                        onChange={handleNewBonusCastChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="声優1, 声優2"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        入手可能なサイト <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-wrap gap-4">
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="new-dlsite"
                                checked={newBonus.sites.dlsite}
                                onChange={() => handleNewBonusSiteToggle('dlsite')}
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                            />
                            <label htmlFor="new-dlsite" className="ml-2 text-sm text-gray-700">
                                DLsiteがるまに
                            </label>
                        </div>
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="new-pocketdrama"
                                checked={newBonus.sites.pocketdrama}
                                onChange={() => handleNewBonusSiteToggle('pocketdrama')}
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                            />
                            <label htmlFor="new-pocketdrama" className="ml-2 text-sm text-gray-700">
                                ポケットドラマCD
                            </label>
                        </div>
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="new-stellaplayer"
                                checked={newBonus.sites.stellaplayer}
                                onChange={() => handleNewBonusSiteToggle('stellaplayer')}
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                            />
                            <label htmlFor="new-stellaplayer" className="ml-2 text-sm text-gray-700">
                                ステラプレイヤー
                            </label>
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={handleNewBonusSubmit}
                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                >
                    特典を追加
                </button>
            </div>
        </div>
    );
};

export default NewBonusForm;
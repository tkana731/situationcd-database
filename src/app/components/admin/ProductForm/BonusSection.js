// /src/app/components/admin/ProductForm/BonusSection.js

import React from 'react';
import BonusSelector from '../BonusSelector';
import NewBonusForm from '../NewBonusForm';
import SelectedBonusList from '../SelectedBonusList';
import { addBonus } from '../../../../lib/firebase/bonuses';

const BonusSection = ({
    allBonuses,
    selectedBonuses,
    searchQuery,
    filteredBonuses,
    showNewBonusForm,
    newBonus,
    newBonusCastInput,
    setSearchQuery,
    setFilteredBonuses,
    handleSelectBonus,
    handleRemoveBonus,
    handleBonusSiteToggle,
    handleAddNewProduct,
    handleNewBonusChange,
    handleNewBonusCastChange,
    handleNewBonusSiteToggle,
    setNewBonus,
    setNewBonusCastInput,
    setShowNewBonusForm,
    setSelectedBonuses,
    setAllBonuses,
    setSuccessMessage,
    setError,
    product,
    isNewProduct,
    productId
}) => {
    // 新規特典の送信処理
    const handleNewBonusSubmit = async () => {
        if (!newBonus.name) {
            alert('特典名を入力してください');
            return;
        }

        // サイトを選択しているか確認
        const selectedSites = Object.entries(newBonus.sites)
            .filter(([_, isSelected]) => isSelected)
            .map(([site, _]) => site);

        if (selectedSites.length === 0) {
            alert('少なくとも1つのサイトを選択してください');
            return;
        }

        try {
            // 特典データの準備
            const bonusData = {
                name: newBonus.name,
                type: newBonus.type,
                conditions: newBonus.conditions,
                castList: newBonus.castList,
                relatedProducts: [{
                    productId: isNewProduct ? 'temp-id' : productId,
                    sites: selectedSites
                }]
            };

            // 特典を追加
            const bonusId = await addBonus(bonusData);

            // 新しい特典をリストに追加
            const newBonusWithId = {
                id: bonusId,
                ...bonusData,
                sites: newBonus.sites
            };

            setAllBonuses(prev => [newBonusWithId, ...prev]);
            setFilteredBonuses(prev => [newBonusWithId, ...prev]);
            setSelectedBonuses(prev => [newBonusWithId, ...prev]);

            // フォームをリセット
            setNewBonus({
                name: '『』', // 初期値に『』を設定
                type: '購入特典',
                conditions: '',
                castList: [],
                sites: {
                    dlsite: false,
                    pocketdrama: false,
                    stellaplayer: false
                }
            });
            setNewBonusCastInput('');
            setShowNewBonusForm(false);
            setSuccessMessage('新しい特典を追加しました');
        } catch (err) {
            console.error('Error adding new bonus:', err);
            setError('特典の追加に失敗しました');
        }
    };

    return (
        <>
            <div className="md:col-span-2">
                <h2 className="text-lg font-semibold mb-4 pb-2 border-b">特典情報</h2>
            </div>

            <div className="md:col-span-2">
                {/* 特典検索・新規追加部分 */}
                <BonusSelector
                    allBonuses={allBonuses}
                    filteredBonuses={filteredBonuses}
                    selectedBonuses={selectedBonuses}
                    showNewBonusForm={showNewBonusForm}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    setFilteredBonuses={setFilteredBonuses}
                    handleSelectBonus={handleSelectBonus}
                    handleAddNewProduct={handleAddNewProduct}
                />

                {/* 新規特典フォーム */}
                {showNewBonusForm && (
                    <NewBonusForm
                        newBonus={newBonus}
                        newBonusCastInput={newBonusCastInput}
                        handleNewBonusChange={handleNewBonusChange}
                        handleNewBonusCastChange={handleNewBonusCastChange}
                        handleNewBonusSiteToggle={handleNewBonusSiteToggle}
                        handleNewBonusSubmit={handleNewBonusSubmit}
                    />
                )}

                {/* 選択済み特典一覧 */}
                <SelectedBonusList
                    selectedBonuses={selectedBonuses}
                    handleRemoveBonus={handleRemoveBonus}
                    handleBonusSiteToggle={handleBonusSiteToggle}
                />
            </div>
        </>
    );
};

export default BonusSection;
// /src/app/components/admin/ProductForm/CastTagsSection.js

import React from 'react';

const CastTagsSection = ({ product, castInput, tagsInput, handleCastChange, handleTagsChange }) => {
    return (
        <>
            <div className="md:col-span-2">
                <h2 className="text-lg font-semibold mb-4 pb-2 border-b">声優とタグ</h2>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    声優 (カンマ区切りで複数入力可)
                </label>
                <textarea
                    name="cast"
                    value={castInput}
                    onChange={handleCastChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="声優1, 声優2, 声優3"
                />
                <p className="mt-1 text-xs text-gray-500">
                    追加・削除を行うと声優一覧データも自動的に更新されます
                </p>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    タグ (カンマ区切りで複数入力可)
                </label>
                <textarea
                    name="tags"
                    value={tagsInput}
                    onChange={handleTagsChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="タグ1, タグ2, タグ3"
                />
                <p className="mt-1 text-xs text-gray-500">
                    追加・削除を行うとタグ一覧データも自動的に更新されます
                </p>
            </div>
        </>
    );
};

export default CastTagsSection;
// /src/app/components/admin/ProductForm/BasicInfoSection.js

import React from 'react';

const BasicInfoSection = ({ product, handleChange }) => {
    return (
        <>
            <div className="md:col-span-2">
                <h2 className="text-lg font-semibold mb-4 pb-2 border-b">基本情報</h2>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        タイトル <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="title"
                        value={product.title}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                {/* シリーズ名と制作会社を横並びに配置 */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            シリーズ名
                        </label>
                        <input
                            type="text"
                            name="series"
                            value={product.series || ''}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            制作会社
                        </label>
                        <input
                            type="text"
                            name="maker"
                            value={product.maker || ''}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        発売日
                    </label>
                    <input
                        type="text"
                        name="releaseDate"
                        value={product.releaseDate || ''}
                        onChange={handleChange}
                        placeholder="YYYY-MM-DD"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>
        </>
    );
};

export default BasicInfoSection;
// /src/app/components/admin/ProductForm/SalesInfoSection.js

import React from 'react';
import { ExternalLink, Image } from 'lucide-react';

const SalesInfoSection = ({ product, handleChange, dlsiteSearchUrl, pokedoraSearchUrl }) => {
    return (
        <>
            <div className="md:col-span-2">
                <h2 className="text-lg font-semibold mb-4 pb-2 border-b">販売情報</h2>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                        DLsiteがるまにURL
                        {dlsiteSearchUrl && (
                            <a
                                href={dlsiteSearchUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-2 inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
                            >
                                <ExternalLink size={12} className="mr-1" />
                                DLsiteで検索
                            </a>
                        )}
                    </label>
                    <input
                        type="url"
                        name="dlsiteUrl"
                        value={product.dlsiteUrl || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://www.dlsite.com/..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                        サムネイル画像URL
                        {product.dlsiteUrl && (
                            <span className="ml-2 text-xs text-gray-500">
                                <Image size={12} className="inline mr-1" />
                                DLsiteから入手できます
                            </span>
                        )}
                    </label>
                    <input
                        type="url"
                        name="thumbnailUrl"
                        value={product.thumbnailUrl || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://example.com/image.jpg"
                    />
                    {product.thumbnailUrl && (
                        <div className="mt-2">
                            <img
                                src={product.thumbnailUrl}
                                alt="サムネイル"
                                className="h-20 w-20 object-cover rounded"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = '/api/placeholder/200/200';
                                }}
                            />
                        </div>
                    )}
                </div>
            </div >

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                        ポケットドラマCD URL
                        {pokedoraSearchUrl && (
                            <a
                                href={pokedoraSearchUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-2 inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
                            >
                                <ExternalLink size={12} className="mr-1" />
                                ポケドラで検索
                            </a>
                        )}
                    </label>
                    <input
                        type="url"
                        name="pocketdramaUrl"
                        value={product.pocketdramaUrl || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://pocketdrama.jp/..."
                    />
                </div>
            </div >

            <div className="md:col-span-2 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        ステラプレイヤー URL
                    </label>
                    <input
                        type="url"
                        name="stellaplayerUrl"
                        value={product.stellaplayerUrl || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://stella-player.jp/..."
                    />
                </div>
            </div>
        </>
    );
};

export default SalesInfoSection;
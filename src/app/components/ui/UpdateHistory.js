// /src/app/components/ui/UpdateHistory.js

'use client';

import React, { useState } from 'react';
import { Megaphone, ChevronDown, ChevronUp } from 'lucide-react';

const UpdateHistory = () => {
    const [isExpanded, setIsExpanded] = useState(false);

    const updates = [
        {
            date: '2025-06-15',
            version: 'v1.3.0',
            title: 'ブログ機能追加',
            description: 'ブログページを追加しました。また、トップページにブログの最新3記事を表示する機能を追加しました。',
            type: 'feature'
        },
        {
            date: '2025-6-15',
            version: 'v1.2.0',
            title: '「あなたへのおすすめ」セクション移動',
            description: '「あなたへのおすすめ」セクションをトップページ最下部からお気に入りページ下部に移動しました。',
            type: 'improvement'
        },
        {
            date: '2025-06-04',
            version: 'v1.1.0',
            title: 'お気に入り機能追加',
            description: '作品をお気に入り登録できる機能を追加しました。また、お気に入りに基づいたおすすめ作品の表示機能を追加しました。',
            type: 'feature'
        },
        {
            date: '2025-04-25',
            version: 'v1.0.0',
            title: 'サイト公開',
            description: 'シチュエーションCDデータベースを開設しました。',
            type: 'major'
        }
    ];

    const getTypeStyle = (type) => {
        switch (type) {
            case 'major':
                return 'bg-red-100 text-red-700 border-red-200';
            case 'feature':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'improvement':
                return 'bg-green-100 text-green-700 border-green-200';
            case 'fix':
                return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getTypeLabel = (type) => {
        switch (type) {
            case 'major':
                return 'メジャー';
            case 'feature':
                return '新機能';
            case 'improvement':
                return '改善';
            case 'fix':
                return '修正';
            default:
                return '更新';
        }
    };

    const visibleUpdates = isExpanded ? updates : updates.slice(0, 3);

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-6">
                <Megaphone className="text-pink-500 mr-2" size={20} />
                <h2 className="text-xl font-bold text-gray-800">サイト更新履歴</h2>
            </div>

            <div className="space-y-4">
                {visibleUpdates.map((update, index) => (
                    <div
                        key={index}
                        className="border-l-4 border-pink-200 pl-4 py-2"
                    >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                            <div className="flex items-center gap-2 mb-2 sm:mb-0">
                                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full border ${getTypeStyle(update.type)}`}>
                                    {getTypeLabel(update.type)}
                                </span>
                                <span className="text-sm font-medium text-gray-600">
                                    {update.version}
                                </span>
                            </div>
                            <time className="text-sm text-gray-500">
                                {new Date(update.date).toLocaleDateString('ja-JP')}
                            </time>
                        </div>
                        <h3 className="font-medium text-gray-900 mb-1">
                            {update.title}
                        </h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            {update.description}
                        </p>
                    </div>
                ))}
            </div>

            {updates.length > 3 && (
                <div className="mt-6 text-center">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="inline-flex items-center gap-2 text-sm text-pink-600 hover:text-pink-700 font-medium transition-colors duration-200"
                    >
                        {isExpanded ? (
                            <>
                                <ChevronUp size={16} />
                                履歴を閉じる
                            </>
                        ) : (
                            <>
                                <ChevronDown size={16} />
                                過去の更新履歴を見る
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

export default UpdateHistory;
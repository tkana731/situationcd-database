// src/app/components/admin/import/FieldMapping.js

const FieldMapping = ({
    header,
    mappings,
    selectedPreset,
    setSelectedPreset,
    mappingPresets,
    handleMappingChange,
    firestoreFields
}) => {
    if (!header || header.length === 0) return null;

    return (
        <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">フィールドマッピング設定</h2>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    マッピングプリセット
                </label>
                <select
                    value={selectedPreset}
                    onChange={(e) => setSelectedPreset(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                    {Object.entries(mappingPresets).map(([key, preset]) => (
                        <option key={key} value={key}>{preset.name}</option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {header.map((csvColumn) => (
                    <div
                        key={csvColumn}
                        className={`flex items-center p-3 rounded ${mappings[csvColumn] ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
                            }`}
                    >
                        <div className="w-1/2 pr-2">
                            <div className="text-sm font-medium text-gray-700">{csvColumn}</div>
                            <div className="text-xs text-gray-500">CSV列</div>
                        </div>
                        <div className="w-1/2">
                            <select
                                value={mappings[csvColumn] || ''}
                                onChange={(e) => handleMappingChange(csvColumn, e.target.value)}
                                className={`block w-full pl-3 pr-10 py-2 text-sm ${mappings[csvColumn]
                                    ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                                    : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                                    } rounded-md`}
                            >
                                <option value="">-- 無視 --</option>
                                {firestoreFields.map((field) => (
                                    <option key={field.id} value={field.id}>
                                        {field.name}{field.required ? ' *' : ''}
                                    </option>
                                ))}
                            </select>
                            {mappings[csvColumn] && (
                                <div className="mt-1 text-xs text-green-600">
                                    {firestoreFields.find(f => f.id === mappings[csvColumn])?.name || ''} に設定
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <div className="flex">
                    <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                            <strong>注意:</strong> 「*」がついているフィールドは必須です。マッピングが完了したら「インポート実行」ボタンをクリックしてください。
                        </p>
                        <p className="text-sm text-yellow-700 mt-1">
                            <span className="inline-block w-3 h-3 bg-green-50 border border-green-200 mr-1"></span>
                            <strong>緑色の項目</strong>: マッピング設定済み
                            <span className="inline-block w-3 h-3 bg-gray-50 border border-gray-200 mr-1 ml-3"></span>
                            <strong>灰色の項目</strong>: 無視 (インポートされません)
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FieldMapping;
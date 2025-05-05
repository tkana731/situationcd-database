// src/app/components/admin/import/ImportResultSummary.js

const ImportResultSummary = ({ importStats }) => {
    if (!importStats) return null;

    return (
        <div className="mt-6 bg-gray-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">インポート結果</h2>
            <ul className="list-disc pl-5 text-sm">
                <li className="mb-1">総処理数: {importStats.total}件</li>
                <li className="mb-1 text-green-600">成功: {importStats.success}件</li>
                <li className="mb-1 text-red-600">失敗: {importStats.failed}件</li>
                <li className="mb-1 text-gray-500">スキップ: {importStats.skipped}件 (タイトル未設定)</li>
                <li className="mb-1 text-yellow-600">重複スキップ: {importStats.duplicates}件</li>
                <li className="mb-1 text-purple-600">声優フィルタスキップ: {importStats.filteredByActor}件</li>
                <li className="mb-1">タグ数: {importStats.tagsCounted ? importStats.tagsCounted.size : 0}種類</li>
                <li className="mb-1">声優数: {importStats.actorsCounted ? importStats.actorsCounted.size : 0}人</li>
            </ul>

            {importStats.skippedItems && importStats.skippedItems.length > 0 && (
                <div className="mt-4">
                    <h3 className="text-md font-semibold mb-2">スキップした作品 (最大20件表示)</h3>
                    <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">タイトル</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">理由</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {importStats.skippedItems.slice(0, 20).map((item, index) => (
                                    <tr key={index}>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{item.title}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.reason.includes('重複') ? 'bg-yellow-100 text-yellow-800' :
                                                    item.reason.includes('対象声優') ? 'bg-purple-100 text-purple-800' :
                                                        'bg-gray-100 text-gray-800'
                                                }`}>
                                                {item.reason}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {importStats.skippedItems.length > 20 && (
                        <p className="text-xs text-gray-500 mt-1">全{importStats.skippedItems.length}件中20件を表示しています</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default ImportResultSummary;
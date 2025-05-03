// src/app/components/admin/import/CSVPreviewTable.js

const CSVPreviewTable = ({ header, data }) => {
    if (!header || header.length === 0) return null;

    return (
        <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">プレビュー (最初の5行)</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full border">
                    <thead className="bg-gray-50">
                        <tr>
                            {header.map((column, index) => (
                                <th key={index} className="py-2 px-3 border text-left text-xs font-medium text-gray-500 uppercase">
                                    {column}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {data.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                                {header.map((column, colIndex) => (
                                    <td key={colIndex} className="py-2 px-3 border text-sm text-gray-500">
                                        {row[column] || ''}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CSVPreviewTable;
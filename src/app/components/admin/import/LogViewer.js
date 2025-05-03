// src/app/components/admin/import/LogViewer.js

const LogViewer = ({ logMessages }) => {
    if (!logMessages || logMessages.length === 0) return null;

    return (
        <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">ログ</h2>
            <div className="bg-gray-800 text-gray-200 p-4 rounded-md h-64 overflow-y-auto font-mono text-sm">
                {logMessages.map((msg, index) => (
                    <div key={index} className="mb-1">{msg}</div>
                ))}
            </div>
        </div>
    );
};

export default LogViewer;
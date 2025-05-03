// src/app/components/admin/import/CSVFileUploader.js

import { useRef } from 'react';

const CSVFileUploader = ({ handleFileChange, file, downloadSampleCSV }) => {
    const fileInputRef = useRef(null);

    return (
        <div className="mb-6">
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                <div className="flex">
                    <div className="ml-3">
                        <p className="text-sm text-blue-700">
                            <strong>ヒント:</strong> CSVファイルを使って複数の作品を一括登録できます。
                            DLsiteのCSVや標準形式のCSVを自動判別しますが、必要に応じてマッピングを変更できます。
                        </p>
                        <button
                            onClick={downloadSampleCSV}
                            className="mt-2 text-blue-600 hover:text-blue-800 underline text-sm"
                        >
                            サンプルCSVをダウンロード
                        </button>
                    </div>
                </div>
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-2">
                CSVファイルを選択
            </label>
            <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                ref={fileInputRef}
                className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
            />
        </div>
    );
};

export default CSVFileUploader;
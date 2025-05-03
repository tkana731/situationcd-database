// src/app/components/admin/import/csvHelpers.js

// ファイル読み込み関数
export const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('ファイルの読み込みに失敗しました'));
        reader.readAsText(file, 'utf-8');
    });
};

// CSVパース関数
export const parseCSV = (content) => {
    // 改行で分割
    const lines = content.split(/\r\n|\n|\r/);
    // 空行を削除
    const nonEmptyLines = lines.filter(line => line.trim().length > 0);

    if (nonEmptyLines.length < 2) {
        throw new Error('CSVファイルにデータがありません');
    }

    // ヘッダー行をカンマで分割
    const header = nonEmptyLines[0].split(',').map(item => item.trim());

    // データ行をパース
    const data = [];
    for (let i = 1; i < nonEmptyLines.length; i++) {
        const line = nonEmptyLines[i];
        const values = parseCSVLine(line);

        if (values.length === header.length) {
            const row = {};
            header.forEach((key, index) => {
                row[key] = values[index];
            });
            data.push(row);
        }
    }

    return { header, data };
};

// CSVの1行をパース（引用符内のカンマを考慮）
export const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    // 最後のフィールドを追加
    result.push(current.trim());

    return result;
};

// 日付文字列を正規化する関数
export const normalizeDateString = (dateStr) => {
    if (!dateStr) return '';

    // DLsiteの日付形式（YYYY年MM月DD日）を変換
    const dlsitePattern = /(\d{4})年(\d{1,2})月(\d{1,2})日/;
    if (dlsitePattern.test(dateStr)) {
        const match = dateStr.match(dlsitePattern);
        return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
    }

    // YYYY/MM/DD 形式を変換
    const slashPattern = /(\d{4})\/(\d{1,2})\/(\d{1,2})/;
    if (slashPattern.test(dateStr)) {
        const match = dateStr.match(slashPattern);
        return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
    }

    // すでにYYYY-MM-DD形式の場合はそのまま返す
    const dashPattern = /^\d{4}-\d{2}-\d{2}$/;
    if (dashPattern.test(dateStr)) {
        return dateStr;
    }

    return dateStr;
};

// URL文字列を正規化する関数
export const normalizeUrl = (urlStr, type) => {
    if (!urlStr) return '';

    // DLsiteのURLを正規化
    if (type === 'dlsiteUrl') {
        // 相対パスの場合
        if (urlStr.startsWith('/')) {
            return `https://www.dlsite.com${urlStr}`;
        }
        // 完全なURLの場合はそのまま返す
        return urlStr;
    }

    // 画像URLの正規化
    if (type === 'thumbnailUrl') {
        // 画像のURLが相対パスの場合
        if (urlStr.startsWith('/')) {
            return `https://img.dlsite.jp${urlStr}`;
        } else if (urlStr.startsWith('//')) {
            return `https:${urlStr}`;
        }
    }

    return urlStr;
};

// DLsite URLからサムネイルURLを生成する関数
export const generateThumbnailUrlFromDLsite = (dlsiteUrl) => {
    if (!dlsiteUrl) return '';

    // 複数の可能性のあるパターンをチェック

    // パターン1: /product_id/XXnnnnn.html
    let productIdMatch = dlsiteUrl.match(/\/product_id\/([A-Z]{2}\d+)\.html/);

    // パターン2: /work/=/product_id/XXnnnnn/
    if (!productIdMatch) {
        productIdMatch = dlsiteUrl.match(/\/work\/=\/product_id\/([A-Z]{2}\d+)\//);
    }

    // パターン3: /work/=/product_id/XXnnnnn.html
    if (!productIdMatch) {
        productIdMatch = dlsiteUrl.match(/\/work\/=\/product_id\/([A-Z]{2}\d+)\.html/);
    }

    // パターン4: /girls-drama/work/=/product_id/XXnnnnn/
    if (!productIdMatch) {
        productIdMatch = dlsiteUrl.match(/\/girls-drama\/work\/=\/product_id\/([A-Z]{2}\d+)\//);
    }

    // パターン5: /girls-drama/work/=/product_id/XXnnnnn.html
    if (!productIdMatch) {
        productIdMatch = dlsiteUrl.match(/\/girls-drama\/work\/=\/product_id\/([A-Z]{2}\d+)\.html/);
    }

    // パターン6: dlsite.com/XXnnnnn
    if (!productIdMatch) {
        productIdMatch = dlsiteUrl.match(/dlsite\.com\/([A-Z]{2}\d+)/);
    }

    if (!productIdMatch || !productIdMatch[1]) return '';

    const productId = productIdMatch[1];
    // 製品IDのprefix (例: BJ) と数字部分 (例: 242156) を分離
    const prefix = productId.substring(0, 2);
    const numberPart = parseInt(productId.substring(2), 10);

    // 1000単位で切り上げた数値を計算 (例: 242156 -> 243000)
    const roundedUp = Math.ceil(numberPart / 1000) * 1000;

    // サムネイルURLを生成
    // 女性向け作品の場合（RJやBJで始まる）
    if (prefix === 'RJ' || prefix === 'BJ') {
        return `https://img.dlsite.jp/modpub/images2/work/books/${prefix}${roundedUp}/${productId}_img_main.jpg`;
    } else {
        // その他の作品
        return `https://img.dlsite.jp/modpub/images2/work/doujin/${prefix}${roundedUp}/${productId}_img_main.jpg`;
    }
};

// サンプルCSVのダウンロード
export const downloadSampleCSV = () => {
    const header = 'title,series,releaseDate,maker,cast,tags,thumbnailUrl,dlsiteUrl,pocketdramaUrl,stellaplayerUrl';
    const sampleData = [
        '催眠性指導 ～千香の記録～,催眠性指導,2023-11-10,TubeGals,速水奏,催眠,https://example.com/image1.jpg,https://www.dlsite.com/girls-drama/work/=/product_id/BJ242156.html,https://example.com/pd1,https://example.com/sp1',
        '蛇香のライラ ～ナミリンのハレンチな冒険～,蛇香のライラ,2023-12-05,spires,"椎名純平,紫苑ヨウ",幻想,https://example.com/image2.jpg,https://www.dlsite.com/girls-drama/work/=/product_id/BJ223344.html,https://example.com/pd2,https://example.com/sp2'
    ].join('\n');

    const csvContent = `${header}\n${sampleData}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_products.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
// /src/app/actor/[name]/generateStaticParams.js

export async function generateStaticParams() {
    // 常に実際の声優データを取得する試み
    try {
        const { getAllActors } = await import('../../../lib/firebase/products');
        const actors = await getAllActors();

        // サンプルデータを追加して、一般的なURLパターンをカバー
        const additionalActors = [
            { name: 'aki' },
            { name: '佐和真中' },
            { name: '土門熱' }
        ];

        // 実際の声優データとサンプルデータを結合（重複を削除）
        const allActors = [...actors];

        // サンプル声優が既存リストにない場合だけ追加
        additionalActors.forEach(sample => {
            if (!allActors.some(actor => actor.name === sample.name)) {
                allActors.push(sample);
            }
        });

        return allActors.map(actor => ({
            name: encodeURIComponent(actor.name)
        }));
    } catch (error) {
        console.error('Error fetching actors for static params:', error);

        // エラー時はサンプルデータを返す
        return [
            { name: 'aki' },
            { name: '%E4%BD%90%E5%92%8C%E7%9C%9F%E4%B8%AD' }, // 佐和真中
            { name: '%E5%9C%9F%E9%96%80%E7%86%B1' }  // 土門熱
        ];
    }
}
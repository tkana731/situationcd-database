// /src/app/actor/[name]/generateStaticParams.js

export async function generateStaticParams() {
    // ビルド時には実際の声優データを取得
    try {
        const { getAllActors } = await import('../../../lib/firebase/products');
        const actors = await getAllActors();

        return actors.map(actor => ({
            name: encodeURIComponent(actor.name)
        }));
    } catch (error) {
        console.error('Error fetching actors for static params:', error);
        return [];
    }
}
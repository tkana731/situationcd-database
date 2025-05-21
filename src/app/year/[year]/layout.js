// /src/app/year/[year]/layout.js

export async function generateStaticParams() {
    const currentYear = new Date().getFullYear();
    const years = [];

    // 2010年から現在の年までのパラメータを生成
    for (let y = 2010; y <= currentYear; y++) {
        years.push({ year: y.toString() });
    }

    // 特定の指定された年も確実に含める
    const specificYears = [2015];
    specificYears.forEach(y => {
        if (!years.some(item => item.year === y.toString())) {
            years.push({ year: y.toString() });
        }
    });

    return years;
}

export default function YearLayout({ children }) {
    return children;
}
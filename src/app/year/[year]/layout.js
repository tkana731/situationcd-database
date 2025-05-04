// /src/app/year/[year]/layout.js

export async function generateStaticParams() {
    const currentYear = new Date().getFullYear();
    const years = [];

    for (let y = 2010; y <= currentYear; y++) {
        years.push({ year: y.toString() });
    }

    return years;
}

export default function YearLayout({ children }) {
    return children;
}
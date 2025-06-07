// /src/app/tag/[tag]/page.js

import { getAllTags } from '../../../lib/firebase/products';
import TagContent from './TagContent';

export async function generateStaticParams() {
  const tags = await getAllTags(30); // 上位30タグを静的生成
  
  return tags.map((tag) => ({
    tag: encodeURIComponent(tag.name),
  }));
}

export async function generateMetadata({ params }) {
  const tagName = decodeURIComponent(params.tag);
  
  return {
    title: `${tagName}のシチュエーションCD`,
    description: `${tagName}ジャンルのシチュエーションCD作品一覧。女性向けの${tagName}系作品を探すならシチュエーションCDデータベース。`,
    openGraph: {
      title: `${tagName}のシチュエーションCD一覧`,
      description: `${tagName}ジャンルのシチュエーションCD作品を検索できます。`,
    },
  };
}

export default function TagPage({ params }) {
  return <TagContent tagName={decodeURIComponent(params.tag)} />;
}
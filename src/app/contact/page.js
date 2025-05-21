import ContactPageContent from './ContactPageContent';

// メタデータを静的に定義
export const metadata = {
    title: 'お問い合わせ | シチュエーションCDデータベース',
    description: 'シチュエーションCDデータベースへのお問い合わせはこちらから。ご質問、情報の修正・追加依頼などを受け付けています。',
    alternates: {
        canonical: 'https://situationcd.com/contact/',
    }
};

export default function ContactPage() {
    return <ContactPageContent />;
}
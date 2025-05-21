'use client';

import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { ExternalLink } from 'lucide-react';

export default function ContactPageContent() {
    // Googleフォームの公開URL
    const googleFormUrl = "https://docs.google.com/forms/d/e/1FAIpQLSc-h3ZlBLlw-Vet-kgSEUZFGSDHU1j5kZrtDQFbwahwnfJJ2A/viewform?usp=header";

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Header />

            <main className="flex-grow">
                <div className="container mx-auto px-4 py-8">
                    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md overflow-hidden p-8">
                        <h1 className="text-3xl font-bold text-gray-800 mb-6">お問い合わせ</h1>

                        <p className="text-gray-700 mb-8">
                            当サイトに関するご質問、情報の修正・追加依頼、その他ご意見などがありましたら、
                            下記リンクからGoogleフォームにてお気軽にお問い合わせください。
                        </p>

                        {/* Googleフォームへのリンクボタン */}
                        <div className="text-center mb-10">
                            <a
                                href={googleFormUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white font-medium rounded-lg transition-colors"
                            >
                                <ExternalLink size={18} className="mr-2" />
                                お問い合わせフォームを開く
                            </a>
                        </div>

                        <div className="mt-8 pt-6 border-t border-pink-100">
                            <h2 className="text-xl font-semibold text-pink-600 mb-4">お問い合わせについて</h2>
                            <ul className="text-gray-700 space-y-2">
                                <li>• 原則3営業日以内に返信いたします。</li>
                                <li>• 作品情報の修正・追加依頼は、できるだけ詳細な情報をお知らせください。</li>
                                <li>• 迷惑メール対策のため、返信メールが届かない場合があります。「@situationcd.com」からのメールを受信できるよう設定をご確認ください。</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
// /src/app/about/page.js

import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

export default function AboutPage() {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Header />

            <main className="flex-grow">
                <div className="container mx-auto px-4 py-8">
                    <div className="bg-white rounded-lg shadow-md overflow-hidden p-8">
                        <h1 className="text-3xl font-bold text-gray-800 mb-6">サイトについて</h1>

                        <section className="mb-10">
                            <h2 className="text-xl font-semibold text-pink-600 mb-4">シチュエーションCDデータベースとは</h2>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                シチュエーションCDデータベースは、女性向けシチュエーションCD・音声作品を検索・閲覧できる情報サイトです。
                                最新作品の情報や人気声優、ジャンルなど、あなたの好みに合った作品を簡単に見つけることができます。
                            </p>
                            <p className="text-gray-700 leading-relaxed">
                                当サイトは個人運営のファンサイトであり、各作品の著作権は制作会社・配信サイトに帰属します。
                                掲載している情報は可能な限り正確を期していますが、最新の情報は各公式サイトでご確認ください。
                            </p>
                        </section>

                        <section className="mb-10">
                            <h2 className="text-xl font-semibold text-pink-600 mb-4">収録コンテンツ</h2>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                当サイトでは以下のコンテンツを中心に情報を提供しています：
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-gray-700">
                                <li>シチュエーションCD</li>
                                <li>ボイスドラマ</li>
                            </ul>
                        </section>

                        <section className="mb-10">
                            <h2 className="text-xl font-semibold text-pink-600 mb-4">リンクについて</h2>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                当サイトでは各作品の販売サイトへのリンクを掲載しています。リンク先は以下の公式サイトです：
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-gray-700">
                                <li>DLsiteがるまに</li>
                                <li>ポケットドラマCD</li>
                                <li>ステラプレイヤー</li>
                            </ul>
                            <p className="text-gray-700 leading-relaxed mt-4">
                                これらのサイトへのリンクにはアフィリエイトリンクが含まれている場合があります。
                                購入や視聴の際は、各サイトの利用規約をご確認ください。
                            </p>
                        </section>

                        <section className="mb-10">
                            <h2 className="text-xl font-semibold text-pink-600 mb-4">免責事項</h2>
                            <p className="text-gray-700 leading-relaxed">
                                当サイトに掲載されている情報の正確性には万全を期していますが、その内容について保証するものではありません。
                                また、当サイトの利用によって生じたいかなる損害についても、運営者は責任を負いかねます。
                                各作品の購入や視聴に関する判断は、利用者ご自身の責任において行ってください。
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-pink-600 mb-4">お問い合わせ</h2>
                            <p className="text-gray-700 leading-relaxed">
                                当サイトに関するお問い合わせ、情報の修正・追加依頼、その他ご意見などは、お問い合わせフォームよりご連絡ください。
                                内容を確認の上、順次対応いたします。
                            </p>
                        </section>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
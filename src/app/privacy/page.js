// /src/app/privacy/page.js

import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Header />

            <main className="flex-grow">
                <div className="container mx-auto px-4 py-8">
                    <div className="bg-white rounded-lg shadow-md overflow-hidden p-8">
                        <h1 className="text-3xl font-bold text-gray-800 mb-6">プライバシーポリシー</h1>

                        <section className="mb-10">
                            <h2 className="text-xl font-semibold text-pink-600 mb-4">個人情報の収集について</h2>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                当サイト「シチュエーションCDデータベース」では、お問い合わせフォームを通じて以下の個人情報を収集することがあります：
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                                <li>お名前</li>
                                <li>メールアドレス</li>
                                <li>お問い合わせ内容</li>
                            </ul>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                これらの情報は、お問い合わせへの回答や、サイト改善のためにのみ利用され、ご本人の同意なく第三者に提供されることはありません。
                            </p>
                            <p className="text-gray-700 leading-relaxed">
                                お問い合わせフォームはGoogleフォームを使用しており、入力された情報はGoogleのサーバーに保存されます。
                                Googleによる個人情報の取り扱いについては、<a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:underline">Googleのプライバシーポリシー</a>をご確認ください。
                            </p>
                        </section>

                        <section className="mb-10">
                            <h2 className="text-xl font-semibold text-pink-600 mb-4">アクセス解析ツールについて</h2>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                当サイトでは、サイトの利用状況や訪問者数などを把握するためにアクセス解析ツールを使用することがあります。
                                これらのツールが収集する情報には、閲覧したページ、訪問時間、使用したブラウザなどが含まれますが、
                                個人を特定できる情報は含まれていません。
                            </p>
                            <p className="text-gray-700 leading-relaxed">
                                収集されたデータはサイトの改善やコンテンツの充実に役立てるためだけに使用され、
                                第三者に提供されることはありません。
                            </p>
                        </section>

                        <section className="mb-10">
                            <h2 className="text-xl font-semibold text-pink-600 mb-4">Cookie（クッキー）の使用について</h2>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                当サイトでは、現在一般ユーザー向けの機能でCookieを直接使用していませんが、
                                外部サービスが内部的にCookieやローカルストレージを
                                使用している場合があります。Cookieとは、ウェブサイトがユーザーのブラウザに
                                保存する小さなテキストファイルで、ユーザー体験を向上させるために使用されます。
                            </p>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                将来的に機能追加によりCookieを使用する場合は、このポリシーを更新してお知らせします。
                                なお、ユーザーはブラウザの設定からCookieの受け入れを拒否することができますが、
                                その場合、一部の機能が正常に動作しない可能性があります。
                            </p>
                        </section>

                        <section className="mb-10">
                            <h2 className="text-xl font-semibold text-pink-600 mb-4">アフィリエイトリンクについて</h2>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                当サイトでは、作品の販売サイトへのリンクにアフィリエイトリンクを使用している場合があります。
                                これらのリンクを経由して製品を購入すると、当サイトに売上の一部が還元されます。
                            </p>
                            <p className="text-gray-700 leading-relaxed">
                                アフィリエイトによる収入は、当サイトの運営費用やコンテンツの充実のために使用されます。
                                ただし、アフィリエイトプログラムへの参加が当サイトのコンテンツや評価に影響を与えることはありません。
                            </p>
                        </section>

                        <section className="mb-10">
                            <h2 className="text-xl font-semibold text-pink-600 mb-4">外部サイトへのリンクについて</h2>
                            <p className="text-gray-700 leading-relaxed">
                                当サイトには、外部サイトへのリンクが含まれています。
                                リンク先のサイトのプライバシーポリシーやコンテンツについては、
                                当サイトが責任を負うものではありません。
                                リンク先のサイトを利用する際は、そのサイトのプライバシーポリシーをご確認ください。
                            </p>
                        </section>

                        <section className="mb-10">
                            <h2 className="text-xl font-semibold text-pink-600 mb-4">プライバシーポリシーの変更について</h2>
                            <p className="text-gray-700 leading-relaxed">
                                当サイトは、必要に応じてプライバシーポリシーを変更することがあります。
                                重要な変更がある場合は、サイト上で告知します。
                                定期的にこのページを確認することをお勧めします。
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-pink-600 mb-4">お問い合わせ</h2>
                            <p className="text-gray-700 leading-relaxed">
                                プライバシーポリシーに関するご質問やご意見がある場合は、サイト内のお問い合わせフォームからご連絡ください。
                                お問い合わせいただいた内容を確認の上、順次対応いたします。
                            </p>
                        </section>

                        <div className="mt-10 pt-6 border-t border-pink-100 text-right">
                            <p className="text-sm text-gray-500">最終更新日: 2025年4月25日</p>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
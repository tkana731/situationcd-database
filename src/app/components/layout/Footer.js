// /src/app/components/layout/Footer.js

import Link from 'next/link';
import { Twitter } from 'lucide-react';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-pink-50 py-8 mt-12 border-t border-pink-100">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between">
                    <div className="mb-6 md:mb-0">
                        <h2 className="font-bold text-xl text-pink-600 mb-3">シチュエーションCDデータベース</h2>
                        <p className="text-gray-600 text-sm">女性向けシチュエーションCDの情報サイト</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                        <div>
                            <h3 className="font-semibold text-pink-600 mb-2">サイト情報</h3>
                            <ul className="text-gray-600 text-sm space-y-1">
                                <li><Link href="/about" className="hover:text-pink-600">運営者情報</Link></li>
                                <li><Link href="/privacy" className="hover:text-pink-600">プライバシーポリシー</Link></li>
                                <li><Link href="/contact" className="hover:text-pink-600">お問い合わせ</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold text-pink-600 mb-2">カテゴリー</h3>
                            <ul className="text-gray-600 text-sm space-y-1">
                                <li><Link href="/products" className="hover:text-pink-600">新着作品</Link></li>
                                <li><Link href="/tags" className="hover:text-pink-600">人気タグ</Link></li>
                                <li><Link href="/actors" className="hover:text-pink-600">声優一覧</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold text-pink-600 mb-2">SNS</h3>
                            <ul className="text-gray-600 text-sm space-y-1">
                                <li>
                                    <a
                                        href="https://x.com/situationcd"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center hover:text-pink-600"
                                    >
                                        <Twitter size={16} className="mr-1" />
                                        公式X（Twitter）
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="mt-8 pt-6 border-t border-pink-200 text-center text-sm text-gray-500">
                    © {currentYear} シチュエーションCDデータベース All Rights Reserved.
                </div>
            </div>
        </footer>
    );
};

export default Footer;
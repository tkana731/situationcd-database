'use client';

import { useState } from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { submitContactForm } from '../../lib/firebase/contact';
import { Mail, User, MessageSquare, Send } from 'lucide-react';

export default function ContactPage() {
    // フォームの状態
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });

    // 送信状態
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitResult, setSubmitResult] = useState({
        success: false,
        message: ''
    });

    // 入力フィールドの変更ハンドラ
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // フォーム送信ハンドラ
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitResult({ success: false, message: '' });

        try {
            const result = await submitContactForm(formData);

            if (result.success) {
                // 送信成功
                setSubmitResult({
                    success: true,
                    message: 'お問い合わせを受け付けました。ありがとうございます。'
                });

                // フォームをリセット
                setFormData({
                    name: '',
                    email: '',
                    subject: '',
                    message: ''
                });
            }
        } catch (error) {
            // 送信失敗
            setSubmitResult({
                success: false,
                message: `エラーが発生しました: ${error.message}`
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Header />

            <main className="flex-grow">
                <div className="container mx-auto px-4 py-8">
                    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md overflow-hidden p-8">
                        <h1 className="text-3xl font-bold text-gray-800 mb-6">お問い合わせ</h1>

                        <p className="text-gray-700 mb-8">
                            当サイトに関するご質問、情報の修正・追加依頼、その他ご意見などがありましたら、
                            下記フォームよりお気軽にお問い合わせください。
                        </p>

                        {submitResult.success ? (
                            <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-6 mb-8 text-center">
                                <div className="flex items-center justify-center mb-4">
                                    <div className="bg-green-100 rounded-full p-2">
                                        <Send size={24} className="text-green-600" />
                                    </div>
                                </div>
                                <h3 className="text-lg font-semibold mb-2">送信完了</h3>
                                <p>{submitResult.message}</p>
                                <button
                                    onClick={() => setSubmitResult({ success: false, message: '' })}
                                    className="mt-4 px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-colors"
                                >
                                    新しいお問い合わせを作成
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {submitResult.message && (
                                    <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-4">
                                        {submitResult.message}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-2 flex items-center">
                                        <User size={18} className="mr-2 text-pink-500" />
                                        お名前 <span className="text-red-500 ml-1">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-300"
                                        placeholder="例: 田中 花子"
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-2 flex items-center">
                                        <Mail size={18} className="mr-2 text-pink-500" />
                                        メールアドレス <span className="text-red-500 ml-1">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-300"
                                        placeholder="例: example@example.com"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        ※入力いただいたメールアドレスは、お問い合わせへの返信にのみ使用します。
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-2 flex items-center">
                                        <MessageSquare size={18} className="mr-2 text-pink-500" />
                                        件名
                                    </label>
                                    <input
                                        type="text"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-300"
                                        placeholder="例: 作品情報の修正依頼"
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-2 flex items-center">
                                        <MessageSquare size={18} className="mr-2 text-pink-500" />
                                        お問い合わせ内容 <span className="text-red-500 ml-1">*</span>
                                    </label>
                                    <textarea
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        required
                                        rows="6"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-300"
                                        placeholder="お問い合わせ内容を入力してください"
                                    ></textarea>
                                </div>

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-4 rounded-md transition-colors flex items-center justify-center disabled:bg-pink-300"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent mr-2"></span>
                                                送信中...
                                            </>
                                        ) : (
                                            <>
                                                <Send size={18} className="mr-2" />
                                                送信する
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}

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
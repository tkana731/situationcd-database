// src/app/components/ui/Breadcrumb.js
'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumb({ items }) {
    return (
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6" aria-label="パンくずリスト">
            <Link 
                href="/" 
                className="flex items-center hover:text-pink-600 transition-colors"
                aria-label="ホーム"
            >
                <Home size={16} className="mr-1" />
                ホーム
            </Link>
            
            {items.map((item, index) => (
                <div key={index} className="flex items-center">
                    <ChevronRight size={16} className="mx-2 text-gray-400" />
                    {item.href ? (
                        <Link 
                            href={item.href}
                            className="hover:text-pink-600 transition-colors"
                        >
                            {item.name}
                        </Link>
                    ) : (
                        <span className="text-gray-800 font-medium">
                            {item.name}
                        </span>
                    )}
                </div>
            ))}
        </nav>
    );
}
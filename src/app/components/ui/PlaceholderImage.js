// src/app/components/ui/PlaceholderImage.js

'use client';

const PlaceholderImage = ({ width = 300, height = 200 }) => {
    return (
        <svg
            width={width}
            height={height}
            viewBox="0 0 300 200"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="画像なし"
            style={{ maxWidth: '100%', height: 'auto' }}
        >
            <title>画像なし</title>
            <rect width="100%" height="100%" fill="#FDF2F8" rx="8" ry="8" />

            {/* NOIMAGEのテキスト */}
            <text
                x="150"
                y="100"
                fontFamily="sans-serif"
                fontSize="20"
                fontWeight="bold"
                textAnchor="middle"
                fill="#DB2777"
            >
                NO IMAGE
            </text>
        </svg>
    );
};

export default PlaceholderImage;
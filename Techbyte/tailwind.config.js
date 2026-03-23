/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#36b084', // Matches TechByte branding
                    dark: '#2a8f6a',
                },
                secondary: '#1a1a1a',
                text: {
                    dark: '#1a1a1a',
                    muted: '#6b7280',
                },
                bg: {
                    light: '#f3f4f6',
                    white: '#ffffff',
                },
                warning: '#f59e0b',
                border: '#e5e7eb',
            },
            fontFamily: {
                sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
            },
            container: {
                center: true,
                padding: '1.5rem',
                screens: {
                    lg: '1280px',
                },
            },
            keyframes: {
                shimmer: {
                    '100%': { transform: 'translateX(100%)' },
                },
            },
            animation: {
                shimmer: 'shimmer 2s infinite linear',
            },
        },
    },
    plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Penn State colors
                'nittany-navy': '#041E42',
                'beaver-blue': '#1E407C',
                'slate': '#314D64',
                'limestone': '#A2AAAD',
                'white-out': '#FFFFFF',
                'lion-shrine': '#B88965',
                'accent': {
                    blue: '#3B82F6',
                    green: '#10B981',
                    purple: '#8B5CF6',
                    orange: '#F59E0B',
                },
                // Canvas tactical colors
                'corkboard': {
                    light: '#D4A574',
                    DEFAULT: '#C4956B',
                    dark: '#A67B5B',
                    shadow: '#8B6914',
                },
                'heist': {
                    red: '#C41E3A',
                    crimson: '#8B0000',
                    string: '#8B2323',
                },
                'postit': {
                    yellow: '#FFF740',
                    pink: '#FF7EB9',
                    blue: '#7AFCFF',
                    green: '#7AFF8B',
                    orange: '#FFB347',
                },
                'blueprint': {
                    bg: '#1a2a3a',
                    line: '#4A90D9',
                    grid: 'rgba(74, 144, 217, 0.15)',
                },
                'tactical': {
                    glass: 'rgba(255, 107, 44, 0.1)',
                    glow: 'rgba(255, 107, 44, 0.6)',
                }
            },
            fontFamily: {
                'sans': ['Inter', 'system-ui', 'sans-serif'],
                'script': ['Caveat', 'Brush Script MT', 'cursive'],
                'typewriter': ['Special Elite', 'Courier New', 'monospace'],
                'stencil': ['Russo One', 'Impact', 'sans-serif'],
            },
            animation: {
                'gradient': 'gradient 8s linear infinite',
                'float': 'float 6s ease-in-out infinite',
                'pulse-slow': 'pulse 3s ease-in-out infinite',
                'slide-up': 'slideUp 0.5s ease-out',
                'fade-in': 'fadeIn 0.3s ease-out',
                'pulse-border': 'pulseBorder 2s ease-in-out infinite',
                'typewriter': 'typewriter 0.1s steps(1) forwards',
                'swing': 'swing 3s ease-in-out infinite',
                'paper-drop': 'paperDrop 0.4s ease-out forwards',
                'string-draw': 'stringDraw 0.6s ease-out forwards',
                'stamp': 'stamp 0.3s ease-out forwards',
            },
            keyframes: {
                gradient: {
                    '0%, 100%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                pulseBorder: {
                    '0%, 100%': { boxShadow: '0 0 0 0 rgba(255, 107, 44, 0.4)' },
                    '50%': { boxShadow: '0 0 0 4px rgba(255, 107, 44, 0.2)' },
                },
                swing: {
                    '0%, 100%': { transform: 'rotate(-1deg)' },
                    '50%': { transform: 'rotate(1deg)' },
                },
                paperDrop: {
                    '0%': { transform: 'translateY(-20px) rotate(-5deg)', opacity: '0' },
                    '60%': { transform: 'translateY(5px) rotate(2deg)', opacity: '1' },
                    '100%': { transform: 'translateY(0) rotate(0deg)', opacity: '1' },
                },
                stringDraw: {
                    '0%': { strokeDashoffset: '1000' },
                    '100%': { strokeDashoffset: '0' },
                },
                stamp: {
                    '0%': { transform: 'scale(2) rotate(-15deg)', opacity: '0' },
                    '50%': { transform: 'scale(0.9) rotate(-10deg)', opacity: '1' },
                    '100%': { transform: 'scale(1) rotate(-8deg)', opacity: '1' },
                },
            },
            backdropBlur: {
                xs: '2px',
            },
            boxShadow: {
                'tactile': '4px 6px 12px rgba(0, 0, 0, 0.3), 2px 3px 6px rgba(0, 0, 0, 0.2)',
                'paper': '2px 4px 8px rgba(0, 0, 0, 0.15), 1px 2px 4px rgba(0, 0, 0, 0.1)',
                'pushpin': '1px 2px 3px rgba(0, 0, 0, 0.4)',
                'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
            },
        },
    },
    plugins: [],
}

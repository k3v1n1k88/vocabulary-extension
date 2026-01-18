/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,html}",
  ],
  theme: {
    extend: {
      colors: {
        // Uses CSS variables from design-tokens.css
        primary: {
          50: 'var(--vocab-primary-50)',
          100: 'var(--vocab-primary-100)',
          200: 'var(--vocab-primary-200)',
          300: 'var(--vocab-primary-300)',
          400: 'var(--vocab-primary-400)',
          500: 'var(--vocab-primary-500)',
          600: 'var(--vocab-primary-600)',
          700: 'var(--vocab-primary-700)',
          800: 'var(--vocab-primary-800)',
          900: 'var(--vocab-primary-900)',
        },
        success: {
          50: 'var(--vocab-success-50)',
          100: 'var(--vocab-success-100)',
          200: 'var(--vocab-success-200)',
          300: 'var(--vocab-success-300)',
          400: 'var(--vocab-success-400)',
          500: 'var(--vocab-success-500)',
          600: 'var(--vocab-success-600)',
          700: 'var(--vocab-success-700)',
        },
        streak: {
          50: 'var(--vocab-streak-50)',
          100: 'var(--vocab-streak-100)',
          200: 'var(--vocab-streak-200)',
          300: 'var(--vocab-streak-300)',
          400: 'var(--vocab-streak-400)',
          500: 'var(--vocab-streak-500)',
          600: 'var(--vocab-streak-600)',
        },
        error: {
          50: 'var(--vocab-error-50)',
          100: 'var(--vocab-error-100)',
          200: 'var(--vocab-error-200)',
          300: 'var(--vocab-error-300)',
          400: 'var(--vocab-error-400)',
          500: 'var(--vocab-error-500)',
          600: 'var(--vocab-error-600)',
          700: 'var(--vocab-error-700)',
        },
        warning: {
          50: 'var(--vocab-warning-50)',
          100: 'var(--vocab-warning-100)',
          200: 'var(--vocab-warning-200)',
          500: 'var(--vocab-warning-500)',
          600: 'var(--vocab-warning-600)',
          700: 'var(--vocab-warning-700)',
        },
        gray: {
          50: 'var(--vocab-gray-50)',
          100: 'var(--vocab-gray-100)',
          200: 'var(--vocab-gray-200)',
          300: 'var(--vocab-gray-300)',
          400: 'var(--vocab-gray-400)',
          500: 'var(--vocab-gray-500)',
          600: 'var(--vocab-gray-600)',
          700: 'var(--vocab-gray-700)',
          800: 'var(--vocab-gray-800)',
          900: 'var(--vocab-gray-900)',
        },
        ai: {
          400: 'var(--vocab-ai-400)',
          500: 'var(--vocab-ai-500)',
          600: 'var(--vocab-ai-600)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'flip': 'flip 0.6s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        flip: {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(180deg)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

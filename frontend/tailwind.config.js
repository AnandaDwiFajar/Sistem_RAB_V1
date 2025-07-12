// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            '--tw-prose-body': theme('colors.slate[700]'),
            '--tw-prose-headings': theme('colors.slate[900]'),
            '--tw-prose-lead': theme('colors.slate[600]'),
            '--tw-prose-links': theme('colors.sky[600]'),
            '--tw-prose-bold': theme('colors.slate[900]'),
            '--tw-prose-counters': theme('colors.slate[500]'),
            '--tw-prose-bullets': theme('colors.slate[400]'),
            '--tw-prose-hr': theme('colors.slate[200]'),
            '--tw-prose-quotes': theme('colors.slate[900]'),
            '--tw-prose-quote-borders': theme('colors.slate[200]'),
            '--tw-prose-captions': theme('colors.slate[500]'),
            '--tw-prose-code': theme('colors.sky[700]'),
            '--tw-prose-pre-code': theme('colors.slate[200]'),
            '--tw-prose-pre-bg': theme('colors.slate[800]'),
            '--tw-prose-th-borders': theme('colors.slate[300]'),
            '--tw-prose-td-borders': theme('colors.slate[200]'),
          },
        },
        invert: {
          css: {
            '--tw-prose-body': theme('colors.slate[300]'),
            '--tw-prose-headings': theme('colors.sky[300]'),
            '--tw-prose-lead': theme('colors.slate[400]'),
            '--tw-prose-links': theme('colors.sky[400]'),
            '--tw-prose-bold': theme('colors.slate[100]'),
            '--tw-prose-counters': theme('colors.slate[400]'),
            '--tw-prose-bullets': theme('colors.slate[500]'),
            '--tw-prose-hr': theme('colors.slate[700]'),
            '--tw-prose-quotes': theme('colors.slate[100]'),
            '--tw-prose-quote-borders': theme('colors.slate[600]'),
            '--tw-prose-captions': theme('colors.slate[400]'),
            '--tw-prose-code': theme('colors.sky[300]'),
            '--tw-prose-pre-code': theme('colors.slate[300]'),
            '--tw-prose-pre-bg': theme('colors.slate[900]'),
            '--tw-prose-th-borders': theme('colors.slate[600]'),
            '--tw-prose-td-borders': theme('colors.slate[700]'),
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
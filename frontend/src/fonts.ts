import { Poppins } from 'next/font/google';

// Font configuration with fallbacks
// If Google Fonts is unavailable during build, ensure internet connectivity
// or the build will use fallback fonts defined in globals.css
export const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600'],
  display: 'swap',
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
  preload: true,
  adjustFontFallback: true,
  variable: '--font-poppins',
});

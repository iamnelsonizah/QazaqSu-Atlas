import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import 'maplibre-gl/dist/maplibre-gl.css';
import './globals.css';

const THEME_BOOTSTRAP = `(() => {
  try {
    const preference = localStorage.getItem('kz-water-atlas-theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.dataset.theme = preference === 'dark' || (preference !== 'light' && systemDark) ? 'dark' : 'light';
  } catch {
    document.documentElement.dataset.theme = 'light';
  }
})();`;

export const metadata: Metadata = {
  title: 'QazaqSu Atlas: Kazakhstan Water Atlas',
  description: 'Rivers, dams, lakes, wetlands, groundwater and flood watch for Kazakhstan.',
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="theme-bootstrap" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

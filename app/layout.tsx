// app/layout.tsx
import type { Metadata, Viewport } from 'next';
import './globals.css';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';

export const metadata: Metadata = {
  title: 'Otomater IoT',
  description: 'Control your connected devices',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Otomater IoT',
  },
};

export const viewport: Viewport = {
  themeColor: '#12151A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-panel-bg text-panel-text font-sans antialiased min-h-screen">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}

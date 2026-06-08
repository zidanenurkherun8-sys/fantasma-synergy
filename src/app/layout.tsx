import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Fantasma Synergy: Institutional Crypto Trading Intelligence',
  description: 'Sistem kecerdasan trading cryptocurrency tingkat institusional untuk pasar Indodax (IDR Pairs). Dapatkan analisis premium, grafik real-time, dan manajemen risiko yang disiplin.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full antialiased dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col bg-[#070a13] text-slate-100">
        {children}
      </body>
    </html>
  );
}

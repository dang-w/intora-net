import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import {
  GeistPixelSquare,
  GeistPixelGrid,
  GeistPixelCircle,
  GeistPixelTriangle,
  GeistPixelLine,
} from 'geist/font/pixel';
import ClientGate from '@/components/ClientGate';
import './globals.css';

export const metadata: Metadata = {
  title: 'INT ARCHIVE',
  description: 'Signal catalogue — constrained text-based generative art series',
  metadataBase: new URL('https://intora.net'),
  openGraph: {
    title: 'INT ARCHIVE',
    description: 'Signal catalogue — constrained text-based generative art series',
    siteName: 'INT ARCHIVE · INTORA SYSTEMS',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} ${GeistPixelSquare.variable} ${GeistPixelGrid.variable} ${GeistPixelCircle.variable} ${GeistPixelTriangle.variable} ${GeistPixelLine.variable} font-mono antialiased`}
      >
        <ClientGate>{children}</ClientGate>
      </body>
    </html>
  );
}

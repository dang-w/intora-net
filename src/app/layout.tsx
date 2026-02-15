import type { Metadata } from 'next';
import Script from 'next/script';
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
      <head>
        <Script
          defer
          src="https://cloud.umami.is/script.js"
          data-website-id="e7e9a12b-3c7a-4431-8c68-5d83235cabf0"
          strategy="afterInteractive"
        />
      </head>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} ${GeistPixelSquare.variable} ${GeistPixelGrid.variable} ${GeistPixelCircle.variable} ${GeistPixelTriangle.variable} ${GeistPixelLine.variable} font-mono antialiased`}
      >
        <ClientGate>{children}</ClientGate>
      </body>
    </html>
  );
}

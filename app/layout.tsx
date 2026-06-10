import type { Metadata } from "next";
import { Be_Vietnam_Pro, Plus_Jakarta_Sans, Montserrat } from "next/font/google";
import Script from 'next/script';
import "./globals.css";
import { SITE_URL } from "@/lib/constants";

const beVietnamPro = Be_Vietnam_Pro({
  weight: ['400', '500', '600', '700', '900'],
  subsets: ["vietnamese", "latin"],
  variable: "--font-be-vietnam",
  display: 'swap',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  weight: ['300', '400', '500', '600', '700', '800'],
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: 'swap',
});

const montserrat = Montserrat({
  weight: ['700', '800', '900'],
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "VinFast Xanh Mekong",
  description: "Đại lý ôtô điện VinFast chính hãng hàng đầu tại khu vực.",
  icons: {
    icon: "/logo-vinfast.svg",
    shortcut: "/logo-vinfast.svg",
    apple: "/logo-vinfast.svg",
  },
  openGraph: {
    title: "VinFast Xanh Mekong",
    description: "Đại lý ôtô điện VinFast chính hãng hàng đầu tại khu vực.",
    url: '/',
    siteName: 'VinFast Xanh Mekong',
    images: [
      {
        url: '/logo-vinfast.jpg', // Path will be resolved against metadataBase
        width: 1200,
        height: 630,
        alt: 'VinFast Xanh Mekong Thumbnail',
      },
    ],
    locale: 'vi_VN',
    type: 'website',
  },
  verification: {
    google: 'xq7mFYLB5sbbVJ0mP-CHMatuBLyg5gtPN...',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (process.env.NODE_ENV === 'development') {
    console.log('GA4 Loaded');
  }

  return (
    <html lang="vi" className="scroll-smooth">
      <body
        className={`${beVietnamPro.variable} ${plusJakartaSans.variable} ${montserrat.variable} font-sans antialiased bg-vinfast-gray text-gray-900`}
      >
        {children}
      </body>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=G-GDR0TD5D1X`}
        strategy="lazyOnload"
      />
      <Script id="google-analytics" strategy="lazyOnload">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-GDR0TD5D1X');
        `}
      </Script>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Inter, Manrope, Noto_Sans } from "next/font/google";
import { Suspense, type ReactNode } from "react";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Header, BottomTab } from "@/components/Header";
import { Modal } from "@/components/Modal";
import { Toast } from "@/components/Toast";
import { CmdPalette } from "@/components/CmdPalette";
import { PlacePicker } from "@/components/PlacePicker";
import { Lightbox } from "@/components/property/Lightbox";
import { VideoModal } from "@/components/property/VideoModal";
import { FooterShell } from "@/components/FooterShell";
import { FloatingAIChat } from "@/components/FloatingAIChat";
import { BrandLogoSymbol } from "@/components/BrandLogo";
import { JsonLd } from "@/components/JsonLd";
import { QueryProvider } from "@/presentation/providers/QueryProvider";
import { ListingsBootstrap } from "@/components/ListingsBootstrap";
import { AuthSync } from "@/components/AuthSync";
import { cn } from "@/lib/utils";

const SITE_URL = "https://hdlh.vercel.app";

// Site-wide identity for the Knowledge Graph + sitelinks search box.
const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "NEOMAP",
  url: SITE_URL,
  logo: `${SITE_URL}/images/logo/mark-dark.jpg`,
  description:
    "Улаанбаатарын орон сууц, төсөл, түрээсийг газрын зураг, AI зөвлөмж, баталгаатай мэдээллээр хайх платформ.",
  areaServed: { "@type": "City", name: "Улаанбаатар" },
};

const siteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "NEOMAP",
  url: SITE_URL,
  inLanguage: "mn-MN",
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/results?q={search_term_string}` },
    "query-input": "required name=search_term_string",
  },
};

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["600", "700", "800"],
  variable: "--font-heading",
  display: "swap",
});

const notoSans = Noto_Sans({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://hdlh.vercel.app"),
  title: "NEOMAP — Үл хөдлөхийн ухаалаг хайлт",
  description:
    "УБ-ын орон сууц, төсөл, түрээсийг газрын зураг, AI зөвлөмж, баталгаатай мэдээллээр хурдан олоорой.",
  applicationName: "NEOMAP",
  alternates: { canonical: "/" },
  icons: {
    icon: "/images/logo/mark-dark.jpg",
    shortcut: "/images/logo/mark-dark.jpg",
    apple: "/images/logo/mark-dark.jpg",
  },
  openGraph: {
    type: "website",
    locale: "mn_MN",
    url: "https://hdlh.vercel.app/",
    siteName: "NEOMAP",
    title: "NEOMAP — Үл хөдлөхийн ухаалаг хайлт",
    description:
      "УБ-ын орон сууц, төсөл, түрээсийг газрын зураг, AI зөвлөмж, баталгаатай мэдээллээр хурдан олоорой.",
    images: [
      {
        url: "/images/og-1200x630.png",
        width: 1200,
        height: 630,
        alt: "NEOMAP үл хөдлөхийн ухаалаг хайлт",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NEOMAP — Үл хөдлөхийн ухаалаг хайлт",
    description:
      "УБ-ын орон сууц, төсөл, түрээсийг газрын зураг, AI зөвлөмж, баталгаатай мэдээллээр хурдан олоорой.",
    images: ["/images/og-1200x630.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#07111F",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="mn"
      suppressHydrationWarning
      className={cn(inter.variable, manrope.variable, notoSans.variable)}
    >
      <body className="font-sans">
        <JsonLd data={orgJsonLd} />
        <JsonLd data={siteJsonLd} />
        <QueryProvider>
        <ListingsBootstrap />
        <AuthSync />
        <ThemeProvider>
          <BrandLogoSymbol />
          <Suspense fallback={null}>
            <Header />
          </Suspense>
          <main id="app-root">{children}</main>
          <FooterShell />
          <Suspense fallback={null}>
            <BottomTab />
          </Suspense>
          <Modal />
          <Toast />
          <CmdPalette />
          <PlacePicker />
          <Lightbox />
          <VideoModal />
          <FloatingAIChat />
        </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}


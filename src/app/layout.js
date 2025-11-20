import { Poppins, Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import ChatBotWrapper from "@/components/ChatBotWrapper";
import AppShell from "@/components/Navigation/AppShell";
import CookieConsentBanner from "@/components/CookieConsent/CookieConsentBanner";
import CrisisBanner from "@/components/CrisisBanner/CrisisBanner";
import { createMetadata } from '@/utils/seoUtils';
import { Analytics } from "@vercel/analytics/next"

// Load Inter for body text (sans-serif - modern, clean, startup favorite)
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

// Load Poppins for headings (sans-serif - contemporary, geometric, vibrant)
const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata = createMetadata({
  title: "Daily Reflections - AA Literature",
  description: "Daily recovery reflections from Alcoholics Anonymous literature with community discussion. Access daily readings, share insights, and explore recovery resources with our interactive platform.",
  path: '/',
  keywords: [
    'AA literature',
    'Alcoholics Anonymous',
    'daily reflections',
    'recovery',
    'sobriety',
    '12 steps',
    'recovery resources',
    'daily meditation',
    'recovery community'
  ],
});

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${poppins.variable} no-sidebar-gap`}>
        <Providers>
          <AppShell>
            {children}
          </AppShell>
          <ChatBotWrapper />
          <CookieConsentBanner />
          <CrisisBanner />
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}

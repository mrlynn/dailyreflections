import { Poppins, Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import ChatBotWrapper from "@/components/ChatBotWrapper";

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

export const metadata = {
  title: "Daily Reflections - AA Literature",
  description: "Daily recovery reflections from Alcoholics Anonymous literature with community discussion",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${poppins.variable}`}>
        <Providers>
          {children}
          <ChatBotWrapper />
        </Providers>
      </body>
    </html>
  );
}

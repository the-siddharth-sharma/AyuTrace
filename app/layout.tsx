import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/auth-context";
import { SWRProvider } from "@/components/providers/swr-provider";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AyuTrace — Every Dose Deserves Care.",
  description:
    "Intelligent medicine tracking, lot traceability & statutory expiry compliance for healthcare facilities, powered by Google Gemma 4.",
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: "/apple-icon.png",
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${jetbrainsMono.variable}`}
    >
      <body
        className={`${plusJakartaSans.className} min-h-screen bg-slate-50/70 font-sans text-slate-900 antialiased selection:bg-teal-100 selection:text-teal-900`}
      >
        <SWRProvider>
          <AuthProvider>{children}</AuthProvider>
        </SWRProvider>
      </body>
    </html>
  );
}

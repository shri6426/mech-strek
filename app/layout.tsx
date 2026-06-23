import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CustomCursor from "@/components/ui/CustomCursor";
import LoadingScreen from "@/components/ui/LoadingScreen";
import ScrollProgressBar from "@/components/ui/ScrollProgressBar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mech Strek — Premium Web Design & Development Agency",
  description:
    "We build premium websites that impress customers, grow your business, and convert visitors into paying clients. Expert web design, development, and digital experiences.",
  keywords:
    "web design, web development, premium websites, React, Next.js, agency, Mech Strek, UI UX design",
  authors: [{ name: "Mech Strek" }],
  creator: "Mech Strek",
  openGraph: {
    title: "Mech Strek — Premium Web Design & Development Agency",
    description:
      "We build premium websites that impress customers, grow your business, and convert visitors into paying clients.",
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mech Strek — Premium Web Design & Development Agency",
    description: "Premium websites designed to grow your business.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body className="bg-background text-white antialiased overflow-x-hidden">
        <LoadingScreen />
        <CustomCursor />
        <ScrollProgressBar />
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}

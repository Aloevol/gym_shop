"use client"

// import type { Metadata } from "next";
import type { CSSProperties } from "react";
import TopBar from "@/components/layout/TopBar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {useEffect} from "react";

const mainFontVariables = {
  "--font-geist-sans": "ui-sans-serif, system-ui, sans-serif",
  "--font-geist-mono": "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
} as CSSProperties;

// export const metadata: Metadata = {
//   title: "Gym Shop",
//   description: "Gym Shop",
// };

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    // Remove extension-added attributes on client side
    useEffect(() => {
        // Remove attributes that cause hydration mismatch
        document.body.removeAttribute('cz-shortcut-listen');
        document.body.removeAttribute('data-new-gr-c-s-check-loaded');
        document.body.removeAttribute('data-gr-ext-installed');
    }, []);

    return (
        <html lang="en" suppressHydrationWarning>
        <body
            className="antialiased"
            style={mainFontVariables}
            suppressHydrationWarning
        >
            <TopBar />
            <Navbar />
            <main className="w-full h-full">{children}</main>
            <Footer />
        </body>
        </html>
    );
}

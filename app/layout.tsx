import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { Toaster } from "sonner";
import connectToDB from "@/server/db";
import { SiteModle } from "@/server/models/site/site.model";
import "./globals.css";

const appFontVariables = {
    "--font-geist-sans": "ui-sans-serif, system-ui, sans-serif",
    "--font-geist-mono": "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
} as CSSProperties;

export async function generateMetadata(): Promise<Metadata> {
    try {
        await connectToDB();
        const site = await SiteModle.findOne({}).lean().exec();

        const siteName = site?.siteName?.trim() || "Thryve";
        const siteDescription =
            site?.siteDescription?.trim() ||
            `${siteName} — premium fitness equipment, supplements, and personal training programs.`;
        const logoUrl = site?.logoUrl || "/NavLogo.png";
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

        return {
            metadataBase: new URL(baseUrl),
            title: {
                default: siteName,
                template: `%s | ${siteName}`,
            },
            description: siteDescription,
            openGraph: {
                siteName,
                title: siteName,
                description: siteDescription,
                images: [{ url: logoUrl }],
                type: "website",
            },
            twitter: {
                card: "summary_large_image",
                title: siteName,
                description: siteDescription,
                images: [logoUrl],
            },
        };
    } catch {
        return {
            title: { default: "Thryve", template: "%s | Thryve" },
            description: "Premium fitness equipment, supplements, and personal training programs.",
        };
    }
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className="antialiased bg-black" style={appFontVariables} suppressHydrationWarning>
                {children}
                <Toaster position="top-right" expand richColors closeButton />
            </body>
        </html>
    );
}

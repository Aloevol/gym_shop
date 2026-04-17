import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { Toaster } from 'sonner';
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

    const siteName = site?.siteName?.trim() || "Gym Shop";
    const siteDescription =
      site?.siteDescription?.trim() ||
      `Shop ${siteName} with dashboard-managed branding, contact details, and storefront content.`;
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
        title: siteName,
        description: siteDescription,
        images: [{ url: logoUrl }],
      },
      twitter: {
        card: "summary",
        title: siteName,
        description: siteDescription,
        images: [logoUrl],
      },
    };
  } catch {
    return {
      title: "Gym Shop",
      description: "Gym Shop",
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
      <body
        className="antialiased"
        style={appFontVariables}
      >
        <main className="bg-[#F27D31]">
          {children}
        </main>
        {/* Just test */}
        <Toaster
            position="top-right"
            expand={true}
            richColors
            closeButton
        />
      </body>
    </html>
  );
}

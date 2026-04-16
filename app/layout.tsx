import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from 'sonner';
import connectToDB from "@/server/db";
import { SiteModle } from "@/server/models/site/site.model";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  try {
    await connectToDB();
    const site = await SiteModle.findOne({}).lean().exec();

    const siteName = site?.siteName?.trim() || "Gym Shop";
    const siteDescription =
      site?.siteDescription?.trim() ||
      `Shop ${siteName} with dashboard-managed branding, contact details, and storefront content.`;
    const logoUrl = site?.logoUrl || "/NavLogo.png";

    return {
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
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

import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { Toaster } from 'sonner';

const adminFontVariables = {
  "--font-geist-sans": "ui-sans-serif, system-ui, sans-serif",
  "--font-geist-mono": "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
} as CSSProperties;

export const metadata: Metadata = {
  title: "Gym Shop Dashboard",
  description: "Gym Shop Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="antialiased"
        style={adminFontVariables}
        suppressHydrationWarning
      >
        <main className="bg-[#F27D31] w-full h-svh">
          {children}
        </main>
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

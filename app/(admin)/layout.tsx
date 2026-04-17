import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Gym Shop Dashboard",
    description: "Gym Shop Admin Dashboard — manage products, orders, and site content.",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

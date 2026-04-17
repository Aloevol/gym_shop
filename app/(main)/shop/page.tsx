import type { Metadata } from "next";
import { Suspense } from "react";
import ShopContent from "./_components/ShopContent";

export const metadata: Metadata = {
    title: "Shop",
    description: "Browse premium fitness equipment, supplements, and training gear. Filter by category, price, and availability.",
    openGraph: {
        title: "Shop",
        description: "Browse premium fitness equipment, supplements, and training gear.",
        type: "website",
    },
};

export default function ShopPage() {
    return (
        <Suspense
            fallback={
                <div className="w-full min-h-screen bg-black flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            }
        >
            <ShopContent />
        </Suspense>
    );
}

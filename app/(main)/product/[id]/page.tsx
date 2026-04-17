import type { Metadata } from "next";
import { Suspense } from "react";
import { getAProductsServerSide } from "@/server/functions/product.fun";
import ProductContent from "./_components/ProductContent";
import Loader from "@/components/loader/Loader";

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    try {
        const { id } = await params;
        const response = await getAProductsServerSide(id);
        if (!response.isError && response.data) {
            const product = response.data as any;
            return {
                title: product.title,
                description:
                    product.description ||
                    `Buy ${product.title} — ${product.category} from Thryve fitness shop.`,
                openGraph: {
                    title: product.title,
                    description: product.description || `Buy ${product.title} from Thryve.`,
                    images: product.images?.[0] ? [{ url: product.images[0] }] : [],
                    type: "website",
                },
            };
        }
    } catch {}
    return {
        title: "Product",
        description: "View product details on Thryve fitness shop.",
    };
}

export default function ProductPage() {
    return (
        <Suspense fallback={<Loader />}>
            <ProductContent />
        </Suspense>
    );
}

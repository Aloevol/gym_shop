import TopBar from "@/components/layout/TopBar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HydrationFix from "@/components/layout/HydrationFix";
import WhatsAppButton from "@/components/layout/WhatsAppButton";

export default function MainLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <HydrationFix />
            <TopBar />
            <Navbar />
            <main className="w-full">{children}</main>
            <WhatsAppButton />
            <Footer />
        </>
    );
}

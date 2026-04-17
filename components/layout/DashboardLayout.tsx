"use client";
import { lazy, useEffect, useMemo, useState, Suspense } from "react";
import Navbar from "../bar/Navbar";
import Sidebar from "../bar/Sidebar";
import BannerManagement from "../tabs/BannerMessage";
import Loader from "../loader/Loader";
import OrderManagement from "@/components/tabs/Order";
import HeroSliderAdmin from "../section/HeroSliderAdmin";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const OverviewTab = lazy(() => import("../tabs/Overview"));
const Products = lazy(() => import("../tabs/Products"));
const UserTab = lazy(() => import("../tabs/User"));
const PrivacyPolicy = lazy(() => import("../tabs/PrivacyPolicy"));
const Contact = lazy(() => import("../tabs/Contact"));

const Features = lazy(() => import("../tabs/Features"));
const Testimonials = lazy(() => import("../tabs/Testimonials"));
const InstagramTab = lazy(() => import("../tabs/Instagram"));

const Settings = lazy(() => import("../tabs/Settings"));

const VALID_TABS = [
    "Overview",
    "Hero",
    "Products",
    "Banner Message",
    "Features",
    "Testimonials",
    "Instagram",
    "Contact",
    "User",
    "Order Management",
    "PrivacyPolicy",
    "Settings",
] as const;

type DashboardTab = (typeof VALID_TABS)[number];

function parseTabParam(tabParam: string | null): DashboardTab {
    const decodedTab = tabParam ? decodeURIComponent(tabParam) : "Overview";
    return (VALID_TABS as readonly string[]).includes(decodedTab) ? (decodedTab as DashboardTab) : "Overview";
}

export default function DashboardLayout() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const urlTab = useMemo(() => parseTabParam(searchParams.get("tab")), [searchParams]);
    const [activeTab, setActiveTab] = useState<DashboardTab>(urlTab);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        setActiveTab(urlTab);
    }, [urlTab]);

    const handleTabChange = (tab: string) => {
        const normalizedTab = parseTabParam(tab);
        setActiveTab(normalizedTab);

        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", normalizedTab);
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case "Overview": return <OverviewTab />;
            case "Hero": return <HeroSliderAdmin />;
            case "Products": return <Products />;
            case "Banner Message": return <BannerManagement />;
            case "Features": return <Features />;
            case "Testimonials": return <Testimonials />;
            case "Instagram": return <InstagramTab />;
            case "Contact": return <Contact />;
            case "User": return <UserTab />;
            case "Order Management": return <OrderManagement />;
            case "PrivacyPolicy": return <PrivacyPolicy />;
            case "Settings": return <Settings />;
            default: return <h1>Not Found</h1>;
        }
    };

    return (
        <main className={"w-full h-screen bg-black overflow-hidden flex flex-col"}>
            <Navbar onToggleSidebar={() => setSidebarOpen(prev => !prev)} />
            <div className={"w-full flex-1 flex overflow-hidden"}>
                <Sidebar
                    activeTab={activeTab}
                    setActiveTab={handleTabChange}
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                />
                <div className={"flex-1 h-full overflow-auto custom-scrollbar p-4 md:p-8 bg-black"}>
                    <Suspense fallback={<Loader overlay size="md" key={Math.random()} message="SYNCING CONSOLE..." />}>
                        <div className="animate-in fade-in duration-700">
                            {renderTabContent()}
                        </div>
                    </Suspense>
                </div>
            </div>
        </main>
    );
}

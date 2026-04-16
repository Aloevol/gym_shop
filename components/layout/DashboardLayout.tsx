"use client";
import { lazy, useState, Suspense } from "react";
import Navbar from "../bar/Navbar";
import Sidebar from "../bar/Sidebar";
import BannerManagement from "../tabs/BannerMessage";
import NavbarManagement from "../tabs/NavbarManagement";
import Loader from "../loader/Loader";
import OrderManagement from "@/components/tabs/Order";
import HeroSliderAdmin from "../section/HeroSliderAdmin";

const OverviewTab = lazy(() => import("../tabs/Overview"));
const Products = lazy(() => import("../tabs/Products"));
const UserTab = lazy(() => import("../tabs/User"));
const PrivacyPolicy = lazy(() => import("../tabs/PrivacyPolicy"));
const Contact = lazy(() => import("../tabs/Contact"));

const Features = lazy(() => import("../tabs/Features"));
const Testimonials = lazy(() => import("../tabs/Testimonials"));
const Athletes = lazy(() => import("../tabs/Athletes"));

const Settings = lazy(() => import("../tabs/Settings"));

export default function DashboardLayout() {
    const [activeTab, setActiveTab] = useState<string>("Overview");

    const renderTabContent = () => {
        switch (activeTab) {
            case "Overview": return <OverviewTab />;
            case "Hero": return <HeroSliderAdmin />;
            case "Products": return <Products />;
            case "Banner Message": return <BannerManagement />;
            case "Navbar": return <NavbarManagement />;
            case "Features": return <Features />;
            case "Testimonials": return <Testimonials />;
            case "Athletes": return <Athletes />;
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
            <Navbar />
            <div className={"w-full flex-1 flex overflow-hidden"}>
                <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
                <div className={"flex-1 h-full overflow-auto custom-scrollbar p-8 bg-black"}>
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

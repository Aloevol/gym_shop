"use client";
import { Contact2, Instagram, LayoutTemplate, MessageCircle, Settings2, ShoppingBag, User, X } from "lucide-react";
import { FcPrivacy } from "react-icons/fc";
import { GrDashboard } from "react-icons/gr";
import { PiFlagBanner } from "react-icons/pi";
import type { ComponentType, SVGProps } from "react";
import { useMemo } from "react";
import {FaJediOrder} from "react-icons/fa";

interface Props {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    isOpen: boolean;
    onClose: () => void;
}

interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
  className?: string;
}

const createIconComponent = (IconComponent: ComponentType<IconProps>, size = 18) => (
    <IconComponent size={size} />
);

export default function Sidebar({ activeTab, setActiveTab, isOpen, onClose }: Props) {
    const tabs = useMemo(() => [
        { title: "Overview", icon: () => createIconComponent(GrDashboard) },
        { title: "Hero", icon: () => createIconComponent(PiFlagBanner) },
        { title: "Products", icon: () => createIconComponent(ShoppingBag) },
        { title: "Banner Message", icon: () => createIconComponent(MessageCircle) },
        { title: "Features", icon: () => createIconComponent(LayoutTemplate) },
        { title: "Testimonials", icon: () => createIconComponent(MessageCircle) },
        { title: "Instagram", icon: () => createIconComponent(Instagram) },
        { title: "PrivacyPolicy", icon: () => createIconComponent(FcPrivacy) },
        { title: "Contact", icon: () => createIconComponent(Contact2) },
        { title: "User", icon: () => createIconComponent(User) },
        { title: "Order Management", icon: () => createIconComponent(FaJediOrder) },
        { title: "Settings", icon: () => createIconComponent(Settings2) },
    ], []);

    return (
        <>
            {/* Mobile overlay backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar — fixed drawer on mobile, static flex child on desktop */}
            <div className={`
                fixed top-[80px] left-0 h-[calc(100vh-80px)] z-50
                lg:static lg:top-auto lg:left-auto lg:h-full lg:z-auto
                w-[288px] lg:w-[308px] shrink-0 px-3 py-4
                bg-black border-r border-white/5
                transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="h-full w-full bg-gradient-to-b from-white/8 to-white/[0.03] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/20">
                    <div className="flex h-full flex-col px-0 py-6">
                        <div className="px-8 pb-5 flex items-center justify-between">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/25">
                                Dashboard
                            </p>
                            <button
                                onClick={onClose}
                                className="lg:hidden p-1 text-white/40 hover:text-white transition-colors"
                                aria-label="Close menu"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <div className="w-full flex-1 overflow-y-auto custom-scrollbar pr-1 pb-4 pl-3">
                            {tabs.map((Item) => (
                                <button
                                    key={Item.title}
                                    onClick={() => { setActiveTab(Item.title); onClose(); }}
                                    className={`h-[54px] w-[92%] rounded-l-full flex justify-start items-center gap-4 pl-8 pr-4 cursor-pointer duration-300 ease-in-out mb-2 ${
                                        Item.title === activeTab
                                            ? 'text-black bg-primary font-black shadow-lg shadow-primary/20'
                                            : 'text-white/60 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    <span className={Item.title === activeTab ? 'text-black' : 'text-primary'}>
                                        <Item.icon />
                                    </span>
                                    <span className="text-[11px] font-bold uppercase tracking-widest">{Item.title}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

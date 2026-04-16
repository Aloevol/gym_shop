"use client";
import { Contact2, LayoutTemplate, Menu, MessageCircle, Settings2, ShieldCheck, ShoppingBag, User, Users } from "lucide-react";
import { FcPrivacy } from "react-icons/fc";
import { GrDashboard } from "react-icons/gr";
import { PiFlagBanner } from "react-icons/pi";
import type { ComponentType, SVGProps } from "react";
import { useMemo } from "react";
import {FaJediOrder} from "react-icons/fa";

interface Props {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
  className?: string;
}

const createIconComponent = (IconComponent: ComponentType<IconProps>, size = 18) => (
    <IconComponent size={size} />
);

export default function Sidebar({ activeTab, setActiveTab }: Props) {
    const tabs = useMemo(() => [
        {
            title: "Overview",
            icon: () => createIconComponent(GrDashboard)
        },
        {
            title: "Hero",
            icon: () => createIconComponent(PiFlagBanner)
        },
        {
            title: "Products",
            icon: () => createIconComponent(ShoppingBag)
        },
        {
            title: "Banner Message",
            icon: () => createIconComponent(MessageCircle)
        },
        {
            title: "Navbar",
            icon: () => createIconComponent(Menu)
        },
        {
            title: "Features",
            icon: () => createIconComponent(LayoutTemplate)
        },
        {
            title: "Testimonials",
            icon: () => createIconComponent(MessageCircle)
        },
        {
            title: "Athletes",
            icon: () => createIconComponent(Users)
        },
        {
            title: "PrivacyPolicy",
            icon: () => createIconComponent(FcPrivacy)
        },
        {
            title: "Contact",
            icon: () => createIconComponent(Contact2)
        },
        {
            title: "User",
            icon: () => createIconComponent(User)
        },
        {
            title: "Order Management",
            icon: () => createIconComponent(FaJediOrder)
        },
        {
            title: "Settings",
            icon: () => createIconComponent(Settings2)
        }
    ], []);

    return (
        <div className="w-[280px] md:w-[300px] h-full shrink-0 flex justify-center items-center relative bg-black border-r border-white/5">
            <div className="w-[92%] h-[95%] bg-gradient-to-b from-white/8 to-white/[0.03] border border-white/10 rounded-[2.5rem] relative flex flex-col items-end pt-[32px] overflow-hidden shadow-2xl shadow-black/20">
                <div className="w-full px-8 mb-8">
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Storefront Console</p>
                    <div className="mt-4 rounded-2xl border border-primary/15 bg-primary/8 px-4 py-3">
                        <div className="flex items-center gap-3">
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-black">
                                {createIconComponent(ShieldCheck, 18)}
                            </span>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">Public Site</p>
                                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">Only active storefront controls</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="w-full overflow-y-auto custom-scrollbar pr-1">
                    {tabs.map((Item) => (
                        <button
                            key={Item.title}
                            onClick={() => setActiveTab(Item.title)}
                            className={`h-[52px] w-[92%] rounded-l-full flex justify-start items-center gap-4 pl-8 cursor-pointer duration-300 ease-in-out mb-1 ${
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
    );
}

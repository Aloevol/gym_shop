"use client";
import { Contact2, Menu, MessageCircle, Package2, User } from "lucide-react";
import { BiSolidOffer } from "react-icons/bi";
import { FcPrivacy } from "react-icons/fc";
import { GrDashboard } from "react-icons/gr";
import { MdProductionQuantityLimits } from "react-icons/md";
import { PiFlagBanner } from "react-icons/pi";
import { TbBrandBing } from "react-icons/tb";
import { SVGProps, useMemo } from "react";
import {AiFillProfile} from "react-icons/ai";
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

const createIconComponent = (IconComponent: React.ComponentType<IconProps>, size = 18) => (
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
            title: "Offer",
            icon: () => createIconComponent(BiSolidOffer)
        },
        {
            title: "Products",
            icon: () => createIconComponent(MdProductionQuantityLimits)
        },
        {
            title: "Personal Training",
            icon: () => createIconComponent(TbBrandBing)
        },
        {
            title: "Package Management",
            icon: () => createIconComponent(Package2)
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
            icon: () => createIconComponent(MdProductionQuantityLimits)
        },
        {
            title: "Testimonials",
            icon: () => createIconComponent(MessageCircle)
        },
        {
            title: "Instagram",
            icon: () => createIconComponent(BiSolidOffer)
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
            title: "About Me",
            icon: () => createIconComponent(AiFillProfile)
        },
        {
            title: "Order Management",
            icon: () => createIconComponent(FaJediOrder)
        },
        {
            title: "Settings",
            icon: () => createIconComponent(AiFillProfile)
        }
    ], []);

    return (
        <div className="w-[350px] h-full flex justify-center items-center relative bg-black border-r border-white/5">
            <div className="w-[280px] h-[95%] bg-white/5 border border-white/10 rounded-[2.5rem] relative flex flex-col items-end pt-[32px] overflow-hidden">
                <div className="w-full px-8 mb-8">
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Console</p>
                </div>
                <div className="w-full overflow-y-auto custom-scrollbar pr-1">
                    {tabs.map((Item) => (
                        <button
                            key={Item.title}
                            onClick={() => setActiveTab(Item.title)}
                            className={`h-[50px] w-[92%] rounded-l-full flex justify-start items-center gap-4 pl-8 cursor-pointer duration-300 ease-in-out mb-1 ${
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
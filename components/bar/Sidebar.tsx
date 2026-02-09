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
        }
    ], []);

    return (
        <div className="w-[400px] h-full flex justify-center items-center relative">
            <div className="w-[230px] md:w-[260px] xl:w-[300px] h-[95%] bg-white rounded-3xl relative flex flex-col items-end pt-[16px]">
                {tabs.map((Item) => (
                    <button
                        key={Item.title}
                        onClick={() => setActiveTab(Item.title)}
                        className={`h-[50px] w-[95%] rounded-bl-full rounded-tl-full flex justify-start items-center gap-2 pl-4 cursor-pointer duration-200 ease-in-out ${
                            Item.title === activeTab 
                                ? 'text-white bg-[#125BAC]' 
                                : 'text-[#125BAC] hover:bg-blue-50'
                        }`}
                    >
                        <Item.icon />
                        <span className="font-bold text-sm">{Item.title}</span>
                    </button>
                ))}
            </div>
            {/* Logout button */}
            {/*<button className="absolute cursor-pointer bottom-9 left-9 text-[#125BAC] flex gap-2 items-center hover:text-blue-700 duration-200">*/}
            {/*    <LogOut size={18} />*/}
            {/*    <span className="font-medium">Logout</span>*/}
            {/*</button>*/}
        </div>
    );
}
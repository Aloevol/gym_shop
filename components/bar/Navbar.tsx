import { User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function Navbar () {

    return (
        <nav className={"w-full h-[80px] border-b border-white/10 bg-black text-white"}>
            <div className={"w-full h-full px-6 mx-auto flex justify-between items-center"}>
                <div className={"w-[248px] h-[64px] flex justify-center items-center"}>
                    <Link href="/">
                        <Image
                            src="/NavLogo.png"
                            alt="GymShop Logo"
                            width={120}
                            height={40}
                            priority
                            loading="eager"
                            className="h-10 w-auto object-contain"
                            style={{ height: "auto" }}
                        />
                    </Link>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden md:block text-right">
                        <p className="text-xs font-black text-white uppercase tracking-widest">Admin Control</p>
                        <p className="text-[10px] text-primary font-bold uppercase tracking-[0.2em]">Live Performance</p>
                    </div>
                    <div className="p-2 border border-white/10 rounded-full bg-white/5 cursor-pointer hover:border-primary transition-all">
                        <User className="text-primary" size={24} />
                    </div>
                </div>
            </div>
        </nav>
    )
}

import { User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function Navbar () {

    return (
        <nav className={"w-full h-[80px] border-b border-black bg-white"}>
            <div className={"w-full h-full px-6 mx-auto flex justify-between items-center"}>
                <div className={"w-[248px] h-[64px] flex justify-center items-center"}>
                    {/* <ImageWithSkeleton src={Logo} /> */}
                    <Link href="/">
                        <Image
                            src="/NavLogo.png"
                            alt="GymShop Logo"
                            width={120}       // adjust size
                            height={40}       // adjust size
                            className="object-contain"
                        />
                    </Link>
                </div>
                <div>
                    <div className="p-2 border rounded-full bg-blue-100 cursor-pointer">
                        <User className="text-[#125BAC]" size={30} />
                    </div>
                </div>
            </div>
        </nav>
    )
}
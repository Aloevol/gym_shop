"use client";
import Link from "next/link";
import React from "react";
import { FaFacebookF, FaLinkedinIn, FaTwitter, FaTiktok } from "react-icons/fa";
import Image from "next/image";
// import { FaXTwitter } from "react-icons/fa6";

const Footer = () => {
  return (
    <footer className="bg-[#222222] text-white px-6 md:px-20 py-12">
      {/* Header */}
      <h2 className="text-2xl md:text-3xl font-bold md:text-left mb-6 flex flex-col justify-center items-center">
        <span>Learn how to grow audience</span> <span>fast in Gym Website</span>
      </h2>

      <div className="border-b border-gray-500 mb-8" />

      {/* Main content */}
      <div className="flex flex-col lg:flex-row gap-10">
        {/* Left side */}
        <div className="lg:w-1/2 flex flex-col gap-4">
          {/* Logo */}
          <Link href="/">
            <Image
                src="/NavLogo.png"
                alt="GymShop Logo"
                width={120}       // adjust size
                height={40}       // adjust size
                className="object-contain"
            />
          </Link>
          <p className="text-gray-300">
            At Jhoori, we’re committed to transforming outdoor spaces across
            Northern Illinois and Southern Wisconsin. From lawn care to
            hardscaping, we deliver top-quality services that bring your
            landscaping vision to life.
          </p>
          <div className="flex gap-3 mt-2">
            <a
              href="#"
              className="border border-gray-400 p-2 rounded-full hover:bg-[#F27D31] hover:border-[#F27D31] transition"
            >
              <FaFacebookF />
            </a>
            <a
              href="#"
              className="border border-gray-400 p-2 rounded-full hover:bg-[#F27D31] hover:border-[#F27D31] transition"
            >
              <FaLinkedinIn />
            </a>
            <a
              href="#"
              className="border border-gray-400 p-2 rounded-full hover:bg-[#F27D31] hover:border-[#F27D31] transition"
            >
              <FaTwitter />
            </a>
            <a
              href="#"
              className="border border-gray-400 p-2 rounded-full hover:bg-[#F27D31] hover:border-[#F27D31] transition"
            >
              <FaTiktok />
            </a>
          </div>
        </div>

        {/* Right side */}
        <div className="lg:w-1/2 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Column 1: Quick Links */}
          <div>
            <h4 className="font-semibold mb-3 text-[#F27D31]">Quick Links</h4>
            <ul className="text-gray-300 space-y-2">
              <li><Link href="#" className="hover:text-[#F27D31] transition">Map</Link></li>
              <li><Link href="#" className="hover:text-[#F27D31] transition">Business Hours</Link></li>
              <li><Link href="#" className="hover:text-[#F27D31] transition">Customer Support</Link></li>
              <li><Link href="#" className="hover:text-[#F27D31] transition">Terms & Conditions</Link></li>
            </ul>
            <p className="mt-2 text-gray-400 text-sm">We are open 24/7</p>
          </div>

          {/* Column 2: Contact */}
          <div>
            <h4 className="font-semibold mb-3 text-[#F27D31]">Contact Info</h4>
            <ul className="text-gray-300 space-y-2 text-sm">
              <li>Phone: 980-290-293-493</li>
              <li>Email: indks@kdsl.cosd</li>
              <li>Address: Northern Illinois / Southern Wisconsin</li>
            </ul>
          </div>

          {/* Column 3: Extra */}
          <div>
            <h4 className="font-semibold mb-3 text-[#F27D31]">Support</h4>
            <ul className="text-gray-300 space-y-2 text-sm">
              <li><Link href="#" className="hover:text-[#F27D31] transition">FAQ</Link></li>
              <li><Link href="#" className="hover:text-[#F27D31] transition">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-[#F27D31] transition">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <p className="mt-8 text-gray-500 text-sm text-center lg:text-left">
        &copy; {new Date().getFullYear()} GymShop. All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;

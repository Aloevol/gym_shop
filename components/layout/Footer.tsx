"use client";
import Link from "next/link";
import React from "react";
import { FaFacebookF, FaInstagram } from "react-icons/fa";
import Image from "next/image";

const Footer = () => {
  return (
    <footer className="bg-black text-white py-12 px-6 flex flex-col items-center border-t border-white/5">
      {/* Logo */}
      <div className="mb-8">
        <Link href="/">
          <Image
            src="/NavLogo.png"
            alt="Logo"
            width={120}
            height={40}
            className="h-8 md:h-10 w-auto object-contain"
          />
        </Link>
      </div>

      {/* Social Links */}
      <div className="flex gap-6 mb-8">
        <a
          href="https://www.instagram.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-black transition-all"
        >
          <FaInstagram size={20} />
        </a>
        <a
          href="https://www.facebook.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-black transition-all"
        >
          <FaFacebookF size={20} />
        </a>
      </div>

      {/* Copyright */}
      <p className="text-white/40 text-xs font-medium tracking-widest uppercase">
        &copy; {new Date().getFullYear()} GYMSHOP. ALL RIGHTS RESERVED.
      </p>
    </footer>
  );
};

export default Footer;

"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ShoppingCart, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { countCurrentCartLength } from "@/server/functions/cart.fun";
import { getCookie } from "@/server/helper/jwt.helper";
import { IUser } from "@/server/models/user/user.interfce";
import { getNavLinksServerSide, getSiteSettingsServerSide } from "@/server/functions/admin.fun";
import { DEFAULT_STOREFRONT_NAV_LINKS, filterStorefrontNavLinks } from "@/lib/storefront";

interface NavLink {
  _id?: string;
  name: string;
  href: string;
  isActive?: boolean;
}

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [cartCount, setCartCount] = useState<number>(0);
  const [navLinks, setNavLinks] = useState<NavLink[]>([]);
  const [siteSettings, setSiteSettings] = useState<any>(null);
  const pathname = usePathname();
  const visibleNavLinks = navLinks.length > 0 ? navLinks : DEFAULT_STOREFRONT_NAV_LINKS;

  const fetchSiteData = useCallback(async () => {
    try {
      const [navRes, settingsRes] = await Promise.all([
        getNavLinksServerSide(),
        getSiteSettingsServerSide()
      ]);

      if (!navRes.isError && navRes.data) {
        setNavLinks(filterStorefrontNavLinks(navRes.data as NavLink[]));
      }

      if (!settingsRes.isError && settingsRes.data) {
        setSiteSettings(settingsRes.data);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const updateCartCount = useCallback(async () => {
    const cookie = await getCookie("user");
    let count = 0;

    const guestCart = JSON.parse(localStorage.getItem("gym-shop-cart") || "[]");
    count += guestCart.reduce((sum: number, item: any) => sum + item.quantity, 0);

    if (cookie) {
      try {
        const user = JSON.parse(cookie) as IUser;
        const cartLength = await countCurrentCartLength({ userId: user._id });
        if (typeof cartLength === "number") count += cartLength;
      } catch (e) { console.error(e); }
    }
    setCartCount(count);
  }, []);

  useEffect(() => {
    fetchSiteData();
    updateCartCount();
    window.addEventListener("cart-updated", updateCartCount);
    return () => window.removeEventListener("cart-updated", updateCartCount);
  }, [updateCartCount, fetchSiteData]);

  return (
    <>
      <nav className="fixed top-0 left-0 w-full z-50 bg-black/80 backdrop-blur-md text-white transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/">
              <Image
                src={siteSettings?.logoUrl || "/NavLogo.png"}
                alt={siteSettings?.siteName || "Logo"}
                width={120}
                height={40}
                priority
                className="h-8 md:h-10 w-auto object-contain"
                style={{ height: 'auto' }}
              />
            </Link>
          </div>

          {/* Desktop Links (Centered) */}
          <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center space-x-8">
            {visibleNavLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`text-[11px] font-black uppercase tracking-[0.2em] hover:text-primary transition-all ${
                  pathname === link.href ? "text-primary" : "text-white/60"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Right Icons */}
          <div className="flex items-center space-x-4">
            <Link href="/cart" className="relative p-2 hover:text-primary transition-colors">
              <ShoppingCart size={24} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-black text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Mobile Toggle */}
            <button
              onClick={() => setIsOpen(true)}
              className="md:hidden p-2 hover:text-primary transition-colors"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="absolute top-0 left-0 w-[80%] h-full bg-black/90 p-6 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-12">
                <Link href="/" onClick={() => setIsOpen(false)}>
                  <Image
                    src={siteSettings?.logoUrl || "/NavLogo.png"}
                    alt={siteSettings?.siteName || "Logo"}
                    width={100}
                    height={30}
                    className="h-6 w-auto object-contain"
                    style={{ height: "auto" }}
                  />
                </Link>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:text-primary transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex flex-col space-y-6">
                {visibleNavLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`text-xl font-bold uppercase tracking-widest hover:text-primary transition-colors ${
                      pathname === link.href ? "text-primary" : "text-white"
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;

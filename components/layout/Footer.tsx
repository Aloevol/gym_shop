"use client";

import Link from "next/link";
import React from "react";
import Image from "next/image";
import { FaFacebookF, FaInstagram, FaTwitter, FaWhatsapp } from "react-icons/fa";
import { MapPin, Mail, Phone } from "lucide-react";
import { getNavLinksServerSide, getSiteSettingsServerSide } from "@/server/functions/admin.fun";
import { DEFAULT_STOREFRONT_NAV_LINKS, filterStorefrontNavLinks } from "@/lib/storefront";
import type { ISite } from "@/server/models/site/site.interface";

const Footer = () => {
  const [siteSettings, setSiteSettings] = React.useState<ISite | null>(null);
  const [navLinks, setNavLinks] = React.useState(DEFAULT_STOREFRONT_NAV_LINKS);

  React.useEffect(() => {
    (async () => {
      const [settingsRes, navRes] = await Promise.all([
        getSiteSettingsServerSide(),
        getNavLinksServerSide(),
      ]);

      if (!settingsRes.isError && settingsRes.data) {
        setSiteSettings(settingsRes.data as ISite);
      }

      if (!navRes.isError && navRes.data) {
        const links = filterStorefrontNavLinks(navRes.data as typeof DEFAULT_STOREFRONT_NAV_LINKS);
        if (links.length > 0) {
          setNavLinks(links);
        }
      }
    })();
  }, []);

  const socialLinks = [
    { href: siteSettings?.socialLinks?.instagram, icon: <FaInstagram size={16} />, label: "Instagram" },
    { href: siteSettings?.socialLinks?.facebook, icon: <FaFacebookF size={16} />, label: "Facebook" },
    { href: siteSettings?.socialLinks?.twitter, icon: <FaTwitter size={16} />, label: "Twitter / X" },
    { href: siteSettings?.socialLinks?.whatsapp, icon: <FaWhatsapp size={16} />, label: "WhatsApp" },
  ].filter((item) => item.href);

  return (
    <footer className="border-t border-white/5 bg-black px-4 py-14 text-white md:px-6">
      <div className="mx-auto grid max-w-7xl gap-10 rounded-[2.5rem] border border-white/10 bg-white/[0.03] p-6 sm:p-8 lg:grid-cols-[1.15fr_0.8fr_1fr_0.9fr] lg:p-10">
        <div className="space-y-6">
          <Link href="/" className="inline-flex">
            <Image
              src={siteSettings?.logoUrl || "/NavLogo.png"}
              alt={siteSettings?.siteName || "Logo"}
              width={144}
              height={48}
              className="h-10 w-auto object-contain"
              style={{ height: "auto" }}
            />
          </Link>

          <div className="space-y-3">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-primary">
              {siteSettings?.siteName || "Gym Shop"}
            </p>
            <p className="max-w-md text-sm leading-7 text-white/55">
              A cleaner storefront with only the essential public routes, fast product discovery, and dashboard-managed brand details.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {socialLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={item.label}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black text-white transition-all hover:border-primary hover:bg-primary hover:text-black"
              >
                {item.icon}
              </a>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-white/35">Pages</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-bold uppercase tracking-[0.18em] text-white/70 transition-colors hover:text-primary"
              >
                {link.name}
              </Link>
            ))}
            <Link
              href="/cart"
              className="text-sm font-bold uppercase tracking-[0.18em] text-white/70 transition-colors hover:text-primary"
            >
              Cart
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-white/35">Contact</p>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin size={16} className="mt-0.5 shrink-0 text-primary" />
              <p className="text-sm leading-6 text-white/65">
                {siteSettings?.contactAddress || "Dhaka, Bangladesh"}
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Phone size={16} className="mt-0.5 shrink-0 text-primary" />
              <p className="text-sm leading-6 text-white/65">
                {siteSettings?.contactPhone || "+880 1234 567 890"}
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Mail size={16} className="mt-0.5 shrink-0 text-primary" />
              <p className="text-sm leading-6 text-white/65 break-all">
                {siteSettings?.contactEmail || "support@thryve.com"}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-white/35">Social</p>
          {socialLinks.length > 0 ? (
            <div className="space-y-3">
              {socialLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-sm font-bold uppercase tracking-[0.16em] text-white/65 transition-colors hover:text-primary"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black text-white transition-all hover:border-primary hover:bg-primary hover:text-black">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-sm leading-6 text-white/35">
              Add Facebook, Instagram, or X links from the dashboard Social Matrix to show them here.
            </p>
          )}
        </div>
      </div>

      <p className="px-4 pt-8 text-center text-[11px] font-bold uppercase tracking-[0.2em] text-white/35">
        &copy; {new Date().getFullYear()} {siteSettings?.siteName || "Gym Shop"}. All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;

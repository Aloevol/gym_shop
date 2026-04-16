"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Mail, Phone, UserCircle } from "lucide-react";
import { isAuthenticatedAndGetUser } from "@/server/functions/auth.fun";
import { getSiteSettingsServerSide } from "@/server/functions/admin.fun";
import { IUser } from "@/server/models/user/user.interfce";
import { getCookie, setCookie } from "@/server/helper/jwt.helper";
import { USER_ROLE } from "@/enum/user.enum";

const TopBar = () => {
  const [user, setUser] = useState<IUser | null>(null);
  const [siteSettings, setSiteSettings] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const [settingsRes, cookie] = await Promise.all([
        getSiteSettingsServerSide(),
        getCookie("user"),
      ]);

      if (!settingsRes.isError && settingsRes.data) {
        setSiteSettings(settingsRes.data);
      }

      if (typeof cookie === "string") {
        setUser(JSON.parse(cookie));
        return;
      }

      const res = await isAuthenticatedAndGetUser();
      if (typeof res === "string") {
        await setCookie({ name: "user", value: res });
        setUser(JSON.parse(res));
      } else if (res.isError) {
        setUser(null);
      }
    })();
  }, []);

  return (
    <div className="w-full border-b border-white/5 bg-[#171717]">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/55 sm:flex-row sm:items-center sm:justify-between md:px-6">
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-2">
            <Phone size={12} className="text-primary" />
            {siteSettings?.contactPhone || "+880 1234 567 890"}
          </span>
          <span className="inline-flex items-center gap-2 break-all">
            <Mail size={12} className="text-primary" />
            {siteSettings?.contactEmail || "support@thryve.com"}
          </span>
        </div>

        {user && (
          <Link
            href={user.role === USER_ROLE.ADMIN ? "/dashboard" : "/profile"}
            className="inline-flex items-center gap-2 text-white transition-colors hover:text-primary"
            title="Profile"
          >
            <UserCircle size={14} />
            <span>{user.role === USER_ROLE.ADMIN ? "Dashboard" : "Profile"}</span>
          </Link>
        )}
      </div>
    </div>
  );
};

export default TopBar;

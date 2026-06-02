"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Cross,
  LayoutDashboard,
  Users,
  UserCircle,
  CalendarCheck,
  Music2,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  BookOpen,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import Image from "next/image";
import type { UserRole } from "@prisma/client";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", module: "dashboard" },
  { href: "/members", icon: UserCircle, label: "Members", module: "members" },
  { href: "/growth-tracker", icon: Users, label: "Growth Tracker", module: "growth-tracker" },
  { href: "/lessons", icon: BookOpen, label: "Lessons", module: "lessons" },
  { href: "/attendance", icon: CalendarCheck, label: "Attendance", module: "attendance" },
  { href: "/training", icon: Music2, label: "Training", module: "training" },
  { href: "/cms", icon: FileText, label: "CMS", module: "cms" },
  { href: "/accounts", icon: ShieldCheck, label: "Accounts", module: "accounts" },
  { href: "/settings", icon: Settings, label: "Settings", module: "settings" },
];

interface Props {
  user: { name?: string | null; email?: string | null; role: UserRole };
  allowedModules: string[];
}

export function DashboardSidebar({ user, allowedModules }: Props) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleItems = navItems.filter((item) => allowedModules.includes(item.module));

  const NavLink = ({ item }: { item: typeof navItems[0] }) => {
    const Icon = item.icon;
    const isActive =
      item.href === "/dashboard"
        ? pathname === "/dashboard"
        : pathname.startsWith(item.href);
    return (
      <Link
        href={item.href}
        onClick={() => setMobileOpen(false)}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
          isActive
            ? "bg-[#1A3D63] text-white shadow-sm"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
        )}
        title={collapsed ? item.label : undefined}
      >
        <Icon className="h-5 w-5 shrink-0" />
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside
        className={cn(
          "hidden md:flex flex-col h-full bg-white border-r border-border transition-all duration-300",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-border shrink-0">
          <div className="w-8 h-8 rounded-xl overflow-hidden shrink-0">
            <Image src="/images/WOH-logo.png" alt="WOH" width={32} height={32} className="object-cover w-full h-full" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="font-bold text-sm text-foreground truncate">Word of Hope</p>
              <p className="text-xs text-muted-foreground truncate">Sta. Clara</p>
            </div>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[#1A3D63] text-white shadow-sm"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Role Badge */}
        {!collapsed && (
          <div className="px-4 pb-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 text-[#1A3D63] text-xs font-medium">
              {user.role}
            </span>
          </div>
        )}

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center h-10 border-t border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </aside>

      {/* ── Mobile top bar ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between h-14 px-4 bg-white border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg overflow-hidden">
            <Image src="/images/WOH-logo.png" alt="WOH" width={28} height={28} className="object-cover w-full h-full" />
          </div>
          <span className="font-bold text-sm text-foreground">Word of Hope</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg hover:bg-secondary transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-30 flex">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          {/* Drawer */}
          <div className="relative w-64 bg-white h-full flex flex-col shadow-xl">
            <div className="flex items-center gap-3 px-4 h-14 border-b border-border">
              <div className="w-8 h-8 rounded-xl overflow-hidden shrink-0">
                <Image src="/images/WOH-logo.png" alt="WOH" width={32} height={32} className="object-cover w-full h-full" />
              </div>
              <div>
                <p className="font-bold text-sm">Word of Hope</p>
                <p className="text-xs text-muted-foreground">Sta. Clara</p>
              </div>
            </div>
            <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
              {visibleItems.map((item) => <NavLink key={item.href} item={item} />)}
            </nav>
            <div className="px-4 pb-4">
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 text-[#1A3D63] text-xs font-medium">
                {user.role}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

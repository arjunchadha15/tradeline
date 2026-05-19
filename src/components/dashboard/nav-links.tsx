"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, DollarSign, Phone, Settings, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/calls", label: "Calls", icon: Phone },
  { href: "/dashboard/calendar", label: "Calendar", icon: Calendar },
  { href: "/dashboard/revenue", label: "Revenue", icon: DollarSign },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-3">
      {links.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            (href === "/dashboard" ? pathname === href : pathname === href)
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

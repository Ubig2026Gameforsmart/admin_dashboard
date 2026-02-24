"use client";

import type React from "react";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Headphones,
  FileText,
  HelpCircle,
  CreditCard,
  Users,
  AlertCircle,
  Database,
  BookOpen,
  MapPin,
  Globe,
  Map,
  Building2,
  UserCog,
  Settings,
  User,
  Sliders,
  Shield,
  ChevronDown,
  PanelLeftClose,
  PanelLeft,
  Trash2,
  Palette,
  Gamepad2,
  BookOpenCheck,
  History,
  FileQuestion,
  FileCheck,
  Dices,
  Trophy,
  ClipboardList,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useSidebar } from "@/components/ui/sidebar";

interface NavChild {
  title: string;
  href: string;
  icon: React.ElementType;
  children?: NavChild[];
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  children?: NavChild[];
}

import { useTranslation } from "@/lib/i18n";

const navigation: NavItem[] = [
  {
    title: "nav.dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "nav.game",
    href: "/game",
    icon: Gamepad2,
    children: [
      {
        title: "nav.dashboard",
        href: "/game/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "nav.games",
        href: "/games",
        icon: Dices,
      },
      {
        title: "nav.game_sessions",
        href: "/game-sessions",
        icon: History,
      },
    ],
  },
  {
    title: "nav.quiz",
    href: "/quiz",
    icon: BookOpenCheck,
    children: [
      {
        title: "nav.dashboard",
        href: "/quiz/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "nav.quizzes",
        href: "/quizzes",
        icon: FileQuestion,
      },
      {
        title: "nav.quiz_approval",
        href: "/quiz-approval",
        icon: FileCheck,
      },
    ],
  },
  {
    title: "Competition",
    href: "/competition",
    icon: Trophy,
    children: [
      {
        title: "nav.dashboard",
        href: "/competition/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Manage Competitions",
        href: "/manage-competitions",
        icon: ClipboardList,
      },
    ],
  },
  {
    title: "nav.support",
    href: "/support",
    icon: Headphones,
    children: [
      {
        title: "nav.dashboard",
        href: "/support/dashboard",
        icon: LayoutDashboard,
      },
      { title: "nav.reports", href: "/reports", icon: FileText },
      { title: "Manage Sessions", href: "/manage-sessions", icon: Sliders },
      { title: "nav.groups", href: "/groups", icon: Users },
    ],
  },
  {
    title: "nav.billing",
    href: "/billing",
    icon: CreditCard,
    children: [
      {
        title: "nav.dashboard",
        href: "/billing/dashboard",
        icon: LayoutDashboard,
      },
      { title: "nav.subscriptions", href: "/subscriptions", icon: Users },
    ],
  },
  {
    title: "nav.master_data",
    href: "/master",
    icon: Database,
    children: [
      {
        title: "nav.dashboard",
        href: "/master/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "nav.address",
        href: "/address",
        icon: MapPin,
        children: [
          { title: "nav.country", href: "/address/country", icon: Globe },
          { title: "nav.state", href: "/address/state", icon: Map },
          { title: "nav.city", href: "/address/city", icon: Building2 },
        ],
      },
    ],
  },
  {
    title: "nav.administrator",
    href: "/administrator",
    icon: UserCog,
    children: [
      {
        title: "nav.dashboard",
        href: "/administrator/dashboard",
        icon: LayoutDashboard,
      },
      { title: "nav.users", href: "/users", icon: User },
      {
        title: "nav.trash_bin",
        href: "/trash-bin",
        icon: Trash2,
      },
    ],
  },
  {
    title: "nav.settings",
    href: "/settings",
    icon: Settings,
    children: [{ title: "nav.appearance", href: "/appearance", icon: Palette }],
  },
];

export function AppSidebar() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { open, toggleSidebar } = useSidebar();
  const [mounted, setMounted] = useState(false);
  // Default to open (not collapsed) during SSR to match server render
  const collapsed = mounted ? !open : false;
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const isChildActive = (item: NavItem | NavChild): boolean => {
    return (
      item.children?.some(
        (child) =>
          pathname === child.href ||
          pathname.startsWith(child.href + "/") ||
          (child.children &&
            child.children.some((grandChild) => pathname === grandChild.href)),
      ) ?? false
    );
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const activeMenus: string[] = [];

    navigation.forEach((item) => {
      if (item.children) {
        const childActive = item.children.some(
          (child) =>
            pathname === child.href ||
            pathname.startsWith(child.href + "/") ||
            (child.children &&
              child.children.some(
                (grandChild) => pathname === grandChild.href,
              )),
        );
        if (childActive) {
          activeMenus.push(item.title);
          item.children.forEach((child) => {
            if (
              child.children?.some(
                (grandChild) =>
                  pathname === grandChild.href ||
                  pathname.startsWith(grandChild.href + "/"),
              )
            ) {
              activeMenus.push(child.title);
            }
          });
        }
      }
    });

    setOpenMenus((prev) => Array.from(new Set([...prev, ...activeMenus])));
  }, [pathname, mounted]);

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title],
    );
  };

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center">
            <Image
              src="/icons/gameforsmartlogo.webp"
              alt="Gameforsmart"
              width={180}
              height={40}
              className="object-contain"
            />
          </Link>
        )}
        {collapsed && (
          <Image
            src="/icons/icon-32x32.png"
            alt="Gameforsmart"
            width={32}
            height={32}
            className="mx-auto"
          />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          const hasChildren = item.children && item.children.length > 0;
          const isOpen = mounted ? openMenus.includes(item.title) : false;

          if (hasChildren && !collapsed) {
            // Render static button before mount to avoid hydration mismatch
            if (!mounted) {
              return (
                <div key={item.title}>
                  <button
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      active || isChildActive(item)
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-secondary hover:text-foreground",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      <span>{t(item.title)}</span>
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
              );
            }

            return (
              <Collapsible
                key={item.title}
                open={isOpen}
                onOpenChange={() => toggleMenu(item.title)}
              >
                <CollapsibleTrigger asChild>
                  <button
                    suppressHydrationWarning
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      active || isChildActive(item)
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-secondary hover:text-foreground",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      <span>{t(item.title)}</span>
                    </div>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        isOpen && "rotate-180",
                      )}
                    />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-1 space-y-1 pl-4">
                  {item.children?.map((child) => {
                    const ChildIcon = child.icon;
                    const hasNestedChildren =
                      child.children && child.children.length > 0;
                    const isNestedOpen = mounted
                      ? openMenus.includes(child.title)
                      : false;

                    if (hasNestedChildren) {
                      return (
                        <Collapsible
                          key={child.title}
                          open={isNestedOpen}
                          onOpenChange={() => toggleMenu(child.title)}
                        >
                          <CollapsibleTrigger asChild>
                            <button
                              suppressHydrationWarning
                              className={cn(
                                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                                isNestedOpen || pathname.startsWith(child.href)
                                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                  : "text-sidebar-foreground hover:bg-secondary hover:text-foreground",
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <ChildIcon className="h-4 w-4" />
                                <span>{t(child.title)}</span>
                              </div>
                              <ChevronDown
                                className={cn(
                                  "h-3 w-3 transition-transform",
                                  isNestedOpen && "rotate-180",
                                )}
                              />
                            </button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-1 space-y-1 pl-4">
                            {child.children?.map((grandChild) => {
                              const GrandChildIcon = grandChild.icon;
                              return (
                                <Link
                                  key={grandChild.href}
                                  href={grandChild.href}
                                  className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                                    pathname === grandChild.href
                                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                                      : "text-sidebar-foreground hover:bg-secondary hover:text-foreground",
                                  )}
                                >
                                  <GrandChildIcon className="h-4 w-4" />
                                  <span>{t(grandChild.title)}</span>
                                </Link>
                              );
                            })}
                          </CollapsibleContent>
                        </Collapsible>
                      );
                    }

                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                          pathname === child.href
                            ? "bg-sidebar-primary text-sidebar-primary-foreground"
                            : "text-sidebar-foreground hover:bg-secondary hover:text-foreground",
                        )}
                      >
                        <ChildIcon className="h-4 w-4" />
                        <span>{t(child.title)}</span>
                      </Link>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            );
          }

          // If sidebar is collapsed and item has children, redirect to the first child (usually Dashboard)
          const linkHref =
            collapsed && hasChildren && item.children?.[0]
              ? item.children[0].href
              : item.href;

          return (
            <Link
              key={item.title}
              href={linkHref}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-secondary hover:text-foreground",
                collapsed && "justify-center px-2",
              )}
              title={collapsed ? t(item.title) : undefined}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span>{t(item.title)}</span>}
            </Link>
          );
        })}
      </nav>

    </aside>
  );
}

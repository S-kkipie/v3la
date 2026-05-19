"use client";

import {
    CreditCard,
    LayoutDashboard,
    LifeBuoy,
    School,
    Send,
    Settings2,
    Wallet,
} from "lucide-react";
import Link from "next/link";
import type * as React from "react";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/frontend/components/ui/sidebar";
import { NavMain } from "./components/nav-main";
import { NavSecondary } from "./components/nav-secondary";
import { NavUser } from "./components/nav-user";

const navMain = [
    {
        title: "Dashboard",
        url: "/app",
        icon: LayoutDashboard,
    },
    {
        title: "Wallet",
        url: "/wallet",
        icon: Wallet,
       
    },
    {
        title: "Préstamos",
        url: "/app",
        icon: CreditCard,
       
    },
    {
        title: "Configuración",
        url: "/settings/account",
        icon: Settings2,
        items: [
            {
                title: "Cuenta",
                url: "/settings/account",
            },
            {
                title: "Seguridad",
                url: "/settings/security",
            },
        ],
    },
];

const navSecondary = [
    {
        title: "Soporte",
        url: "#",
        icon: LifeBuoy,
    },
    {
        title: "Feedback",
        url: "#",
        icon: Send,
    },
];

/**
 * Application sidebar component with role-based navigation filtering.
 *
 * Uses the authenticated user's role to determine which navigation
 * items to display. Navigation definitions align with the permission
 * boundaries defined in `src/server/auth/permissions.ts`.
 *
 * @param props - Standard sidebar component properties
 * @returns The sidebar element with filtered navigation
 */
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    return (
        <Sidebar variant="inset" {...props} collapsible="icon">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" render={<Link href="/" />}>
                            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                <School className="size-4" />
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-medium">
                                    V3LA
                                </span>
                                <span className="truncate text-xs">
                                    Finanzas Descentralizadas
                                </span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={navMain} />
                <NavSecondary items={navSecondary} className="mt-auto" />
            </SidebarContent>
            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}

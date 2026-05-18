"use client";

import {
    School
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
import { NavUser } from "./components/nav-user";


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
                        <SidebarMenuButton size="lg" >
                            <Link href="/">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                    <School className="size-4" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-medium">
                                        SGPU
                                    </span>
                                    <span className="truncate text-xs">
                                        Escuela de Posgrado
                                    </span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                {/* <NavMain items={navItems} /> */}
            </SidebarContent>
            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}

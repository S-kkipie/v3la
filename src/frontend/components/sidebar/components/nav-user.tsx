"use client";

import { SidebarMenu, SidebarMenuItem } from "@/frontend/components/ui/sidebar";
import { UserButton } from "../../auth/user-button";

export function NavUser() {
    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <UserButton size="lg" />
            </SidebarMenuItem>
        </SidebarMenu>
    );
}

"use client";

import { UserButton } from "@/frontend/components/auth/user/user-button";
import { SidebarMenu, SidebarMenuItem } from "@/frontend/components/ui/sidebar";

export function NavUser() {
    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <UserButton size="default" />
            </SidebarMenuItem>
        </SidebarMenu>
    );
}

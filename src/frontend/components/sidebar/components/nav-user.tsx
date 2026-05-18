"use client";

import { SidebarMenu, SidebarMenuItem } from "@/frontend/components/ui/sidebar";
import { UserButton } from "@/frontend/components/auth/user/user-button";

export function NavUser() {
    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <UserButton size="default" />
            </SidebarMenuItem>
        </SidebarMenu>
    );
}

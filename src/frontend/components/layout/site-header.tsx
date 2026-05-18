"use client";

import { usePathname } from "next/navigation";
import React, { type ReactElement, useEffect, useState } from "react";
import { UserButton } from "@/frontend/components/auth/user/user-button";
import { Separator } from "@/frontend/components/ui/separator";
import { SidebarTrigger } from "@/frontend/components/ui/sidebar";
import { useAuth } from "@/frontend/context/auth-context";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "../ui/breadcrumb";


export function SiteHeader({ home }: { home?: boolean }) {
    const pathname = usePathname();
    const [windowWidth, setWindowWidth] = useState(0);

    const { user } = useAuth();

    useEffect(() => {
        const handleResize = () =>
            setWindowWidth(document.documentElement.clientWidth);

        handleResize();
        window.addEventListener("resize", handleResize);

        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const pathSegments = pathname.split("/").filter(Boolean);

    const breadcrumbItems: ReactElement[] = [];
    let breadcrumbPage: ReactElement = <></>;
    const maxWidth = ((windowWidth - 120) / (pathSegments.length + 3)).toFixed(
        0,
    );

    const translateRoute = (route: string): string => {
        const translations: Record<string, string> = {
            app: "Aplicación",
            dashboard: "Panel",
        };

        return translations[route.toLowerCase()] || decodeURIComponent(route);
    };

    for (let i = 0; i < pathSegments.length; i++) {
        const route = pathSegments[i];
        const href = `/${pathSegments.slice(0, i + 1).join("/")}`;

        if (i === pathSegments.length - 1) {
            breadcrumbPage = (
                <BreadcrumbItem>
                    <BreadcrumbPage
                        className="capitalize truncate"
                        style={{
                            maxWidth: `${Math.min(200, Number(maxWidth))}px`,
                        }}
                    >
                        {translateRoute(route)}
                    </BreadcrumbPage>
                </BreadcrumbItem>
            );
        } else {
            breadcrumbItems.push(
                <React.Fragment key={href}>
                    <BreadcrumbItem>
                        <BreadcrumbLink
                            href={href}
                            className="capitalize truncate"
                            style={{ maxWidth: `${maxWidth}px` }}
                        >
                            {translateRoute(route)}
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                </React.Fragment>,
            );
        }
    }

    return (
        <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
            <div
                suppressHydrationWarning
                className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6"
            >
                {!home && (
                    <>
                        <SidebarTrigger className="-ml-1" />
                        <Separator
                            orientation="vertical"
                            className="mx-2 data-[orientation=vertical]:h-4"
                        />
                    </>
                )}
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/app">
                                Inicio
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        {pathSegments.length > 0 && <BreadcrumbSeparator />}
                        {breadcrumbItems}
                        {breadcrumbPage}
                    </BreadcrumbList>
                </Breadcrumb>
                <div className="ml-auto flex items-center gap-2">
                    {home && <UserButton size="icon" />}
                    {/* {user.role && (
                        <Badge variant="secondary">
                            {user.role.toLocaleUpperCase()}
                        </Badge>
                    )} */}
                </div>
            </div>
        </header>
    );
}

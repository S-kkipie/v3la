import { getLogger } from "@logtape/logtape";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/frontend/components/layout/site-header";
import { AppSidebar } from "@/frontend/components/sidebar/app-sidebar";
import {
    SidebarInset,
    SidebarProvider,
} from "@/frontend/components/ui/sidebar";
import { AuthProvider } from "@/frontend/context/auth-context";
import { LoggerProvider } from "@/frontend/context/logger-context";
import { authenticate } from "@/server/auth/auth";

const logger = getLogger(["sgpu", "frontend", "dashboard", "layout"]);

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const auth = await authenticate();

    if (!auth) {
        logger.info("No authentication found, redirecting to login");
        redirect(
            "/auth/sign-in?error_message=No se encontro una cuenta activa",
        );
    }

    return (
        <AuthProvider session={auth.session} user={auth.user}>
            <LoggerProvider>
                <SidebarProvider
                    style={
                        {
                            "--sidebar-width": "calc(var(--spacing) * 72)",
                            "--header-height": "calc(var(--spacing) * 14)",
                        } as React.CSSProperties
                    }
                >
                    <AppSidebar />
                    <SidebarInset>
                        <SiteHeader />
                        <main className="flex flex-1 flex-col gap-4 overflow-auto p-4 pt-0">
                            {children}
                        </main>
                    </SidebarInset>
                </SidebarProvider>
            </LoggerProvider>
        </AuthProvider>
    );
}

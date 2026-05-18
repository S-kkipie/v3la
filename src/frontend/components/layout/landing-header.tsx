import Link from "next/link";
import { Button } from "@/frontend/components/ui/button";
import { authenticate } from "@/server/auth/auth";

/**
 * Maps user roles to their default landing page after authentication.
 * Role values match the keys defined in the Better Auth admin plugin config.
 */
const roleDashboardMap: Record<string, string> = {
    superAdmin: "/admin",
    admin: "/admin",
    professor: "/professor",
    student: "/student",
};

/**
 * Resolves the default dashboard path for a given user role.
 *
 * @param role - The user's role string from the session
 * @returns The dashboard URL path, defaults to `/student`
 */
const getDashboardPath = (role: string | null | undefined): string =>
    role && roleDashboardMap[role] ? roleDashboardMap[role] : "/student";

export async function LandingHeader() {
    const auth = await authenticate();

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">
                        SG
                    </div>
                    <span className="text-xl font-bold text-primary tracking-tight">
                        SGPU
                    </span>
                </div>
                <nav className="hidden md:flex gap-6">
                    <Link
                        href="/"
                        className="text-sm font-medium text-primary hover:text-accent transition-colors"
                    >
                        Inicio
                    </Link>
                    <Link
                        href="/#anuncios"
                        className="text-sm font-medium text-muted-foreground hover:text-accent transition-colors"
                    >
                        Anuncios
                    </Link>
                    <Link
                        href="#"
                        className="text-sm font-medium text-muted-foreground hover:text-accent transition-colors"
                    >
                        Programas
                    </Link>
                    <Link
                        href="#"
                        className="text-sm font-medium text-muted-foreground hover:text-accent transition-colors"
                    >
                        Contacto
                    </Link>
                </nav>
                <div className="flex items-center gap-4">
                    {auth ? (
                        <Link href={getDashboardPath((auth.user as any).role)}>
                            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                                Dashboard
                            </Button>
                        </Link>
                    ) : (
                        <Link href="/login">
                            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                                Ingresar
                            </Button>
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}

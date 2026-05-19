"use client";

import { useAuth, useAuthenticate } from "@better-auth-ui/react";
import { Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/frontend/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from "@/frontend/components/ui/sheet";

const navLinks = [
    { label: "El Problema", href: "#problemas" },
    { label: "Cómo Funciona", href: "#como-funciona" },
    { label: "Pasos", href: "#pasos" },
    { label: "Impacto", href: "#impacto" },
    { label: "Contacto", href: "#contacto" },
];

export function LandingHeader() {
    const [open, setOpen] = useState(false);
    const { authClient } = useAuth();
    const { data: session } = useAuthenticate(authClient);

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <span className="text-2xl font-extrabold tracking-tight text-foreground">
                        V3LA
                    </span>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-6">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>

                {/* Desktop Actions */}
                <div className="hidden md:flex items-center gap-3">
                    {!session && (
                        <Button
                            variant="outline"
                            size="sm"
                            nativeButton={false}
                            render={<Link href="/auth/sign-in" />}
                        >
                            Iniciar sesión
                        </Button>
                    )}

                    {!session && (
                        <Button
                            size="sm"
                            nativeButton={false}
                            render={<Link href="/auth/sign-up" />}
                        >
                        Empezar Ahora
                    </Button> 
                    )}

                    {session && (
                        <Button
                            size="sm"
                            nativeButton={false}
                            render={<Link href="/app" />}
                        >
                            Ir a la App
                        </Button>
                    )}
                </div>

                {/* Mobile Menu */}
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger
                        className="md:hidden"
                        render={<Button variant="ghost" size="icon-sm" />}
                    >
                        <Menu className="size-5" />
                        <span className="sr-only">Abrir menú</span>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-3/4 max-w-sm">
                        <div className="flex flex-col gap-6 pt-8">
                            <Link
                                href="/"
                                className="text-2xl font-extrabold tracking-tight text-foreground"
                                onClick={() => setOpen(false)}
                            >
                                VELA
                            </Link>
                            <nav className="flex flex-col gap-4">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className="text-base font-medium text-muted-foreground transition-colors hover:text-foreground"
                                        onClick={() => setOpen(false)}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </nav>
                            <div className="flex flex-col gap-3 pt-4 border-t border-border">
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    nativeButton={false}
                                    render={
                                        <Link
                                            href="/auth/sign-in"
                                            onClick={() => setOpen(false)}
                                        />
                                    }
                                >
                                    Iniciar sesión
                                </Button>
                                <Button
                                    className="w-full"
                                    nativeButton={false}
                                    render={
                                        <Link
                                            href="/auth/sign-up"
                                            onClick={() => setOpen(false)}
                                        />
                                    }
                                >
                                    Empezar Ahora
                                </Button>
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </header>
    );
}

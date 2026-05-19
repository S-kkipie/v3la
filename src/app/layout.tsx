import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "./globals.css";
import NextTopLoader from "nextjs-toploader";
import { Suspense } from "react";
import { ErrorToast } from "@/frontend/components/error-toast";
import { cn } from "@/frontend/lib/utils";
import Providers from "@/frontend/providers/providers";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "VELA — Financiamiento Web3 para Emprendedores",
    description:
        "VELA usa tecnología Web3 y un agente de IA para crear tu perfil financiero digital, conectarte con oportunidades de crédito seguras y guiarte paso a paso. Sin complicaciones, sin tecnicismos.",
    icons: {
        icon: "/icon.svg",
        shortcut: "/icon.svg",
        apple: "/icon.svg",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es" className={cn("font-sans", geist.variable)}>
            <body
                suppressHydrationWarning
                className={`${geist.variable} ${geistMono.variable} antialiased`}
            >
                <NextTopLoader />

                <NuqsAdapter>
                    <Suspense fallback={null}>
                        <ErrorToast />
                    </Suspense>
                    <Providers>{children}</Providers>
                </NuqsAdapter>
            </body>
        </html>
    );
}

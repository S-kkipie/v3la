import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/frontend/lib/utils";
import Providers from "@/frontend/providers/providers";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
    display: "swap",
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Solana dApp Starter",
    description: "A minimal Next.js starter powered by @solana/react-hooks",
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
        <html lang="en" className={cn("font-sans", geist.variable)}>
            <Providers>
                <body
                    suppressHydrationWarning
                    className={`${inter.variable} ${geistMono.variable} antialiased`}
                >
                    {children}
                </body>
            </Providers>
        </html>
    );
}

"use client";

import { SolanaProvider } from "@solana/react-hooks";
import { QueryClientProvider } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PropsWithChildren } from "react";
import { authClient } from "@/frontend/auth/auth";
import { solanaClient } from "@/frontend/clients/solana-client";
import { AuthProvider } from "@/frontend/components/auth/auth-provider";
import { TooltipProvider } from "@/frontend/components/ui/tooltip";
import { passkeyPlugin } from "@/frontend/lib/auth/passkey-plugin";
import { getQueryClient } from "@/frontend/lib/query-client";

export default function Providers({ children }: PropsWithChildren) {
    const router = useRouter();
    const queryClient = getQueryClient();

    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider
                authClient={authClient}
                redirectTo="/app"
                socialProviders={["google"]}
                navigate={({ to, replace }) =>
                    replace ? router.replace(to) : router.push(to)
                }
                plugins={[passkeyPlugin()]}
                Link={Link}
            >
                <TooltipProvider>
                    <SolanaProvider client={solanaClient}>
                        {children}
                    </SolanaProvider>
                </TooltipProvider>
            </AuthProvider>
        </QueryClientProvider>
    );
}

import {
    DynamicContextProvider,
    DynamicWidget,
} from "@dynamic-labs/sdk-react-core";
import { SolanaWalletConnectors } from "@dynamic-labs/solana";
import { SolanaProvider } from "@solana/react-hooks";
import type { PropsWithChildren } from "react";
import ServerConfig from "@/config/server-config";
import { solanaClient } from "@/frontend/clients/solana-client";

export default function Providers({ children }: PropsWithChildren) {
    return (
        <DynamicContextProvider
            settings={{
                environmentId: ServerConfig.dynamicEnvironmentId,
                walletConnectors: [SolanaWalletConnectors],
            }}
        >
            <SolanaProvider client={solanaClient}>
                {children}
            </SolanaProvider>
            <DynamicWidget />
        </DynamicContextProvider>
    );
}

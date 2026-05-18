"use client";

/**
 * Client-side loading context and provider.
 * Provides a global loading overlay state that any component can toggle.
 */

import {
    createContext,
    type ReactNode,
    useContext,
    useMemo,
    useState,
} from "react";
import { LoadingOverlay } from "@/frontend/components/ui/loading-overlay";

/**
 * Shape of the client-loading context value.
 */
type ClientLoadingContextType = {
    clientLoading: boolean;
    setClientLoading: (value: boolean) => void;
};

export const ClientLoadingContext = createContext<
    ClientLoadingContextType | undefined
>(undefined);

/**
 * Provider that exposes a boolean loading flag and its setter.
 * The context value is memoized so consumers only re-render when
 * `clientLoading` actually changes — not on every parent render.
 *
 * @param children - React children to wrap
 * @returns A provider component
 */
export const ClientLoadingProvider = ({
    children,
}: {
    children: ReactNode;
}) => {
    const [clientLoading, setClientLoading] = useState<boolean>(false);

    const value = useMemo<ClientLoadingContextType>(
        () => ({ clientLoading, setClientLoading }),
        [clientLoading],
    );

    return (
        <ClientLoadingContext.Provider value={value}>
            {children}
        </ClientLoadingContext.Provider>
    );
};

/**
 * Hook to consume the client-loading context.
 *
 * @returns The current loading state and its setter
 * @throws If used outside a `ClientLoadingProvider`
 */
export const useClientLoading = () => {
    const context = useContext(ClientLoadingContext);

    if (!context) {
        throw new Error(
            "useClientLoading debe usarse dentro de ClientLoadingProvider",
        );
    }

    return context;
};

/**
 * Renders a full-screen loading overlay controlled by the client-loading context.
 *
 * @returns A loading overlay component
 */
export function LoadingOverlayWrapper() {
    const { clientLoading } = useClientLoading();

    return <LoadingOverlay isVisible={clientLoading} />;
}

"use client";

import { createContext, type ReactNode, useContext } from "react";
import type { Session } from "@/frontend/auth/auth";

export type AuthContextType = {
    session: Session;
};

export const AuthContext = createContext<AuthContextType | undefined>(
    undefined,
);

export type AuthProviderProps = {
    children: ReactNode;
    session: Session;
};

/**
 * Provider component for the authentication context.
 *
 * Wraps the application or a specific tree to provide `session`, `user`,
 * and `organization` data to sub-components via the `useAuth` hook.
 *
 * @param props - Component properties
 * @returns The provider element
 */
export const AuthProvider = ({ children, session }: AuthProviderProps) => {
    return (
        <AuthContext.Provider value={{ session }}>
            {children}
        </AuthContext.Provider>
    );
};

/**
 * Hook to access the authentication context.
 *
 * Provides a simple interface to retrieve the current authentication state.
 * Throws an error if called outside of an `AuthProvider` tree.
 *
 * @returns The combined `session`, `user`, and `organization` data if authenticated; otherwise `undefined`.
 * @throws Error if the context is not found (missing provider).
 */
export const useAuth = (): Session => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used within AuthProvider");
    }

    return context.session;
};

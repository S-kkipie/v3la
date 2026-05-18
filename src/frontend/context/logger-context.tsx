"use client";

import { getLogger, type Logger } from "@logtape/logtape";
import { createContext, useContext, useMemo } from "react";
import { useAuth } from "./auth-context";

interface LoggerContextValue {
    logger: Logger;
}

const LoggerContext = createContext<LoggerContextValue | null>(null);

export function LoggerProvider({ children }: { children: React.ReactNode }) {
    const baseLogger = getLogger(["stocky", "frontend"]);

    const session = useAuth();

    const logger = useMemo(() => {
        if (session) {
            return baseLogger.with({ user: session.user });
        }
        return baseLogger.with({ user: { id: "anonymous" } });
    }, [baseLogger, session]);

    return (
        <LoggerContext.Provider value={{ logger }}>
            {children}
        </LoggerContext.Provider>
    );
}

export function useLogger(): Logger {
    const context = useContext(LoggerContext);
    if (!context) {
        console.warn("[useLogger] Called outside of LoggerProvider");
        return getLogger(["stocky", "frontend"]);
    }
    return context.logger;
}

// Child logger for component-specific categories
export function useChildLogger(
    subcategory: string | readonly [string] | readonly [string, ...string[]],
): Logger {
    const parentLogger = useLogger();
    return useMemo(
        () => parentLogger.getChild(subcategory),
        [parentLogger, subcategory],
    );
}

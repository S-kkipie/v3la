"use client";

import { useAuth } from "@/frontend/context/auth-context";

export function useDashboard() {
    const { user } = useAuth();

    return {
        user,
    };
}

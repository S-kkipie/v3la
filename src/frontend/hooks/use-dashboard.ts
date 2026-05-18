"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/frontend/context/auth-context";

interface DashboardStats {
    totalLoans: number;
    activeLoans: number;
    creditScore: number;
    nextPayment: string | null;
}

async function fetchDashboardStats(): Promise<DashboardStats> {
    const response = await fetch("/api/v1/dashboard/stats");

    if (!response.ok) {
        throw new Error(`Failed to fetch dashboard statistics: ${response.status}`);
    }

    return response.json();
}

export function useDashboard() {
    const { user } = useAuth();

    const { data: stats, isLoading, error } = useQuery({
        queryKey: ["dashboard", "stats", user.id],
        queryFn: fetchDashboardStats,
        retry: (failureCount, error) => {
            if (error instanceof Error && error.message.includes("404")) {
                return false;
            }
            return failureCount < 3;
        },
        initialData: {
            totalLoans: 0,
            activeLoans: 0,
            creditScore: 0,
            nextPayment: null,
        },
    });

    return {
        user,
        stats,
        isLoading,
        error,
    };
}

"use client";

import { Skeleton } from "@/frontend/components/ui/skeleton";
import { useAuth } from "@/frontend/context/auth-context";
import { cn } from "@/frontend/lib/utils";
import { UserAvatar } from "./user-avatar";

export interface UserViewProps {
    className?: string;
    isPending?: boolean;
    size?: "sm" | "default" | "lg" | null;
}

/**
 * Displays user information with avatar and details in a compact view
 *
 * Renders a user's profile information with appropriate fallbacks:
 * - Shows avatar alongside user name and email when available
 * - Shows loading skeletons when isPending is true
 * - Falls back to generic "User" text when neither name nor email is available
 * - Supports customization through classNames prop
 */
export function UserView({ className, isPending, size }: UserViewProps) {
    const { user } = useAuth();
    return (
        <div className={cn("flex items-center gap-2", className)}>
            <UserAvatar
                className={cn(size !== "sm" && "my-0.5")}
                isPending={isPending}
                size={size ?? undefined}
            />

            <div className={cn("grid flex-1 text-start leading-tight")}>
                {isPending ? (
                    <>
                        <Skeleton
                            className={cn(
                                "max-w-full",
                                size === "lg" ? "h-4.5 w-32" : "h-3.5 w-24",
                            )}
                        />
                        {size !== "sm" && (
                            <Skeleton
                                className={cn(
                                    "mt-1.5 max-w-full",
                                    size === "lg" ? "h-3.5 w-40" : "h-3 w-32",
                                )}
                            />
                        )}
                    </>
                ) : (
                    <span
                        className={cn(
                            "truncate font-semibold",
                            size === "lg" ? "text-base" : "text-sm",
                        )}
                    >
                        {user?.name || user?.email}
                    </span>
                )}
            </div>
        </div>
    );
}

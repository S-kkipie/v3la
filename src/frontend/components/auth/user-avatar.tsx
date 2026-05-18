"use client";

import { UserRoundIcon } from "lucide-react";
import type { ComponentProps } from "react";
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/frontend/components/ui/avatar";
import { Skeleton } from "@/frontend/components/ui/skeleton";
import { useAuth } from "@/frontend/context/auth-context";
import { cn } from "@/frontend/lib/utils";

export interface UserAvatarProps {
    isPending?: boolean;
    size?: "sm" | "default" | "lg" | "xl" | null;
}

/**
 * Displays a user avatar with image and fallback support
 *
 * Renders a user's avatar image when available, with appropriate fallbacks:
 * - Shows a skeleton when isPending is true
 * - Displays first two characters of user's name when no image is available
 * - Falls back to a generic user icon when neither image nor name is available
 */
export function UserAvatar({
    className,
    isPending,
    size,
    ...props
}: UserAvatarProps & ComponentProps<typeof Avatar>) {
    const { user } = useAuth();
    const name = user.name || user.email;
    const userImage = user.image;
    const src = userImage;

    if (isPending) {
        return (
            <Skeleton
                className={cn(
                    "shrink-0 rounded-full",
                    size === "sm"
                        ? "size-6"
                        : size === "lg"
                          ? "size-10"
                          : "size-8",
                    className,
                )}
            />
        );
    }

    return (
        <Avatar
            className={cn(
                "bg-muted",
                size === "sm" ? "size-6" : size === "lg" ? "size-10" : "size-8",
                className,
            )}
            {...props}
        >
            {
                <AvatarImage
                    alt={name?.toString().slice(0, 2)}
                    src={src || undefined}
                />
            }

            <AvatarFallback
                className={cn("text-foreground uppercase")}
                delayMs={src ? 600 : undefined}
            >
                {firstTwoCharacters(name) || (
                    <UserRoundIcon className={cn("size-[50%]")} />
                )}
            </AvatarFallback>
        </Avatar>
    );
}

const firstTwoCharacters = (name?: string | null) => name?.slice(0, 2);

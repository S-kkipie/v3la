"use client";
import { ChevronsUpDown, LogOutIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    type ComponentProps,
    Fragment,
    type ReactNode,
    useEffect,
    useRef,
} from "react";
import { Button } from "@/frontend/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/frontend/components/ui/dropdown-menu";
import { useAuth } from "@/frontend/context/auth-context";
import { useChildLogger } from "@/frontend/context/logger-context";
import { cn } from "@/frontend/lib/utils";
import { authClient } from "../auth";
import { UserAvatar } from "./user-avatar";
import { UserView } from "./user-view";

export interface UserButtonProps {
    className?: string;
    align?: "center" | "start" | "end";
    alignOffset?: number;
    side?: "top" | "right" | "bottom" | "left";
    sideOffset?: number;
    additionalLinks?: (
        | {
              href: string;
              icon?: ReactNode;
              label: ReactNode;
              signedIn?: boolean;
              separator?: boolean;
          }
        | ReactNode
    )[];
    trigger?: ReactNode;
    disableDefaultLinks?: boolean;
}

export function UserButton({
    className,
    align,
    alignOffset,
    side,
    sideOffset,
    trigger,
    additionalLinks,
    disableDefaultLinks,
    size,
    ...props
}: UserButtonProps & ComponentProps<typeof Button>) {
    const logger = useChildLogger(["user-button"]);
    const sessionData = useAuth();
    const user = sessionData.user;
    const router = useRouter();

    const warningLogged = useRef(false);

    useEffect(() => {
        if (size || warningLogged.current) return;

        logger.warn(
            "The `size` prop of `UserButton` no longer defaults to `icon`. Please pass `size='icon'` to the `UserButton` component to get the same behaviour as before. This warning will be removed in a future release. It can be suppressed in the meantime by defining the `size` prop.",
        );

        warningLogged.current = true;
    }, [size, logger]);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                asChild
                className={cn(size === "icon" && "rounded-full")}
            >
                {trigger ||
                    (size === "icon" ? (
                        <Button
                            size="icon"
                            className="size-fit rounded-full"
                            variant="ghost"
                        >
                            <UserAvatar key={user?.image} aria-label="Cuenta" />
                        </Button>
                    ) : (
                        <Button
                            className={cn("p-2! h-fit", className)}
                            size={size}
                            {...props}
                        >
                            <UserView />

                            <ChevronsUpDown className="ml-auto" />
                        </Button>
                    ))}
            </DropdownMenuTrigger>

            <DropdownMenuContent
                className={cn(
                    "w-[--radix-dropdown-menu-trigger-width] min-w-56 max-w-64",
                )}
                align={align}
                alignOffset={alignOffset}
                side={side}
                sideOffset={sideOffset}
                onCloseAutoFocus={(e) => e.preventDefault()}
            >
                {/* <div className="-my-1 text-muted-foreground text-xs">
                    Cuenta
                </div>

                <DropdownMenuSeparator /> */}

                {additionalLinks?.map((link, index) => {
                    if (
                        !link ||
                        typeof link !== "object" ||
                        !("href" in link)
                    ) {
                        return (
                            <DropdownMenuItem key={index} asChild>
                                {link}
                            </DropdownMenuItem>
                        );
                    }

                    const { href, icon, label, signedIn, separator } = link;

                    if (
                        signedIn !== undefined &&
                        ((signedIn && !sessionData) ||
                            (!signedIn && sessionData))
                    ) {
                        return null;
                    }

                    return (
                        <Fragment key={index}>
                            <Link href={href}>
                                <DropdownMenuItem>
                                    {icon}
                                    {label}
                                </DropdownMenuItem>
                            </Link>
                            {separator && <DropdownMenuSeparator />}
                        </Fragment>
                    );
                })}

                {
                    <DropdownMenuItem
                        onClick={async () => {
                            await authClient.signOut();
                            router.push("/");
                        }}
                        className=""
                    >
                        <LogOutIcon />
                        Cerrar sesión
                    </DropdownMenuItem>
                }
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

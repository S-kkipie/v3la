import { cva, type VariantProps } from "class-variance-authority";
import React from "react";
import { cn } from "@/frontend/lib/utils";

const titleVariants = cva("", {
    variants: {
        size: {
            default: "text-2xl font-semibold",
            md: "text-lg",
            sm: "text-base",
        },
    },
    defaultVariants: {
        size: "default",
    },
});

export type TitleProps = React.HTMLAttributes<HTMLHeadingElement> &
    VariantProps<typeof titleVariants> & {
        as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
    };

export const Title = React.forwardRef<HTMLHeadingElement, TitleProps>(
    ({ className, as = "h1", size, ...props }, ref) => {
        const Comp = as;

        return (
            <Comp
                className={cn(titleVariants({ size, className }))}
                ref={ref}
                {...props}
            />
        );
    },
);
Title.displayName = "Title";

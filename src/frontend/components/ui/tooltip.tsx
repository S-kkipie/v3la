"use client";

import * as React from "react";
import { Tooltip } from "@base-ui/react/tooltip";

import { cn } from "@/frontend/lib/utils";

function TooltipProvider({
  delay = 0,
  ...props
}: React.ComponentProps<typeof Tooltip.Provider>) {
  return (
    <Tooltip.Provider data-slot="tooltip-provider" delay={delay} {...props} />
  );
}

function TooltipRoot({
  children,
  ...props
}: React.ComponentProps<typeof Tooltip.Root>) {
  return <Tooltip.Root {...props}>{children}</Tooltip.Root>;
}

function TooltipTrigger({
  className,
  ...props
}: React.ComponentProps<typeof Tooltip.Trigger>) {
  return (
    <Tooltip.Trigger
      data-slot="tooltip-trigger"
      className={cn("", className)}
      {...props}
    />
  );
}

function TooltipContent({
  className,
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof Tooltip.Positioner> & { sideOffset?: number }) {
  return (
    <Tooltip.Positioner
      data-slot="tooltip-content"
      className={cn(
        "z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className,
      )}
      sideOffset={sideOffset}
      {...props}
    >
      <Tooltip.Popup />
    </Tooltip.Positioner>
  );
}

export {
  TooltipRoot as Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
};

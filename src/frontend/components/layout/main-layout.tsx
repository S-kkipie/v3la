import { cn } from "@/frontend/lib/utils";
import { Title, type TitleProps } from "../ui/title";

function MainLayout({
    children,
    className,
    ...props
}: React.PropsWithChildren<React.ComponentProps<"div">>) {
    return (
        <div {...props} className={cn("space-y-4 p-4", className)}>
            {children}
        </div>
    );
}
function MainLayoutTitleSearchContainer({
    children,
    className,
    ...props
}: React.PropsWithChildren<React.ComponentProps<"div">>) {
    return (
        <div
            {...props}
            className={cn(
                "flex space-y-4 md:space-y-0 flex-col  md:flex-row  md:justify-between",
                className,
            )}
        >
            {children}
        </div>
    );
}

function MainLayoutTitle({
    children,
    ...props
}: React.PropsWithChildren<Omit<TitleProps, "size" | "as">>) {
    return <Title {...props}>{children}</Title>;
}

function MainLayoutSubTitle({
    children,
    ...props
}: React.PropsWithChildren<Omit<TitleProps, "">>) {
    return (
        <Title size="md" as="h2" {...props}>
            {children}
        </Title>
    );
}

function MainLayoutSection({
    children,
    ...props
}: React.PropsWithChildren<React.ComponentProps<"section">>) {
    return (
        <section {...props} className={cn("pt-2", props.className)}>
            {children}
        </section>
    );
}

function MainLayoutDescription({
    children,
    className,
    ...props
}: React.PropsWithChildren<React.ComponentProps<"p">>) {
    return (
        <p className={cn("text-muted-foreground", className)} {...props}>
            {children}
        </p>
    );
}

export {
    MainLayout,
    MainLayoutDescription,
    MainLayoutSection,
    MainLayoutSubTitle,
    MainLayoutTitle,
    MainLayoutTitleSearchContainer,
};

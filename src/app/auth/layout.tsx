import { LandingFooter } from "@/frontend/components/layout/landing-footer";
import { LandingHeader } from "@/frontend/components/layout/landing-header";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex flex-col bg-background">
            <LandingHeader />
            <div className="flex-1 flex flex-col">{children}</div>
            <LandingFooter />
        </div>
    );
}

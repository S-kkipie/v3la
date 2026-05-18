import { viewPaths } from "@better-auth-ui/core";
import { notFound } from "next/navigation";

import { Auth } from "@/frontend/components/auth/auth";

export default async function AuthPage({
    params,
}: {
    params: Promise<{ path: string }>;
}) {
    const { path } = await params;

    if (!Object.values(viewPaths.auth).includes(path)) {
        notFound();
    }

    return (
        <main className="flex flex-1 items-center justify-center p-4 md:p-6">
            <Auth path={path} />
        </main>
    );
}

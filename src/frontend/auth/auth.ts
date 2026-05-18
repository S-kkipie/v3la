"use client";

import { passkeyClient } from "@better-auth/passkey/client";
import { createAuthClient } from "better-auth/react";
import { env } from "@/config/env";

export const authClient = createAuthClient({
    baseURL: `${env.NEXT_PUBLIC_BASE_URL}/api/v1/auth`,
    plugins: [passkeyClient()],
});

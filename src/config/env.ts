import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
    /*
     * Serverside Environment variables, not available on the client.
     */
    server: {
        DATABASE_URL: z.url(),
        GOOGLE_CLIENT_ID: z.string().min(1),
        GOOGLE_CLIENT_SECRET: z.string().min(1),
    },
    /*
     * Environment variables available on the client (and server).
     */
    client: {
        NEXT_PUBLIC_BASE_URL: z.url(),
    },
    /*
     * Due to how Next.js bundles environment variables on Edge and Client,
     * we need to manually destructure them to make sure all are included in bundle.
     *
     * 💡 You'll get type errors if not all variables from `server` & `client` are included here.
     */
    runtimeEnv: {
        DATABASE_URL: process.env.DATABASE_URL,
        NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    },
});

import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { passkey } from "@better-auth/passkey";
import { getLogger } from "@logtape/logtape";
import { APIError, betterAuth } from "better-auth";
import { multiSession, openAPI } from "better-auth/plugins";
import { headers } from "next/headers";
import { cache } from "react";
import ServerConfig from "@/config/server-config";
import { db } from "@/server/drizzle/db";
import * as authSchema from "@/server/drizzle/schemas/auth-schema";

const logger = getLogger(["server", "auth"]);

/**
 * Better Auth instance configuration.
 * Includes support for joins, social providers (Google), and organizations.
 */
export const auth = betterAuth({
    experimental: { joins: true },
    baseURL: ServerConfig.baseURL,
    basePath: "/api/v1/auth",
    socialProviders: {
        google: {
            clientId: ServerConfig.google.clientId,
            clientSecret: ServerConfig.google.clientSecret,
        },
    },
    plugins: [
        openAPI(),
        passkey({
            registration: {
                extensions: {
                    credProps: true,
                },
            },
            authentication: {
                extensions: {
                    credProps: true,
                },
            },
        }),
        multiSession(),
    ],
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: authSchema,
    }),
});

let _schema: ReturnType<typeof auth.api.generateOpenAPISchema>;
const getSchema = async () => (_schema ??= auth.api.generateOpenAPISchema());
export const OpenAPI = {
    getPaths: (prefix = "/api/v1/auth") =>
        getSchema().then(({ paths }) => {
            const reference: typeof paths = Object.create(null);
            for (const path of Object.keys(paths)) {
                const key = prefix + path;
                reference[key] = paths[path];
                for (const method of Object.keys(paths[path])) {
                    const operation = (reference[key] as any)[method];
                    operation.tags = ["Better Auth"];
                }
            }
            return reference;
        }) as Promise<any>,
    components: getSchema().then(
        ({ components }) => components,
    ) as Promise<any>,
} as const;

/**
 * Authenticates the current user and retrieves their session using cache.
 * Catches errors (e.g., UNAUTHORIZED) with a try/catch and logs them.
 *
 * @returns {Promise<AuthenticateResult>} A promise that resolves to an object with `user` and `session`, or `null` if there is an error or no session.
 */
export const authenticate = cache(async () => {
    try {
        const session = await auth.api.getSession({ headers: await headers() });

        if (!session) {
            return null;
        }

        return {
            user: session.user,
            session: session.session,
        };
    } catch (e) {
        if (e instanceof APIError) {
            logger.warn("API ERROR, auth error: {error}", { error: e });
            return null;
        }

        logger.error("Authentication error: {error}", { error: e });
        return null;
    }
});

export async function authenticateFromHeaders(requestHeaders: Headers) {
    try {
        const session = await auth.api.getSession({
            headers: requestHeaders,
        });

        if (!session) {
            return null;
        }

        return {
            user: session.user,
            session: session.session,
        };
    } catch (e) {
        if (e instanceof APIError) {
            logger.warn("API ERROR, auth error: {error}", { error: e });
            return null;
        }

        logger.error("Authentication error: {error}", { error: e });
        return null;
    }
}

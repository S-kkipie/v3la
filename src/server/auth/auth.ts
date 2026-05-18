import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { passkey } from "@better-auth/passkey";
import { getLogger } from "@logtape/logtape";
import { APIError, betterAuth } from "better-auth";
import { openAPI } from "better-auth/plugins";
import { headers } from "next/headers";
import { cache } from "react";
import ServerConfig from "@/config/server-config";
import { db } from "@/server/drizzle/db";

const logger = getLogger(["server", "auth"]);

/**
 * Better Auth instance configuration.
 * Includes support for joins, social providers (Google), and organizations.
 */
export const auth = betterAuth({
  experimental: { joins: true },
  baseURL: ServerConfig.baseURL,
  basePath: "/api/v1/auth",
  plugins: [
    openAPI(),
    passkey({
      registration: {
        extensions: {
          credProps: true,
          prf: true,
        } as Record<string, boolean>,
      },
      authentication: {
        extensions: {
          credProps: true,
          prf: true,
        } as Record<string, boolean>,
      },
    }),
  ],
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
});

/**
 * Authenticates the current user and retrieves their session using cache.
 * Catches errors (e.g., UNAUTHORIZED) with a try/catch and logs them.
 *
 * @returns {Promise<AuthenticateResult>} A promise that resolves to an object with `user` and `session`, or `null` if there is an error or no session.
 */
export const authenticate = cache(async () => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
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
});

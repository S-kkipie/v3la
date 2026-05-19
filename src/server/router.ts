import { cors } from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";
import { serverTiming } from "@elysiajs/server-timing";
import { elysiaLogger } from "@logtape/elysia";
import { Elysia } from "elysia";
import { z } from "zod";
import { env } from "@/config/env";
import ServerConfig from "@/config/server-config";
import { auth, OpenAPI } from "./auth/auth";
import type { APIResponse, STATUS_MAP } from "./common/reponses";
import { walletRouter } from "./wallet/router";

const betterAuth = new Elysia({ name: "better-auth" }).mount(auth.handler);

const app = new Elysia({ prefix: "/api/v1" })
    .use(betterAuth)
    .use(
        cors({
            origin: env.NEXT_PUBLIC_BASE_URL,
            methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            credentials: true,
            allowedHeaders: ["Content-Type", "Authorization"],
        }),
    )
    .use(
        openapi({
            documentation: {
                paths: await OpenAPI.getPaths(),
                components: await OpenAPI.components,
                tags: [
                    {
                        name: "Common",
                        description: "Commonly used endpoints",
                    },
                ],
                info: {
                    title: ServerConfig.info.name,
                    version: ServerConfig.info.version,
                    description: ServerConfig.info.description,
                },
            },
            mapJsonSchema: {
                zod: z.toJSONSchema,
            },
        }),
    )
    .use(serverTiming())
    .use(elysiaLogger())
    .onError(({ error, code }) => {
        console.log(error);
        if (code === "VALIDATION")
            return {
                code,
                status: error.status as keyof typeof STATUS_MAP,
                response: error.valueError,
                targets:
                    typeof error.valueError?.path === "string"
                        ? [error.valueError.path]
                        : error.valueError?.path,
            } satisfies APIResponse<unknown>;

        return {
            code: "INTERNAL_SERVER_ERROR",
            status: 500,
        } satisfies APIResponse;
    })
    .use(walletRouter);

export default app;
export type AppRouter = typeof app;

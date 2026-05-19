import { Elysia } from "elysia";
import { z } from "zod";
import { authenticateFromHeaders } from "@/server/auth/auth";
import { CommonResponse } from "@/server/common/reponses";
import { createWalletForUser, getWalletDetailsForUser } from "./service";

const walletAccessSchema = z.object({
    accessId: z.string(),
    passkeyId: z.string(),
    credentialId: z.string(),
    kdfVersion: z.string(),
    cipherVersion: z.string(),
    createdAt: z.string(),
    lastUsedAt: z.string().nullable(),
});

const walletSummarySchema = z.object({
    walletId: z.string(),
    publicKey: z.string(),
    chain: z.string(),
    status: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

const passkeySchema = z.object({
    id: z.string(),
    name: z.string().nullable(),
    credentialId: z.string(),
    createdAt: z.string().nullable(),
});

const provisionRequestSchema = z.object({
    walletId: z.string().min(1),
    publicKey: z.string().min(1),
    passkeyId: z.string().min(1),
    wrappedSeed: z.string().min(1),
    iv: z.string().min(1),
    aad: z.string().min(1),
    kdfVersion: z.string().min(1),
    cipherVersion: z.string().min(1),
});

const walletMeResponseSchema = z.object({
    response: z.object({
        userId: z.string(),
        wallet: walletSummarySchema.nullable(),
        accesses: z.array(walletAccessSchema),
        passkeys: z.array(passkeySchema),
    }),
    code: z.literal("OK"),
    status: z.literal(200),
});

const unauthorizedResponseSchema = z.object({
    code: z.string(),
    status: z.literal(401),
});

const provisionResponseSchema = z.object({
    response: z.object({
        walletId: z.string(),
        publicKey: z.string(),
        chain: z.string(),
        status: z.string(),
        createdAt: z.string(),
        updatedAt: z.string(),
        accessId: z.string(),
        passkeyId: z.string(),
        credentialId: z.string(),
    }),
    code: z.literal("OK"),
    status: z.literal(200),
});

const badRequestResponseSchema = z.object({
    code: z.string(),
    status: z.literal(400),
});

const conflictResponseSchema = z.object({
    code: z.string(),
    status: z.literal(409),
});

export const walletRouter = new Elysia({ prefix: "/wallet" }).get(
    "/me",
    async ({ request, set }) => {
        const auth = await authenticateFromHeaders(request.headers);

        if (!auth) {
            set.status = 401;
            return {
                code: "UNAUTHORIZED",
                status: 401 as const,
            };
        }

        const details = await getWalletDetailsForUser(auth.user.id);

        return CommonResponse.successful({
            response: {
                userId: details.userId,
                wallet: details.wallet
                    ? {
                          ...details.wallet,
                          createdAt: details.wallet.createdAt.toISOString(),
                          updatedAt: details.wallet.updatedAt.toISOString(),
                      }
                    : null,
                accesses: details.accesses.map((access) => ({
                    ...access,
                          createdAt: access.createdAt.toISOString(),
                          lastUsedAt: access.lastUsedAt?.toISOString() ?? null,
                      })),
                passkeys: details.passkeys.map((passkey) => ({
                    ...passkey,
                    createdAt: passkey.createdAt?.toISOString() ?? null,
                })),
            },
        });
    },
    {
        detail: {
            tags: ["Wallet"],
            summary: "Get embedded wallet metadata for the authenticated user",
        },
        response: {
            200: walletMeResponseSchema,
            401: unauthorizedResponseSchema,
        },
    },
)
    .post(
        "/provision",
        async ({ body, request, set }) => {
            const auth = await authenticateFromHeaders(request.headers);

            if (!auth) {
                set.status = 401;
                return {
                    code: "UNAUTHORIZED",
                    status: 401 as const,
                };
            }

            try {
                const wallet = await createWalletForUser(auth.user.id, body);

                return CommonResponse.successful({
                    response: {
                        walletId: wallet.walletId,
                        publicKey: wallet.publicKey,
                        chain: wallet.chain,
                        status: wallet.status,
                        createdAt: wallet.createdAt.toISOString(),
                        updatedAt: wallet.updatedAt.toISOString(),
                        accessId: wallet.accessId,
                        passkeyId: wallet.passkeyId,
                        credentialId: wallet.credentialId,
                    },
                });
            } catch (error) {
                if (
                    error instanceof Error &&
                    error.message === "EMBEDDED_WALLET_ALREADY_EXISTS"
                ) {
                    set.status = 409;
                    return {
                        code: "EMBEDDED_WALLET_ALREADY_EXISTS",
                        status: 409 as const,
                    };
                }

                if (error instanceof Error && error.message === "PASSKEY_NOT_FOUND") {
                    set.status = 400;
                    return {
                        code: "PASSKEY_NOT_FOUND",
                        status: 400 as const,
                    };
                }

                throw error;
            }
        },
        {
            body: provisionRequestSchema,
            detail: {
                tags: ["Wallet"],
                summary: "Provision an embedded wallet for the authenticated user",
            },
            response: {
                200: provisionResponseSchema,
                400: badRequestResponseSchema,
                401: unauthorizedResponseSchema,
                409: conflictResponseSchema,
            },
        },
    );

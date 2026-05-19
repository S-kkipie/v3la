import { and, eq } from "drizzle-orm";
import { db } from "@/server/drizzle/db";
import { passkey } from "@/server/drizzle/schemas/auth-schema";
import {
    embeddedWallet,
    embeddedWalletAccess,
} from "@/server/drizzle/schemas/wallet-schema";

export type WalletSummary = {
    walletId: string;
    publicKey: string;
    chain: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
};

export type WalletAccessSummary = {
    accessId: string;
    passkeyId: string;
    credentialId: string;
    kdfVersion: string;
    cipherVersion: string;
    createdAt: Date;
    lastUsedAt: Date | null;
};

export type WalletDetails = {
    userId: string;
    wallet: WalletSummary | null;
    accesses: WalletAccessSummary[];
    passkeys: PasskeySummary[];
};

export type PasskeySummary = {
    id: string;
    name: string | null;
    credentialId: string;
    createdAt: Date | null;
};

export async function getWalletDetailsForUser(
    userId: string,
): Promise<WalletDetails> {
    const passkeys = await db.query.passkey.findMany({
        where: eq(passkey.userId, userId),
        orderBy: (table, { asc }) => [asc(table.createdAt), asc(table.id)],
    });

    const wallet = await db.query.embeddedWallet.findFirst({
        where: eq(embeddedWallet.userId, userId),
    });

    if (!wallet) {
        return {
            userId,
            wallet: null,
            accesses: [],
            passkeys: passkeys.map((item) => ({
                id: item.id,
                name: item.name,
                credentialId: item.credentialID,
                createdAt: item.createdAt,
            })),
        };
    }

    const accesses = await db.query.embeddedWalletAccess.findMany({
        where: and(
            eq(embeddedWalletAccess.userId, userId),
            eq(embeddedWalletAccess.walletId, wallet.id),
        ),
        orderBy: (table, { asc }) => [asc(table.createdAt)],
    });

    return {
        userId,
        wallet: {
            walletId: wallet.id,
            publicKey: wallet.publicKey,
            chain: wallet.chain,
            status: wallet.status,
            createdAt: wallet.createdAt,
            updatedAt: wallet.updatedAt,
        },
        accesses: accesses.map((access) => ({
            accessId: access.id,
            passkeyId: access.passkeyId,
            credentialId: access.credentialId,
            kdfVersion: access.kdfVersion,
            cipherVersion: access.cipherVersion,
            createdAt: access.createdAt,
            lastUsedAt: access.lastUsedAt,
        })),
        passkeys: passkeys.map((item) => ({
            id: item.id,
            name: item.name,
            credentialId: item.credentialID,
            createdAt: item.createdAt,
        })),
    };
}

export type CreateWalletInput = {
    cipherVersion: string;
    kdfVersion: string;
    walletId: string;
    passkeyId: string;
    publicKey: string;
    wrappedSeed: string;
    iv: string;
    aad: string;
};

export async function createWalletForUser(
    userId: string,
    input: CreateWalletInput,
) {
    const existingWallet = await db.query.embeddedWallet.findFirst({
        where: eq(embeddedWallet.userId, userId),
    });

    if (existingWallet) {
        throw new Error("EMBEDDED_WALLET_ALREADY_EXISTS");
    }

    const userPasskey = await db.query.passkey.findFirst({
        where: and(eq(passkey.userId, userId), eq(passkey.id, input.passkeyId)),
    });

    if (!userPasskey) {
        throw new Error("PASSKEY_NOT_FOUND");
    }

    const accessId = crypto.randomUUID();
    const now = new Date();

    await db.transaction(async (tx) => {
        await tx.insert(embeddedWallet).values({
            id: input.walletId,
            userId,
            publicKey: input.publicKey,
            chain: "solana",
            status: "active",
            createdAt: now,
            updatedAt: now,
        });

        await tx.insert(embeddedWalletAccess).values({
            id: accessId,
            walletId: input.walletId,
            userId,
            passkeyId: userPasskey.id,
            credentialId: userPasskey.credentialID,
            kdfVersion: input.kdfVersion,
            cipherVersion: input.cipherVersion,
            wrappedSeed: input.wrappedSeed,
            iv: input.iv,
            aad: input.aad,
            createdAt: now,
            lastUsedAt: null,
        });
    });

    return {
        walletId: input.walletId,
        publicKey: input.publicKey,
        chain: "solana",
        status: "active",
        createdAt: now,
        updatedAt: now,
        accessId,
        credentialId: userPasskey.credentialID,
        passkeyId: userPasskey.id,
    };
}

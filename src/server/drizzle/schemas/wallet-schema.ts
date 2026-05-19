import { relations } from "drizzle-orm";
import {
    index,
    jsonb,
    pgTable,
    text,
    timestamp,
    unique,
} from "drizzle-orm/pg-core";
import { passkey, user } from "./auth-schema";

export const embeddedWallet = pgTable(
    "embedded_wallet",
    {
        id: text("id").primaryKey(),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        publicKey: text("public_key").notNull().unique(),
        chain: text("chain").notNull().default("solana"),
        status: text("status").notNull().default("active"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => /* @__PURE__ */ new Date())
            .notNull(),
    },
    (table) => [
        index("embedded_wallet_user_id_idx").on(table.userId),
        index("embedded_wallet_public_key_idx").on(table.publicKey),
    ],
);

export const embeddedWalletAccess = pgTable(
    "embedded_wallet_access",
    {
        id: text("id").primaryKey(),
        walletId: text("wallet_id")
            .notNull()
            .references(() => embeddedWallet.id, { onDelete: "cascade" }),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        passkeyId: text("passkey_id")
            .notNull()
            .references(() => passkey.id, { onDelete: "cascade" }),
        credentialId: text("credential_id").notNull(),
        kdfVersion: text("kdf_version").notNull(),
        cipherVersion: text("cipher_version").notNull(),
        wrappedSeed: text("wrapped_seed").notNull(),
        iv: text("iv").notNull(),
        aad: text("aad"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        lastUsedAt: timestamp("last_used_at"),
    },
    (table) => [
        index("embedded_wallet_access_wallet_id_idx").on(table.walletId),
        index("embedded_wallet_access_user_id_idx").on(table.userId),
        index("embedded_wallet_access_passkey_id_idx").on(table.passkeyId),
        index("embedded_wallet_access_credential_id_idx").on(
            table.credentialId,
        ),
        unique("embedded_wallet_access_wallet_passkey_unique").on(
            table.walletId,
            table.passkeyId,
        ),
        unique("embedded_wallet_access_wallet_credential_unique").on(
            table.walletId,
            table.credentialId,
        ),
    ],
);

export const embeddedWalletOperation = pgTable(
    "embedded_wallet_operation",
    {
        id: text("id").primaryKey(),
        walletId: text("wallet_id")
            .notNull()
            .references(() => embeddedWallet.id, { onDelete: "cascade" }),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        type: text("type").notNull(),
        status: text("status").notNull(),
        origin: text("origin"),
        metadata: jsonb("metadata"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => [
        index("embedded_wallet_operation_wallet_id_idx").on(table.walletId),
        index("embedded_wallet_operation_user_id_idx").on(table.userId),
    ],
);

export const embeddedWalletRelations = relations(
    embeddedWallet,
    ({ many, one }) => ({
        user: one(user, {
            fields: [embeddedWallet.userId],
            references: [user.id],
        }),
        accesses: many(embeddedWalletAccess),
        operations: many(embeddedWalletOperation),
    }),
);

export const embeddedWalletAccessRelations = relations(
    embeddedWalletAccess,
    ({ one }) => ({
        wallet: one(embeddedWallet, {
            fields: [embeddedWalletAccess.walletId],
            references: [embeddedWallet.id],
        }),
        user: one(user, {
            fields: [embeddedWalletAccess.userId],
            references: [user.id],
        }),
        passkey: one(passkey, {
            fields: [embeddedWalletAccess.passkeyId],
            references: [passkey.id],
        }),
    }),
);

export const embeddedWalletOperationRelations = relations(
    embeddedWalletOperation,
    ({ one }) => ({
        wallet: one(embeddedWallet, {
            fields: [embeddedWalletOperation.walletId],
            references: [embeddedWallet.id],
        }),
        user: one(user, {
            fields: [embeddedWalletOperation.userId],
            references: [user.id],
        }),
    }),
);

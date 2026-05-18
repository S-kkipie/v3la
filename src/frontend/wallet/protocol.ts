import { z } from "zod";

export const PROTOCOL_VERSION = "vela-wallet:v1";

export const MessageType = {
    WALLET_SIGN: "WALLET_SIGN",
    WALLET_SIGN_RESPONSE: "WALLET_SIGN_RESPONSE",
    WALLET_SIGN_ERROR: "WALLET_SIGN_ERROR",
    WALLET_READY: "WALLET_READY",
    WALLET_ADDRESS: "WALLET_ADDRESS",
} as const;

export type MessageType = (typeof MessageType)[keyof typeof MessageType];

const BaseMessageSchema = z.object({
    protocol: z.literal(PROTOCOL_VERSION),
    type: z.string(),
    requestId: z.string().min(1),
});

export const SignRequestSchema = BaseMessageSchema.extend({
    type: z.literal(MessageType.WALLET_SIGN),
    tx: z.string(),
});

export const SignResponseSchema = BaseMessageSchema.extend({
    type: z.literal(MessageType.WALLET_SIGN_RESPONSE),
    signature: z.string(),
});

export const SignErrorSchema = BaseMessageSchema.extend({
    type: z.literal(MessageType.WALLET_SIGN_ERROR),
    error: z.string(),
});

export const WalletReadySchema = BaseMessageSchema.extend({
    type: z.literal(MessageType.WALLET_READY),
    ready: z.literal(true),
});

export const WalletAddressSchema = BaseMessageSchema.extend({
    type: z.literal(MessageType.WALLET_ADDRESS),
    address: z.string(),
});

export interface BaseMessage {
    protocol: string;
    type: string;
    requestId: string;
}

export interface SignRequest extends BaseMessage {
    type: typeof MessageType.WALLET_SIGN;
    tx: string;
}

export interface SignResponse extends BaseMessage {
    type: typeof MessageType.WALLET_SIGN_RESPONSE;
    signature: string;
}

export interface SignError extends BaseMessage {
    type: typeof MessageType.WALLET_SIGN_ERROR;
    error: string;
}

export interface WalletReady extends BaseMessage {
    type: typeof MessageType.WALLET_READY;
    ready: true;
}

export interface WalletAddress extends BaseMessage {
    type: typeof MessageType.WALLET_ADDRESS;
    address: string;
}

export type WalletMessage =
    | SignRequest
    | SignResponse
    | SignError
    | WalletReady
    | WalletAddress;

const schemaRegistry: Record<MessageType, z.ZodSchema> = {
    [MessageType.WALLET_SIGN]: SignRequestSchema,
    [MessageType.WALLET_SIGN_RESPONSE]: SignResponseSchema,
    [MessageType.WALLET_SIGN_ERROR]: SignErrorSchema,
    [MessageType.WALLET_READY]: WalletReadySchema,
    [MessageType.WALLET_ADDRESS]: WalletAddressSchema,
};

function generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function createSignRequest(tx: string, requestId?: string): SignRequest {
    if (!tx || typeof tx !== "string") {
        throw new Error(
            "Invalid transaction: must be a non-empty base64 string",
        );
    }
    return {
        protocol: PROTOCOL_VERSION,
        type: MessageType.WALLET_SIGN,
        tx,
        requestId: requestId ?? generateRequestId(),
    };
}

export function parseMessage(data: unknown): WalletMessage {
    if (!data || typeof data !== "object") {
        throw new Error("Invalid message: must be an object");
    }

    const obj = data as Record<string, unknown>;

    if (!isValidProtocolVersion(obj.protocol as string)) {
        throw new Error(
            `Invalid protocol version: ${obj.protocol}. Expected: ${PROTOCOL_VERSION}`,
        );
    }

    const type = obj.type as string;
    if (!type || !Object.values(MessageType).includes(type as MessageType)) {
        throw new Error(`Unknown message type: ${type}`);
    }

    const schema = schemaRegistry[type as MessageType];
    if (!schema) {
        throw new Error(`No schema found for message type: ${type}`);
    }

    return schema.parse(data) as WalletMessage;
}

export function isValidProtocolVersion(version: string): boolean {
    return version === PROTOCOL_VERSION;
}

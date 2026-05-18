import { z } from "zod";
import { PAGINATION_LIMIT } from "../constants";

// ─── Pagination ──────────────────────────────────────────────────────

/** Schema for standard paginated request params. */
export const paginationRequestSchema = z
    .object({
        page: z.number().int().min(1).describe("example: 1"),
        perPage: z
            .number()
            .int()
            .min(1)
            .max(20)
            .describe(`example: ${PAGINATION_LIMIT}`),
    })
    .describe("Pagination");

/** Schema for LLM-oriented pagination (page only, fixed size). */
export const paginationRequestMcpSchema = z
    .object({
        page: z.number().int().min(1).describe("example: 1"),
    })
    .describe("PaginationMcp");

/** Schema for a paginated response envelope with `hasMore` flag. */
export const paginationResponseSchema = <T extends z.ZodTypeAny>(
    itemSchema: T,
    modelName: string,
) =>
    z
        .object({
            data: z.array(itemSchema),
            hasMore: z.boolean().describe("example: false"),
        })
        .describe(`${modelName}PaginationResponse`);

/**
 * Response schema for paginated table lists.
 *
 * @param itemSchema - Zod schema for the items in the array.
 * @param modelName - Name of the model.
 */
export const tablePaginationResponseSchema = <T extends z.ZodTypeAny>(
    itemSchema: T,
    modelName: string,
) =>
    z
        .object({
            data: z.array(itemSchema),
            pageCount: z.number().int().describe("example: 1"),
        })
        .describe(`${modelName}TablePaginationResponse`);

// ─── Types ───────────────────────────────────────────────────────────

export type TablePagination<D> = {
    data: D;
    pageCount: number;
};

export type PaginationResponse<D> = {
    data: D;
    hasMore: boolean;
};

export type APIResponse<D = undefined> = {
    response?: D;
    targets?: string[];
    code: string;
    status: keyof typeof STATUS_MAP;
};

type SuccessfulParams<T> = {
    /**
     * Data sent in the JSON body.
     *
     * @default undefined
     */
    response?: T;
    /**
     * Response code for i18n.
     *
     * @default "OK"
     */
    code?: string;
};

// ─── API Response Schemas (OpenAPI) ──────────────────────────────────

/** Base API error response used across 400/401/403/500 responses. */
export const errorResponseSchema = (status?: keyof typeof STATUS_MAP) =>
    z
        .object({
            code: z.string().describe("example: BAD_REQUEST"),
            status: z
                .literal(status ?? 500)
                .describe(`example: ${status ?? 400}`),
            targets: z
                .array(z.string())
                .optional()
                .describe('example: ["name"]'),
        })
        .describe("ErrorResponse");

/**
 * Factory that builds a typed success response schema.
 *
 * @param dataSchema - Zod schema for the `response` payload
 * @returns An OpenAPI-annotated object schema
 */
export const successResponseSchema = <T extends z.ZodTypeAny>(
    dataSchema: T,
    modelName: string,
) =>
    z
        .object({
            response: dataSchema,
            code: z.literal("OK"),
            status: z.literal(200),
        })
        .describe(`${modelName}SuccessResponse`);

/** Schema for batch operation results (deleteMany / updateMany). */
export const batchResultSchema = z
    .object({
        response: z
            .object({
                count: z.number().int().describe("example: 3"),
            })
            .optional(),
        code: z.string().describe("example: OK"),
        status: z.number().int().describe("example: 200"),
    })
    .describe("BatchResult");

// ─── Common Response Helpers ─────────────────────────────────────────

/**
 * Pre-built API response helpers for common HTTP status scenarios.
 */
export const CommonResponse = {
    /** @returns 400 — missing or invalid ID */
    invalidId({ code = "INVALID_ID" }: { code?: string }): APIResponse {
        return {
            code,
            status: 400 as const,
            response: undefined,
        };
    },

    /** @returns 400 — malformed request body */
    invalidBody({ code = "INVALID_BODY" }: { code?: string }): APIResponse {
        return {
            code,
            status: 400 as const,
        };
    },

    /**
     * @returns 200 — successful response with optional payload
     * @param params.response - Data to include in the response body
     * @param params.code  - Custom code (default: "OK")
     */
    successful<T>(params?: SuccessfulParams<T>): {
        response: T;
        code: "OK";
        status: 200;
    } {
        const { response, code = "OK" } = {
            response: undefined as T | undefined,
            ...params,
        };
        return {
            response: response as T,
            code: code as "OK",
            status: 200,
        };
    },

    /** @returns 401 — unauthenticated */
    unauthorized(): APIResponse {
        return {
            code: "UNAUTHORIZED",
            status: 401,
        };
    },

    /** @returns 403 — insufficient permissions */
    forbidden({ code = "FORBIDDEN" }: { code?: string }): APIResponse {
        return {
            code,
            status: 403,
            response: undefined,
        };
    },

    /** @returns 400 — custom bad-request message */
    badRequest({
        code = "BAD_REQUEST",
        targets,
    }: {
        code?: string;
        targets?: string[];
    }): { code: string; status: 400; targets?: string[] } {
        return { code, status: 400, targets };
    },
} as const;

export const STATUS_MAP = {
    200: "OK",
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    409: "CONFLICT",
    500: "INTERNAL_SERVER_ERROR",
} as const;

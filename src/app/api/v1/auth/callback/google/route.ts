import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth/auth";

/**
 * Intercepts Better Auth's Google OAuth callback.
 *
 * When `mapProfileToUser` throws an `APIError`, Better Auth returns JSON
 * instead of redirecting to `errorCallbackURL`. This handler catches those
 * error responses and redirects to `/login?error=...` so `ErrorToast` can
 * display them.
 */
async function handleCallback(request: NextRequest) {
    const response = await auth.handler(request);

    if (!response.ok) {
        try {
            const body = (await response.json()) as { message?: string };

            if (body.message) {
                return NextResponse.redirect(
                    new URL(
                        `/login?error=${encodeURIComponent(body.message)}`,
                        request.url,
                    ),
                );
            }
        } catch {
            // JSON parse failed — pass through original response
        }
    }

    return response;
}

export { handleCallback as GET, handleCallback as POST };

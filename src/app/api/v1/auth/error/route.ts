import { type NextRequest, NextResponse } from "next/server";

/**
 * Intercepts Better Auth's error page and redirects to `/login`
 * with the error code as a query parameter for `ErrorToast` display.
 */
function handleAuthError(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const error = searchParams.get("error");

    const redirectUrl = new URL("/login", request.url);
    if (error) {
        redirectUrl.searchParams.set("error", error);
    }

    return NextResponse.redirect(redirectUrl);
}

export { handleAuthError as GET, handleAuthError as POST };

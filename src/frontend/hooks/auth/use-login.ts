import { toast } from "sonner";
import { authClient } from "@/frontend/auth/auth";
import { useChildLogger } from "@/frontend/context/logger-context";

/**
 * Custom hook to manage Google authentication logic.
 *
 * @returns An object containing the Google sign-in handler
 */
export function useLogin() {
    const logger = useChildLogger(["login"]);

    /**
     * Handles authentication errors by logging and showing a toast notification.
     *
     * @param ctx - The error context from the auth client
     */
    const handleAuthError = (ctx: {
        error: { status?: number; [key: string]: unknown };
    }) => {
        logger.warn("Auth error: {error}", { error: ctx.error });
        toast.error(
            ctx.error.status === 404
                ? "Usuario no encontrado"
                : "Error al iniciar sesión",
        );
    };

    /**
     * Handles Google social sign in.
     */
    const handleGoogleSignIn = async () => {
        await authClient.signIn.social(
            {
                provider: "google",
                errorCallbackURL: "/login",
            },
            {
                onError: handleAuthError,
            },
        );
    };

    return {
        handleGoogleSignIn,
    };
}

"use client";
import { getLogger } from "@logtape/logtape";
import { useQueryState } from "nuqs";
import { useEffect } from "react";
import { toast } from "sonner";

const logger = getLogger(["sgpu", "frontend", "components", "error-toast"]);

/**
 * Maps raw error strings from OAuth providers to user-friendly Spanish messages.
 */
const OAUTH_ERROR_MAP: Record<string, string> = {
    "No email": "No se pudo obtener el correo electrónico de Google",
    "Not allowed": "Correo no autorizado",
    signup_disabled: "No tienes permiso para iniciar sesión",
    banned: "Tu cuenta ha sido suspendida. Contacta al administrador.",
};

/**
 * Displays error toast notifications based on URL query parameters.
 *
 * Reads `error_message` (custom app errors) and `error` (Better Auth OAuth redirect errors).
 * Clears the param after displaying to prevent duplicate toasts on re-render.
 *
 * @returns A null-rendering component (side-effects only).
 */
export function ErrorToast() {
    const [errorMessage, setErrorMessage] = useQueryState("error_message", {
        defaultValue: "",
    });
    const [error, setError] = useQueryState("error", {
        defaultValue: "",
    });

    useEffect(() => {
        if (errorMessage) {
            toast.error(errorMessage);
            logger.error(errorMessage);
            setErrorMessage(null);
        }
    }, [errorMessage, setErrorMessage]);

    useEffect(() => {
        if (error) {
            const friendly = OAUTH_ERROR_MAP[error] ?? "Error de autenticación";
            toast.error(friendly);
            logger.error("OAuth error: {error}", { error });
            setError(null);
        }
    }, [error, setError]);

    return null;
}

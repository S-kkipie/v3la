"use client";

import { Button } from "@/frontend/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/frontend/components/ui/card";
import { useLogin } from "../hooks/use-login";
import { GoogleIcon } from "./google-icon";

/**
 * Login component that provides Google OAuth authentication.
 *
 * @returns The rendered login form component
 */
export default function LogIn() {
    const { handleGoogleSignIn } = useLogin();

    return (
        <Card className="w-full max-w-sm sm:max-w-md md:max-w-lg mx-auto shadow-md">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold tracking-tight">
                    Iniciar Sesión
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                    Inicie sesión con su cuenta de Google
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center gap-4">
                    <Button
                        variant="outline"
                        className="gap-2 w-full py-4"
                        onClick={handleGoogleSignIn}
                    >
                        <GoogleIcon size={16} />
                        Continue with Google
                    </Button>
                </div>
            </CardContent>
            <CardFooter>
                <div className="flex justify-center w-full pt-4">
                    <p className="text-center text-xs text-muted-foreground">
                        Developed by{" "}
                        <span className="text-orange-400 font-medium">
                            AI-DO
                        </span>{" "}
                        team.
                    </p>
                </div>
            </CardFooter>
        </Card>
    );
}

"use client";

import { Calendar } from "lucide-react";
import { Suspense } from "react";
import { Badge } from "@/frontend/components/ui/badge";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/frontend/components/ui/card";
import { Skeleton } from "@/frontend/components/ui/skeleton";
import { useAuth } from "@/frontend/context/auth-context";

function DashboardContent() {
    const { user } = useAuth();
    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Dashboard
                    </h1>
                    <p className="text-muted-foreground">
                        Bienvenido de nuevo, {user.name || user.email}
                    </p>
                </div>
                <Badge variant="secondary" className="text-sm">
                    VelaScore: 0
                </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Próximo Pago"
                    value={"N/A"}
                    icon={<Calendar className="h-4 w-4" />}
                    isLoading={false}
                />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Tus Préstamos</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Gestiona tus préstamos activos y solicita nuevos.
                    </p>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        No tienes préstamos activos. Solicita tu primer préstamo
                        para empezar a construir tu historial crediticio.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

function StatCard({
    title,
    value,
    icon,
    isLoading,
}: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    isLoading: boolean;
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <Skeleton className="h-7 w-20" />
                ) : (
                    <div className="text-2xl font-bold">{value}</div>
                )}
            </CardContent>
        </Card>
    );
}

function DashboardLoading() {
    return (
        <div className="flex flex-col gap-6">
            <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-48" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="pb-2">
                            <Skeleton className="h-4 w-32" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-7 w-20" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<DashboardLoading />}>
            <DashboardContent />
        </Suspense>
    );
}

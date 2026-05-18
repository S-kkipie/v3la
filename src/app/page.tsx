"use client";

import {
    ArrowRight,
    Brain,
    CheckCircle2,
    Clock,
    Quote,
    Shield,
    Sparkles,
    Star,
    Target,
    TrendingUp,
    Wallet,
} from "lucide-react";
import Link from "next/link";
import { LandingFooter } from "@/frontend/components/layout/landing-footer";
import { LandingHeader } from "@/frontend/components/layout/landing-header";
import { Badge } from "@/frontend/components/ui/badge";
import { Button } from "@/frontend/components/ui/button";
import { Card, CardContent } from "@/frontend/components/ui/card";
import { Separator } from "@/frontend/components/ui/separator";

const problemCards = [
    {
        icon: Wallet,
        title: "Sin acceso a crédito",
        description:
            "Los bancos tradicionales piden requisitos imposibles. Millones de mujeres emprendedoras quedan fuera del sistema financiero.",
    },
    {
        icon: TrendingUp,
        title: "Financiamiento riesgoso",
        description:
            "Las opciones informales tienen tasas abusivas y condiciones poco transparentes que ponen en riesgo tu negocio y tu familia.",
    },
    {
        icon: Brain,
        title: "Tecnología complicada",
        description:
            "Las herramientas financieras digitales son difíciles de entender. Por eso VELA usa un agente de IA que te guía sin tecnicismos.",
    },
];

const valueProps = [
    {
        icon: Shield,
        title: "Crea tu perfil financiero digital",
        description:
            "En minutos, construye un perfil que muestra tu potencial como emprendedora. Sin papeleo, sin filas.",
    },
    {
        icon: Target,
        title: "Registra ingresos y objetivos",
        description:
            "Lleva un control simple de tu dinero y define metas claras para tu negocio. Todo en un solo lugar.",
    },
    {
        icon: Sparkles,
        title: "Crédito seguro con Web3",
        description:
            "Accede a financiamiento transparente y descentralizado, sin intermediarios abusivos. Tus datos están protegidos en la blockchain.",
    },
    {
        icon: Brain,
        title: "Agente IA que te guía",
        description:
            "Nuestro agente de inteligencia artificial te acompaña en cada paso: responde tus dudas, te recomienda opciones y simplifica todo por ti.",
    },
];

const steps = [
    {
        number: 1,
        title: "Regístrate en minutos",
        description:
            "Crea tu cuenta con tu nombre y número de teléfono. Sin documentos complicados.",
    },
    {
        number: 2,
        title: "Nuestro agente IA crea tu perfil",
        description:
            "Responde preguntas simples y nuestro agente de IA construye tu perfil financiero digital automáticamente.",
    },
    {
        number: 3,
        title: "Accede a crédito Web3",
        description:
            "VELA te conecta con financiamiento descentralizado, transparente y sin intermediarios abusivos.",
    },
    {
        number: 4,
        title: "Haz crecer tu negocio",
        description:
            "Usa el financiamiento para invertir en lo que necesitas. VELA te apoya en el camino.",
    },
];

const stats = [
    { value: "2,500+", label: "Emprendedoras activas" },
    { value: "S/ 1.2M", label: "En financiamiento otorgado" },
    { value: "95%", label: "Tasa de satisfacción" },
    { value: "12", label: "Regiones del Perú" },
];

const testimonials = [
    {
        name: "María García",
        role: "Dueña de panadería",
        location: "Lima",
        quote: "Antes nadie me daba crédito. Con VELA pude mostrar que mi negocio es real y conseguí el financiamiento para comprar un horno nuevo. Mis ventas crecieron un 40%.",
        badge: "+40% ventas",
    },
    {
        name: "Ana Lucía Torres",
        role: "Artesana textil",
        location: "Cusco",
        quote: "Lo más bonito es que no necesité a nadie que me explicara. La plataforma me fue guiando paso a paso. Ahora tengo mi taller propio.",
        badge: "Taller propio",
    },
    {
        name: "Carmen Reyes",
        role: "Tienda de abarrotes",
        location: "Arequipa",
        quote: "Tenía miedo de pedir un préstamo por las tasas altas. VELA me conectó con opciones transparentes. Por primera vez siento que tengo el control.",
        badge: "Control financiero",
    },
];

function getInitials(name: string) {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

export default function Home() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <LandingHeader />

            <main>
                {/* HERO */}
                <section className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-muted/50 via-background to-muted/30" />
                    <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_1px_1px,currentColor_1px,transparent_0)] [background-size:24px_24px]" />

                    <div className="relative container mx-auto px-4 md:px-6 py-16 md:py-24 lg:py-32">
                        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                            {/* Left */}
                            <div className="space-y-8">
                                <Badge
                                    variant="secondary"
                                    className="text-sm px-4 py-1"
                                >
                                    Financiamiento justo para ti
                                </Badge>

                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-foreground">
                                    Tu negocio merece crecer{" "}
                                    <span className="text-primary">
                                        sin barreras
                                    </span>
                                </h1>

                                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl">
                                    VELA usa tecnología Web3 y un agente de IA
                                    para crear tu perfil financiero digital,
                                    conectarte con oportunidades de crédito
                                    seguras y guiarte paso a paso. Sin
                                    complicaciones, sin tecnicismos.
                                </p>

                                <div className="flex flex-col sm:flex-row gap-4">
                                <Link href="/auth/sign-up">
                                    <Button
                                        size="lg"
                                        className="rounded-full px-8 text-base"
                                    >
                                        Crear mi Perfil Gratis
                                    </Button>
                                </Link>
                                <Link
                                    href="#como-funciona"
                                    className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
                                >
                                    ¿Cómo funciona?
                                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                                </Link>
                                </div>

                                {/* Trust badges */}
                                <div className="flex flex-wrap gap-6 pt-4">
                                    {[
                                        { icon: Shield, label: "100% seguro" },
                                        {
                                            icon: CheckCircle2,
                                            label: "Sin costo inicial",
                                        },
                                        { icon: Star, label: "Fácil de usar" },
                                    ].map(({ icon: Icon, label }) => (
                                        <div
                                            key={label}
                                            className="flex items-center gap-2"
                                        >
                                            <Icon className="size-4 text-primary" />
                                            <span className="text-sm text-muted-foreground">
                                                {label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Right - Floating Profile Card */}
                            <div className="relative flex justify-center lg:justify-end">
                                <div className="relative w-full max-w-sm">
                                    {/* Glow */}
                                    <div className="absolute -inset-4 bg-primary/10 rounded-3xl blur-2xl" />

                                    <Card className="relative rounded-2xl shadow-[0_20px_60px_-15px_rgba(226,0,122,0.15)] border-border/80">
                                        <CardContent className="p-6 space-y-5">
                                            {/* Card Header */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                                        <Shield className="size-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-foreground">
                                                            Mi Perfil VELA
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Verificado en
                                                            blockchain ✓
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <Separator />

                                            {/* Stats */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <p className="text-xs text-muted-foreground">
                                                        Puntaje financiero
                                                    </p>
                                                    <p className="text-xl font-bold text-foreground">
                                                        85/100
                                                    </p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs text-muted-foreground">
                                                        Ingresos/mes
                                                    </p>
                                                    <p className="text-xl font-bold text-foreground">
                                                        S/ 4,200
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                                                    <TrendingUp className="size-3 text-primary" />
                                                </div>
                                                <span className="text-sm font-medium text-foreground">
                                                    3 Ofertas disponibles
                                                </span>
                                            </div>

                                            {/* Notification */}
                                            <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 flex items-center gap-3">
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                                                    <CheckCircle2 className="size-4 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-foreground">
                                                        ¡Préstamo aprobado!
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Hace 2 min
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* EL PROBLEMA */}
                <section id="problemas" className="py-16 md:py-24 bg-muted/40">
                    <div className="container mx-auto px-4 md:px-6">
                        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16 space-y-4">
                            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                El Problema
                            </p>
                            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
                                ¿Por qué es tan difícil conseguir
                                financiamiento?
                            </h2>
                            <p className="text-lg text-muted-foreground">
                                Millones de mujeres emprendedoras enfrentan
                                barreras que les impiden hacer crecer sus
                                negocios
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
                            {problemCards.map((card) => (
                                <Card
                                    key={card.title}
                                    className="rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 border-border/60"
                                >
                                    <CardContent className="p-6 space-y-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                                            <card.icon className="size-6 text-primary" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-foreground">
                                            {card.title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {card.description}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                {/* PROPUESTA DE VALOR */}
                <section id="como-funciona" className="py-16 md:py-24">
                    <div className="container mx-auto px-4 md:px-6">
                        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16 space-y-4">
                            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                Propuesta de Valor
                            </p>
                            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
                                Web3 + IA al servicio de tu negocio
                            </h2>
                            <p className="text-lg text-muted-foreground">
                                Tecnología de punta simplificada para que tomes
                                el control de tu futuro financiero
                            </p>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto">
                            {valueProps.map((prop) => (
                                <Card
                                    key={prop.title}
                                    className="rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 border-border/60"
                                >
                                    <CardContent className="p-6 space-y-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                                            <prop.icon className="size-6 text-primary" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-foreground">
                                            {prop.title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {prop.description}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                {/* PASOS */}
                <section id="pasos" className="py-16 md:py-24 bg-muted/40">
                    <div className="container mx-auto px-4 md:px-6">
                        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16 space-y-4">
                            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                Tu Camino
                            </p>
                            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
                                4 pasos para transformar tu futuro
                            </h2>
                            <p className="text-lg text-muted-foreground">
                                Un proceso simple, diseñado para ti
                            </p>
                        </div>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 max-w-5xl mx-auto">
                            {steps.map((step, i) => (
                                <div
                                    key={step.number}
                                    className="relative group"
                                >
                                    {/* Connector line (hidden on mobile) */}
                                    {i < steps.length - 1 && (
                                        <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-border -translate-x-1/2 z-0" />
                                    )}

                                    <Card className="relative rounded-2xl border-border/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5">
                                        <CardContent className="p-6 space-y-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-bold">
                                                {step.number}
                                            </div>
                                            <h3 className="text-lg font-semibold text-foreground">
                                                {step.title}
                                            </h3>
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                {step.description}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* IMPACTO */}
                <section id="impacto" className="py-16 md:py-24">
                    <div className="container mx-auto px-4 md:px-6">
                        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16 space-y-4">
                            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                Impacto Real
                            </p>
                            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
                                Historias que inspiran
                            </h2>
                            <p className="text-lg text-muted-foreground">
                                Mujeres reales que transformaron su futuro con
                                VELA
                            </p>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12 md:mb-16 max-w-4xl mx-auto">
                            {stats.map((stat) => (
                                <div
                                    key={stat.label}
                                    className="text-center space-y-1"
                                >
                                    <p className="text-3xl md:text-4xl font-extrabold text-primary">
                                        {stat.value}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {stat.label}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Testimonials */}
                        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
                            {testimonials.map((t) => (
                                <Card
                                    key={t.name}
                                    className="rounded-2xl border-border/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5"
                                >
                                    <CardContent className="p-6 space-y-5">
                                        <Quote className="size-8 text-primary/30" />
                                        <p className="text-sm text-muted-foreground leading-relaxed italic">
                                            &ldquo;{t.quote}&rdquo;
                                        </p>

                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                                                {getInitials(t.name)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-foreground">
                                                    {t.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                    {t.role} &middot;{" "}
                                                    {t.location}
                                                </p>
                                            </div>
                                        </div>

                                        <Badge
                                            variant="secondary"
                                            className="w-fit text-xs font-medium"
                                        >
                                            {t.badge}
                                        </Badge>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA FINAL */}
                <section
                    id="contacto"
                    className="py-16 md:py-24 bg-gradient-to-br from-primary/5 via-muted/40 to-primary/5"
                >
                    <div className="container mx-auto px-4 md:px-6">
                        <div className="max-w-2xl mx-auto text-center space-y-8">
                            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
                                ¿Lista para empezar?
                            </h2>
                            <p className="text-xl font-medium text-foreground">
                                Da el primer paso hacia tu independencia
                                financiera
                            </p>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                Crea tu perfil en menos de 5 minutos. Es gratis,
                                seguro y sin compromisos. Miles de emprendedoras
                                ya confían en VELA.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link href="/auth/sign-up">
                                    <Button
                                        size="lg"
                                        className="rounded-full px-8 text-base"
                                    >
                                        Crear mi Perfil Gratis
                                    </Button>
                                </Link>
                                <Link href="/auth/sign-in">
                                    <Button
                                        variant="outline"
                                        size="lg"
                                        className="rounded-full px-8 text-base"
                                    >
                                        Iniciar sesión
                                    </Button>
                                </Link>
                            </div>

                            {/* Trust badges */}
                            <div className="flex flex-wrap justify-center gap-6 pt-4">
                                {[
                                    { icon: Shield, label: "Datos protegidos" },
                                    {
                                        icon: Clock,
                                        label: "5 minutos para crear tu perfil",
                                    },
                                    {
                                        icon: CheckCircle2,
                                        label: "Sin costo oculto",
                                    },
                                ].map(({ icon: Icon, label }) => (
                                    <div
                                        key={label}
                                        className="flex items-center gap-2"
                                    >
                                        <Icon className="size-4 text-primary" />
                                        <span className="text-sm text-muted-foreground">
                                            {label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <LandingFooter />
        </div>
    );
}

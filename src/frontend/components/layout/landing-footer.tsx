import Link from "next/link";

export function LandingFooter() {
    return (
        <footer className="bg-primary text-primary-foreground py-12 border-t border-primary-foreground/20 mt-auto">
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-background text-foreground font-bold">
                                SG
                            </div>
                            <span className="text-xl font-bold text-primary-foreground tracking-tight">
                                SGPU
                            </span>
                        </div>
                        <p className="max-w-sm text-sm text-primary-foreground/80 mb-6">
                            Sistema integral para la excelencia en la gestión
                            académica de programas de maestría y doctorado.
                        </p>
                    </div>
                    <div>
                        <h4 className="text-primary-foreground font-semibold mb-4">
                            Enlaces Rápidos
                        </h4>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link
                                    href="/"
                                    className="hover:text-primary-foreground/80 transition-colors"
                                >
                                    Inicio
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/#anuncios"
                                    className="hover:text-primary-foreground/80 transition-colors"
                                >
                                    Anuncios
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/login"
                                    className="hover:text-primary-foreground/80 transition-colors"
                                >
                                    Portal Estudiante
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/admin"
                                    className="hover:text-primary-foreground/80 transition-colors"
                                >
                                    Portal Docente
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-primary-foreground font-semibold mb-4">
                            Soporte
                        </h4>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link
                                    href="#"
                                    className="hover:text-primary-foreground/80 transition-colors"
                                >
                                    Mesa de Ayuda
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="#"
                                    className="hover:text-primary-foreground/80 transition-colors"
                                >
                                    Tutoriales
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="#"
                                    className="hover:text-primary-foreground/80 transition-colors"
                                >
                                    Reglamentos
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="#"
                                    className="hover:text-primary-foreground/80 transition-colors"
                                >
                                    Contacto
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-primary-foreground/20 mt-10 pt-6 text-sm text-primary-foreground/60 flex flex-col md:flex-row justify-between items-center">
                    <p>
                        © {new Date().getFullYear()} SGPU. Todos los derechos
                        reservados.
                    </p>
                    <div className="flex gap-4 mt-4 md:mt-0">
                        <Link
                            href="#"
                            className="hover:text-primary-foreground/80 transition-colors"
                        >
                            Términos
                        </Link>
                        <Link
                            href="#"
                            className="hover:text-primary-foreground/80 transition-colors"
                        >
                            Privacidad
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}

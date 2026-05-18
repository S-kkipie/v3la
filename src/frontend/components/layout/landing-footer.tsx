import Link from "next/link";

const platformLinks = [
  { label: "Cómo funciona", href: "#como-funciona" },
  { label: "Pasos", href: "#pasos" },
  { label: "Impacto", href: "#impacto" },
  { label: "Contacto", href: "#contacto" },
];

const legalLinks = [
  { label: "Términos de uso", href: "#" },
  { label: "Privacidad", href: "#" },
  { label: "Aviso legal", href: "#" },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2 space-y-4">
            <span className="text-2xl font-extrabold tracking-tight text-foreground">
              VELA
            </span>
            <p className="max-w-sm text-sm text-muted-foreground leading-relaxed">
              Plataforma Web3 con IA que empodera a mujeres emprendedoras con
              acceso justo a financiamiento descentralizado. Tu negocio merece
              crecer.
            </p>
          </div>

          {/* Plataforma */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">
              Plataforma
            </h4>
            <ul className="space-y-2">
              {platformLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">
              Legal
            </h4>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-border mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} VELA. Todos los derechos
            reservados.
          </p>
          <p className="text-sm text-muted-foreground">
            Empoderando emprendedoras, un paso a la vez &#128156;
          </p>
        </div>
      </div>
    </footer>
  );
}

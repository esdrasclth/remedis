import { APP_URL } from "@/lib/constants";

const LINKS = [
  {
    heading: "Producto",
    items: [
      { label: "Características", href: "#features" },
      { label: "Clínica Empresarial", href: "#clinics" },
      { label: "Clínica Privada", href: "#clinics" },
      { label: "Planes", href: "#pricing" },
    ],
  },
  {
    heading: "Recursos",
    items: [
      { label: "Preguntas frecuentes", href: "#faq" },
      { label: "Iniciar sesión", href: `${APP_URL}/login` },
      { label: "Crear cuenta", href: `${APP_URL}/register` },
    ],
  },
  {
    heading: "Contacto",
    items: [
      { label: "esdrasclth@brandsofts.com", href: "mailto:esdrasclth@brandsofts.com" },
    ],
  },
];

export function Footer() {
  return (
    <footer
      style={{
        background: "#0c0a08",
        borderTop: "none",
        paddingTop: "64px",
        paddingBottom: "40px",
      }}
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-[1fr_auto_auto_auto] gap-12 mb-16">
          <div className="col-span-2 md:col-span-1">
            <a href="/" className="flex items-center gap-2.5 mb-4" style={{ textDecoration: "none" }}>
              <img src="/images/iconoremedis.png" alt="Remedis" style={{ width: 32, height: 32, borderRadius: "4px", objectFit: "contain", flexShrink: 0 }} />
              <span style={{ fontSize: "16px", fontWeight: 500, color: "#ffffff" }}>Remedis</span>
            </a>
            <p style={{ fontSize: "13px", fontWeight: 400, lineHeight: 1.6, color: "#4d505d", maxWidth: "240px" }}>
              Sistema de gestión clínica todo-en-uno para clínicas empresariales y privadas en cualquier país.
            </p>
          </div>

          {LINKS.map(col => (
            <div key={col.heading}>
              <p style={{ fontSize: "11px", fontWeight: 500, color: "#4d505d", marginBottom: "16px", letterSpacing: "0.06em" }}>
                {col.heading.toUpperCase()}
              </p>
              <ul className="flex flex-col gap-3">
                {col.items.map(item => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      style={{
                        fontSize: "13px",
                        fontWeight: 400,
                        color: "#999ba3",
                        textDecoration: "none",
                      }}
                      className="hover:text-white transition-colors"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "24px" }}
        >
          <p style={{ fontSize: "12px", fontWeight: 400, color: "#4d505d" }}>
            © {new Date().getFullYear()} Remedis · BrandSofts. Todos los derechos reservados.
          </p>
          <p style={{ fontSize: "12px", fontWeight: 400, color: "#4d505d" }}>
            Diseñado para equipos clínicos que necesitan control, trazabilidad y velocidad.
          </p>
        </div>
      </div>
    </footer>
  );
}

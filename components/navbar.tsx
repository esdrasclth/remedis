"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

const NAV = [
  { label: "Características", href: "#features" },
  { label: "Clínicas",        href: "#clinics"  },
  { label: "Planes",          href: "#pricing"  },
  { label: "FAQ",             href: "#faq"      },
];

const APP_URL = "https://remedis.brandsofts.com";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen]         = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        scrolled
          ? "bg-deep-space-black/95 backdrop-blur-sm border-b border-white/[0.06]"
          : "bg-transparent"
      }`}
    >
      {/* DESIGN.md nav height ≈ 62px */}
      <nav className="max-w-6xl mx-auto px-6 h-[62px] flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5 shrink-0">
          <img src="/iconoremedis.png" alt="Remedis" style={{ width: 32, height: 32, borderRadius: "4px", objectFit: "contain" }} />
          <span style={{ fontSize: "16px", fontWeight: 500, color: "#ffffff" }}>Remedis</span>
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {NAV.map(n => (
            <a
              key={n.href}
              href={n.href}
              style={{ fontSize: "14px", fontWeight: 400, color: "#999ba3", borderRadius: "4px", padding: "8px 12px" }}
              className="hover:text-pure-white hover:bg-white/[0.04] transition-colors"
            >
              {n.label}
            </a>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href={`${APP_URL}/login`}
            style={{ fontSize: "14px", fontWeight: 400, color: "#ffffff", borderRadius: "4px", padding: "10px 20px" }}
            className="hover:bg-white/[0.04] transition-colors"
          >
            Iniciar sesión
          </a>
          {/* Primary CTA — DESIGN.md: yellow, deep-space text, 4px radius, 10px/20px padding */}
          <a
            href={`${APP_URL}/register`}
            style={{
              background: "#e4f222",
              color: "#0c0a08",
              fontSize: "14px",
              fontWeight: 500,
              borderRadius: "4px",
              padding: "10px 20px",
              boxShadow: "rgba(255, 255, 255, 0.6) 0px 0px 2px 0px inset",
            }}
            className="hover:opacity-90 transition-opacity"
          >
            Probar gratis
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-slate-gray hover:text-pure-white p-2 transition-colors"
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-deep-space-black border-t border-white/[0.06] px-6 py-4 flex flex-col gap-1">
          {NAV.map(n => (
            <a
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              style={{ fontSize: "14px", fontWeight: 400, color: "#c8c6c3", padding: "12px 0" }}
              className="border-b border-white/[0.04] last:border-0 hover:text-white transition-colors"
            >
              {n.label}
            </a>
          ))}
          <div className="flex flex-col gap-3 pt-4">
            <a
              href={`${APP_URL}/login`}
              className="text-center border border-white/10 text-pure-white transition-colors hover:border-white/20"
              style={{ fontSize: "14px", fontWeight: 400, borderRadius: "4px", padding: "10px 20px" }}
            >
              Iniciar sesión
            </a>
            <a
              href={`${APP_URL}/register`}
              className="text-center hover:opacity-90 transition-opacity"
              style={{
                background: "#e4f222",
                color: "#0c0a08",
                fontSize: "14px",
                fontWeight: 500,
                borderRadius: "4px",
                padding: "10px 20px",
              }}
            >
              Probar 14 días gratis
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

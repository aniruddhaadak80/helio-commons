"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Radar, Satellite, Terminal } from "lucide-react";

const links = [
  { href: "/board", label: "Board", icon: Radar },
  { href: "/signals", label: "Signals", icon: Satellite },
  { href: "/console", label: "MCP console", icon: Terminal },
  { href: "/method", label: "Method", icon: ArrowUpRight },
];

export function SiteNav() {
  const pathname = usePathname();
  return (
    <header className="nav">
      <div className="site-shell nav-inner">
        <Link className="brand-lockup" href="/" aria-label="Helio Commons home">
          <span className="brand-mark">H</span>
          <span>Helio Commons</span>
        </Link>
        <nav className="nav-links" aria-label="Primary navigation">
          {links.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link className={`nav-link${active ? " active" : ""}`} href={link.href} key={link.href}>
                <Icon size={14} strokeWidth={1.7} />
                {link.label}
              </Link>
            );
          })}
          <Link className="nav-cta" href="/board">
            Open board <ArrowUpRight size={14} />
          </Link>
        </nav>
      </div>
    </header>
  );
}

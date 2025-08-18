// src/components/Breadcrumb.tsx
"use client";
import { ChevronRight } from "lucide-react";

type Crumb = { label: string; href?: string };
export default function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-neutral-500">
      <ol className="flex items-center gap-2">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-2">
            {i > 0 && <ChevronRight className="size-4 text-neutral-300" />}
            {it.href ? (
              <a href={it.href} className="hover:text-neutral-700">
                {it.label}
              </a>
            ) : (
              <span className="text-neutral-700">{it.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

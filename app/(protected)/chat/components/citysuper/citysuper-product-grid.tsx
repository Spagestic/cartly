"use client";

import type { CitysuperProductDisplay } from "@/lib/citysuper/product";
import { cn } from "@/lib/utils";
import { CitysuperProductCard } from "./citysuper-product-card";

type CitysuperProductGridProps = {
  products: CitysuperProductDisplay[];
  title?: string;
  className?: string;
};

export function CitysuperProductGrid({
  products,
  title,
  className,
}: CitysuperProductGridProps) {
  if (products.length === 0) return null;

  return (
    <section
      className={cn(
        "not-prose w-full overflow-hidden rounded-lg border border-border bg-card",
        className,
      )}
      aria-label={title}
    >
      {title ? (
        <h2 className="border-b border-border px-4 py-3 text-sm font-medium text-foreground">
          {title}
        </h2>
      ) : null}
      <ul className="divide-y divide-border p-0">
        {products.map((product) => (
          <li key={product.product_url} className="px-4 hover:bg-muted/40">
            <CitysuperProductCard product={product} className="px-0" />
          </li>
        ))}
      </ul>
    </section>
  );
}

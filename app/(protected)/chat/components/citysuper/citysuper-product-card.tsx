"use client";

import {
  formatCitysuperPrice,
  type CitysuperProductDisplay,
} from "@/lib/citysuper/product";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { Package } from "lucide-react";

type CitysuperProductCardProps = {
  product: CitysuperProductDisplay;
  className?: string;
};

export function CitysuperProductCard({
  product,
  className,
}: CitysuperProductCardProps) {
  const price = formatCitysuperPrice(product);

  return (
    <Link
      href={product.product_url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex flex-row flex-nowrap items-stretch gap-4 py-4 transition-colors",
        className,
      )}
    >
      <div className="relative min-h-14 w-12 shrink-0 self-stretch overflow-hidden rounded-sm bg-muted/40 sm:w-14">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover object-center"
            sizes="(max-width: 640px) 48px, 56px"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <Package className="size-7 opacity-40" aria-hidden />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 py-0.5">
        <h3 className="line-clamp-2 text-sm leading-snug font-medium text-foreground">
          {product.name}
        </h3>
        {product.note ? (
          <div className="flex flex-col gap-1 ">
            <p className="line-clamp-2 text-xs text-muted-foreground">
              {product.note}
            </p>
          </div>
        ) : null}

        {price ? (
          <p className="text-sm font-semibold tabular-nums text-foreground mt-2">
            {price.display}
            {price.regular ? (
              <span className="ml-2 text-md font-normal text-muted-foreground line-through">
                {price.regular}
              </span>
            ) : null}
          </p>
        ) : null}
      </div>
    </Link>
  );
}

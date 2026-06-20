import {
  InlineCitation,
  InlineCitationCard,
  InlineCitationCardBody,
  InlineCitationCardTrigger,
  InlineCitationCarousel,
  InlineCitationCarouselContent,
  InlineCitationCarouselHeader,
  InlineCitationCarouselIndex,
  InlineCitationCarouselItem,
  InlineCitationCarouselNext,
  InlineCitationCarouselPrev,
  InlineCitationSource,
  InlineCitationText,
} from "@/components/ai-elements/inline-citation";
import { cn } from "@/lib/utils";
import type { Element } from "hast";
import type { ComponentProps } from "react";
import type { Streamdown } from "streamdown";

type CitationSourceEntry = {
  url: string;
  title?: string;
  description?: string;
};

function parseCitationDataSources(raw: unknown): CitationSourceEntry[] {
  if (raw == null || raw === "") return [];
  const str = typeof raw === "string" ? raw : String(raw);
  try {
    const v = JSON.parse(str) as unknown;
    if (!Array.isArray(v)) return [];
    return v.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const o = item as Record<string, unknown>;
      const url = o.url;
      if (typeof url !== "string" || url.length === 0) return [];
      return [
        {
          url,
          title: typeof o.title === "string" ? o.title : undefined,
          description:
            typeof o.description === "string" ? o.description : undefined,
        },
      ];
    });
  } catch {
    return [];
  }
}

/**
 * Renders `<citation data-sources='[{"url":"…","title":"…"}]'>…</citation>` from
 * assistant markdown through Streamdown custom `components`.
 */
function StreamdownCitation(
  props: ComponentProps<"span"> & {
    node?: Element;
    "data-sources"?: string;
    dataSources?: string;
  },
) {
  const {
    children,
    className,
    "data-sources": dataSourcesKebab,
    dataSources,
    node: _node,
    ...rest
  } = props;

  const entries = parseCitationDataSources(dataSourcesKebab ?? dataSources);
  const urls = entries.map((e) => e.url);

  if (urls.length === 0) {
    return (
      <span className={cn("inline", className)} {...rest}>
        {children}
      </span>
    );
  }

  return (
    <InlineCitation className={cn("inline", className)}>
      <InlineCitationText>{children}</InlineCitationText>
      <InlineCitationCard>
        <InlineCitationCardTrigger sources={urls} />
        <InlineCitationCardBody>
          <InlineCitationCarousel className="py-0">
            <InlineCitationCarouselHeader>
              <div className="flex gap-1 pl-2">
                <InlineCitationCarouselPrev />
                <InlineCitationCarouselNext />
              </div>
              <InlineCitationCarouselIndex />
            </InlineCitationCarouselHeader>
            <InlineCitationCarouselContent>
              {entries.map((entry, i) => (
                <InlineCitationCarouselItem key={`${entry.url}-${i}`}>
                  <InlineCitationSource
                    title={entry.title}
                    url={entry.url}
                    description={entry.description}
                  />
                </InlineCitationCarouselItem>
              ))}
            </InlineCitationCarouselContent>
          </InlineCitationCarousel>
        </InlineCitationCardBody>
      </InlineCitationCard>
    </InlineCitation>
  );
}

export const assistantStreamdownComponents = {
  citation: StreamdownCitation,
} as NonNullable<ComponentProps<typeof Streamdown>["components"]>;

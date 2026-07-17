import type { LandingPage } from "@/lib/types";

export interface ProductMediaItem {
  type: "image" | "video";
  url: string;
  alt?: string;
}

function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url);
}

export function parseProductMedia(
  landingPage: LandingPage | null | undefined,
  fallbackAlt?: string,
): ProductMediaItem[] {
  const items: ProductMediaItem[] = [];

  if (landingPage?.heroMediaUrl) {
    items.push({
      type: isVideoUrl(landingPage.heroMediaUrl) ? "video" : "image",
      url: landingPage.heroMediaUrl,
      alt: fallbackAlt,
    });
  }

  if (landingPage?.sectionsJson) {
    try {
      const parsed = JSON.parse(landingPage.sectionsJson) as unknown;

      if (Array.isArray(parsed)) {
        for (const entry of parsed) {
          if (
            entry &&
            typeof entry === "object" &&
            "url" in entry &&
            typeof entry.url === "string"
          ) {
            const type =
              "type" in entry && entry.type === "video" ? "video" : "image";

            items.push({
              type,
              url: entry.url,
              alt:
                "alt" in entry && typeof entry.alt === "string"
                  ? entry.alt
                  : fallbackAlt,
            });
          }
        }
      }
    } catch {
      // Ignore malformed landing page JSON.
    }
  }

  return items;
}

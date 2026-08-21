import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/portal", "/portal/funding"].map((path) => ({ url: `https://betterwealth.example${path}`, lastModified: new Date() }));
}

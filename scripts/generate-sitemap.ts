import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { DOMAIN } from "../src/constants/site";
import { blogMetadata } from "../src/data/blog-metadata.gen";

const SITEMAP_PATH = resolve(process.cwd(), "public/sitemap.xml");

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
}

function generateSitemap(): string {
  const urls: SitemapUrl[] = [];

  // Homepage
  urls.push({
    loc: `${DOMAIN}/`,
    changefreq: "monthly",
    priority: 1.0,
  });

  // Blog index
  urls.push({
    loc: `${DOMAIN}/blog`,
    changefreq: "weekly",
    priority: 0.8,
  });

  // Blog posts
  for (const post of blogMetadata) {
    urls.push({
      loc: `${DOMAIN}/blog/posts/${post.slug}`,
      lastmod: post.date,
      changefreq: "yearly",
      priority: 0.7,
    });
  }

  // Blog tags
  const tags = Array.from(new Set(blogMetadata.flatMap((post) => post.tags))).sort();
  for (const tag of tags) {
    urls.push({
      loc: `${DOMAIN}/blog/tags/${encodeURIComponent(tag)}`,
      changefreq: "weekly",
      priority: 0.6,
    });
  }

  // Generate XML
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  for (const url of urls) {
    xml += "  <url>\n";
    xml += `    <loc>${url.loc}</loc>\n`;
    if (url.lastmod) {
      xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
    }
    if (url.changefreq) {
      xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
    }
    if (url.priority !== undefined) {
      xml += `    <priority>${url.priority.toFixed(1)}</priority>\n`;
    }
    xml += "  </url>\n";
  }

  xml += "</urlset>\n";

  return xml;
}

// Generate and write sitemap
const sitemap = generateSitemap();
writeFileSync(SITEMAP_PATH, sitemap, "utf-8");
console.log(`✅ Sitemap generated at ${SITEMAP_PATH}`);

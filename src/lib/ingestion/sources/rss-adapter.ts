import type { SourceAdapter, RawItem } from "../types";

export interface RssSourceConfig {
  id: string;
  name: string;
  url: string;
  type: string;
  category: string;
}

export class RssAdapter implements SourceAdapter {
  id: string;
  name: string;
  type: string;
  private url: string;
  private category: string;

  constructor(config: RssSourceConfig) {
    this.id = config.id;
    this.name = config.name;
    this.url = config.url;
    this.type = config.type || "rss";
    this.category = config.category;
  }

  async fetch(): Promise<RawItem[]> {
    console.log(`[rss-adapter] Fetching feed: ${this.url}`);

    let xml: string;
    try {
      const response = await globalThis.fetch(this.url, {
        headers: {
          "User-Agent": "AI-Intelligence-Bot/1.0",
          Accept: "application/rss+xml, application/xml, application/atom+xml, text/xml, */*",
        },
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      xml = await response.text();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[rss-adapter] Failed to fetch ${this.url}: ${message}`);
      throw new Error(`RSS fetch failed for ${this.name}: ${message}`);
    }

    return this.parseXml(xml);
  }

  private parseXml(xml: string): RawItem[] {
    const items: RawItem[] = [];

    // Try RSS 2.0 <item> elements first, then Atom <entry> elements
    const rssItems = this.extractElements(xml, "item");
    const atomEntries = rssItems.length > 0 ? [] : this.extractElements(xml, "entry");

    const entries = rssItems.length > 0 ? rssItems : atomEntries;

    for (const entry of entries) {
      try {
        const item = this.parseEntry(entry, rssItems.length > 0 ? "rss" : "atom");
        if (item && item.title && item.url) {
          items.push(item);
        }
      } catch (err) {
        console.warn(`[rss-adapter] Failed to parse entry: ${err}`);
      }
    }

    console.log(`[rss-adapter] Parsed ${items.length} items from ${this.name}`);
    return items;
  }

  private extractElements(xml: string, tagName: string): string[] {
    const elements: string[] = [];
    const regex = new RegExp(`<${tagName}[\\s>]([\\s\\S]*?)<\\/${tagName}>`, "gi");
    let match: RegExpExecArray | null;

    while ((match = regex.exec(xml)) !== null) {
      elements.push(match[0]);
    }

    return elements;
  }

  private getTagContent(xml: string, tagName: string): string | null {
    // Handle CDATA sections
    const cdataRegex = new RegExp(
      `<${tagName}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/${tagName}>`,
      "i"
    );
    const cdataMatch = cdataRegex.exec(xml);
    if (cdataMatch) return cdataMatch[1].trim();

    // Handle regular content
    const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i");
    const match = regex.exec(xml);
    if (match) return this.stripHtml(match[1].trim());

    return null;
  }

  private getAtomLink(xml: string): string | null {
    // Atom links: <link href="..." />  or <link rel="alternate" href="..." />
    const linkRegex = /<link[^>]*href=["']([^"']+)["'][^>]*\/?>/gi;
    let match: RegExpExecArray | null;

    while ((match = linkRegex.exec(xml)) !== null) {
      const linkTag = match[0];
      // Prefer rel="alternate" or no rel attribute
      if (!linkTag.includes('rel="') || linkTag.includes('rel="alternate"')) {
        return match[1];
      }
    }

    // Fallback: take any link href
    const fallback = /<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i.exec(xml);
    return fallback ? fallback[1] : null;
  }

  private parseEntry(entryXml: string, format: "rss" | "atom"): RawItem | null {
    let title: string | null;
    let url: string | null;
    let content: string | null;
    let publishedAt: string | null;
    let author: string | null;
    let imageUrl: string | null = null;

    if (format === "rss") {
      title = this.getTagContent(entryXml, "title");
      url = this.getTagContent(entryXml, "link");
      content =
        this.getTagContent(entryXml, "description") ??
        this.getTagContent(entryXml, "content:encoded");
      publishedAt = this.getTagContent(entryXml, "pubDate");
      author =
        this.getTagContent(entryXml, "author") ??
        this.getTagContent(entryXml, "dc:creator");
    } else {
      title = this.getTagContent(entryXml, "title");
      url = this.getAtomLink(entryXml);
      content =
        this.getTagContent(entryXml, "summary") ??
        this.getTagContent(entryXml, "content");
      publishedAt =
        this.getTagContent(entryXml, "published") ??
        this.getTagContent(entryXml, "updated");
      author = this.getTagContent(entryXml, "name"); // inside <author><name>
    }

    // Try to extract image from content
    if (content) {
      const imgMatch = /<img[^>]+src=["']([^"']+)["']/i.exec(content);
      if (imgMatch) imageUrl = imgMatch[1];
    }

    // Parse date
    let isoDate: string | undefined;
    if (publishedAt) {
      try {
        const d = new Date(publishedAt);
        if (!isNaN(d.getTime())) {
          isoDate = d.toISOString();
        }
      } catch {
        // Ignore invalid dates
      }
    }

    if (!title || !url) return null;

    return {
      title,
      url,
      content: content ?? undefined,
      publishedAt: isoDate,
      imageUrl: imageUrl ?? undefined,
      author: author ?? undefined,
    };
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
}

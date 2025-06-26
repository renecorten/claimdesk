import * as cheerio from "cheerio"

export interface ExtractedContent {
  success: boolean
  content?: string
  title?: string
  publishedDate?: string
  author?: string
  images?: string[]
  error?: string
  extractionMethod?: "rss-fallback" | "generic" | "presseportal" | "google-alerts"
}

// Extrahiere echte URL aus Google Redirect URLs
function extractRealUrlFromGoogleRedirect(url: string): string {
  try {
    const urlObj = new URL(url)

    // Google Alerts Redirect URLs
    if (urlObj.hostname.includes("google.com") && urlObj.pathname === "/url") {
      const realUrl = urlObj.searchParams.get("url")
      if (realUrl) {
        console.log(`🔗 Extracted real URL from Google redirect: ${realUrl}`)
        return realUrl
      }
    }

    // Google News Redirect URLs
    if (urlObj.hostname.includes("google.com") && urlObj.pathname.startsWith("/url")) {
      const realUrl = urlObj.searchParams.get("url") || urlObj.searchParams.get("q")
      if (realUrl) {
        console.log(`🔗 Extracted real URL from Google redirect: ${realUrl}`)
        return realUrl
      }
    }

    return url
  } catch (error) {
    console.warn(`⚠️ Failed to parse URL for redirect extraction: ${url}`)
    return url
  }
}

// Site-spezifische Selektoren für bessere Content-Extraktion
const SITE_SELECTORS = {
  "presseportal.de": {
    content: [".story-text", ".news-text", ".article-content", ".story-content p", '[data-testid="story-text"]'],
    title: ["h1.story-headline", "h1.headline", ".story-title h1", "h1"],
    author: [".story-author", ".author-name", ".byline"],
    date: [".story-date", ".publish-date", "time[datetime]"],
  },
  "bnn.de": {
    content: [".article-content", ".article-text", ".content-text", ".article-body", "article .text", ".article p"],
    title: ["h1.article-title", "h1", ".headline"],
    author: [".author", ".byline"],
    date: [".publish-date", "time"],
  },
  "google.com": {
    // Google Alerts führen oft zu anderen Seiten weiter
    content: ["article p", ".article-content p", ".content p", ".post-content p", "main p"],
    title: ["h1", ".article-title", ".post-title"],
  },
  // Generische Selektoren für unbekannte Seiten
  generic: {
    content: [
      "article",
      ".article-content",
      ".post-content",
      ".content",
      ".story-content",
      ".news-content",
      "main",
      '[role="main"]',
      ".entry-content",
      ".text-content",
      ".article-body",
      ".article-text",
    ],
    title: ["h1", ".article-title", ".post-title", ".entry-title", ".headline"],
    author: [".author", ".byline", ".author-name", '[rel="author"]'],
    date: ["time[datetime]", ".publish-date", ".date", ".published"],
  },
}

// Bereinige und normalisiere extrahierten Text
function cleanExtractedText(text: string): string {
  return (
    text
      // Entferne überschüssige Whitespaces
      .replace(/\s+/g, " ")
      // Entferne führende/nachfolgende Leerzeichen
      .trim()
      // Entferne typische Störelemente
      .replace(/\[.*?\]/g, "") // [Werbung], [Anzeige], etc.
      .replace(/Weiterlesen.*$/i, "") // "Weiterlesen" Links
      .replace(/Mehr dazu.*$/i, "") // "Mehr dazu" Links
      // Entferne Cookie/GDPR Hinweise
      .replace(/.*cookie.*akzeptieren.*/gi, "")
      .replace(/.*datenschutz.*zustimmen.*/gi, "")
  )
}

// Erkenne die Website basierend auf der URL
function detectSite(url: string): keyof typeof SITE_SELECTORS {
  try {
    const hostname = new URL(url).hostname.toLowerCase()

    if (hostname.includes("presseportal.de")) {
      return "presseportal.de"
    }
    if (hostname.includes("bnn.de")) {
      return "bnn.de"
    }
    if (hostname.includes("google.com") || hostname.includes("google.de")) {
      return "google.com"
    }

    return "generic"
  } catch (error) {
    return "generic"
  }
}

// Versuche Content mit verschiedenen Selektoren zu extrahieren
function tryExtractWithSelectors($: cheerio.CheerioAPI, selectors: string[]): string | null {
  for (const selector of selectors) {
    try {
      const elements = $(selector)
      if (elements.length > 0) {
        // Sammle Text von allen passenden Elementen
        let content = ""
        elements.each((_, element) => {
          const text = $(element).text().trim()
          if (text.length > 50) {
            // Nur substanzielle Inhalte
            content += text + "\n\n"
          }
        })

        if (content.trim().length > 100) {
          return cleanExtractedText(content)
        }
      }
    } catch (error) {
      // Selector fehlgeschlagen, versuche nächsten
      continue
    }
  }
  return null
}

// Hauptfunktion für Content-Extraktion
export async function extractFullArticleContent(
  url: string,
  fallbackContent?: string,
  maxRetries = 2,
): Promise<ExtractedContent> {
  // Validiere URL
  if (!url || typeof url !== "string") {
    return {
      success: false,
      error: "Ungültige URL",
      extractionMethod: "rss-fallback",
    }
  }

  // Extrahiere echte URL aus Google Redirects
  const realUrl = extractRealUrlFromGoogleRedirect(url)
  const isRedirectUrl = realUrl !== url

  let lastError = ""

  // Retry-Mechanismus
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `🔍 Extracting content from: ${realUrl}${isRedirectUrl ? " (resolved from redirect)" : ""} (Attempt ${attempt + 1}/${maxRetries + 1})`,
      )

      // Fetch mit Timeout und realistischen Headers
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15s timeout

      const response = await fetch(realUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
          "Accept-Encoding": "gzip, deflate, br",
          DNT: "1",
          Connection: "keep-alive",
          "Upgrade-Insecure-Requests": "1",
        },
        signal: controller.signal,
        // Folge Redirects, aber begrenzt
        redirect: "follow",
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const html = await response.text()

      if (!html || html.length < 100) {
        throw new Error("Leere oder zu kurze HTML-Antwort")
      }

      // Parse HTML mit Cheerio
      const $ = cheerio.load(html)

      // Entferne störende Elemente
      $("script, style, nav, header, footer, .advertisement, .ads, .cookie-banner, .gdpr-notice").remove()

      // Erkenne Website-Typ basierend auf der ECHTEN URL
      const siteType = detectSite(realUrl)
      const selectors = SITE_SELECTORS[siteType]

      console.log(`📄 Detected site type: ${siteType} for ${realUrl}`)

      // Extrahiere Content
      let extractedContent = tryExtractWithSelectors($, selectors.content)

      // Fallback auf generische Selektoren wenn site-spezifisch fehlschlägt
      if (!extractedContent && siteType !== "generic") {
        console.log(`🔄 Falling back to generic selectors for ${url}`)
        extractedContent = tryExtractWithSelectors($, SITE_SELECTORS.generic.content)
      }

      // Extrahiere zusätzliche Metadaten
      const extractedTitle = tryExtractWithSelectors($, selectors.title || SITE_SELECTORS.generic.title)
      const extractedAuthor = selectors.author ? tryExtractWithSelectors($, selectors.author) : null

      // Validiere extrahierten Content
      if (!extractedContent || extractedContent.length < 100) {
        throw new Error(`Extrahierter Content zu kurz: ${extractedContent?.length || 0} Zeichen`)
      }

      // Erfolgreiche Extraktion
      console.log(`✅ Successfully extracted ${extractedContent.length} characters from ${url}`)

      return {
        success: true,
        content: extractedContent,
        title: extractedTitle || undefined,
        author: extractedAuthor || undefined,
        extractionMethod: siteType,
        images: [], // TODO: Implementiere Bild-Extraktion falls gewünscht
      }
    } catch (error: any) {
      lastError = error.message || "Unbekannter Fehler"
      console.warn(`⚠️ Content extraction failed for ${url} (Attempt ${attempt + 1}): ${lastError}`)

      // Bei letztem Versuch oder kritischen Fehlern, breche ab
      if (attempt === maxRetries || error.name === "AbortError" || lastError.includes("HTTP 4")) {
        break
      }

      // Kurze Pause vor Retry
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)))
    }
  }

  // Fallback auf RSS-Content wenn verfügbar
  if (fallbackContent && fallbackContent.length > 50) {
    console.log(`🔄 Using RSS fallback content for ${url}`)
    return {
      success: true,
      content: cleanExtractedText(fallbackContent),
      extractionMethod: "rss-fallback",
      error: `Web-Extraktion fehlgeschlagen: ${lastError}`,
    }
  }

  // Kompletter Fehlschlag
  return {
    success: false,
    error: `Content-Extraktion fehlgeschlagen nach ${maxRetries + 1} Versuchen: ${lastError}`,
    extractionMethod: "rss-fallback",
  }
}

// Batch-Verarbeitung für mehrere URLs
export async function extractMultipleArticles(
  urls: Array<{ url: string; fallbackContent?: string }>,
  concurrency = 3,
): Promise<ExtractedContent[]> {
  const results: ExtractedContent[] = []

  // Verarbeite URLs in Batches um Server nicht zu überlasten
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency)

    const batchPromises = batch.map(({ url, fallbackContent }) => extractFullArticleContent(url, fallbackContent))

    const batchResults = await Promise.allSettled(batchPromises)

    batchResults.forEach((result, index) => {
      if (result.status === "fulfilled") {
        results.push(result.value)
      } else {
        results.push({
          success: false,
          error: `Promise rejected: ${result.reason}`,
          extractionMethod: "rss-fallback",
        })
      }
    })

    // Pause zwischen Batches
    if (i + concurrency < urls.length) {
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }
  }

  return results
}

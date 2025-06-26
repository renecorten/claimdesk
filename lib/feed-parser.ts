// @ts-ignore (rss-parser hat möglicherweise keine perfekten Typen oder ist nicht standardmäßig in Next.js)
import Parser from "rss-parser"
import type { Item } from "rss-parser"

export interface ParsedNewsItem {
  id: string
  title: string | null
  summary: string | null
  content: string | null
  publishedAt: string | null // ISO Date String
  source: string | null
  location: string | null
  keywords: string[]
  originalLink: string | null
  feedType: string
}

const KEYWORDS_TO_DETECT = [
  "Brand",
  "Explosion",
  "Unfall",
  "Feuer",
  "Diebstahl",
  "Einbruch",
  "Überfall",
  "Polizei",
  "Rettung",
  "Notfall",
  "Verkehrsunfall",
  "Bombendrohung",
  "Geiselnahme",
  "Fahndung",
  "Festnahme",
  "Tötungsdelikt",
  "Vermisst",
  "Sprengstoff",
]

// Erweiterte Liste der deutschen Städte und Regionen (150+ Orte)
const GERMAN_CITIES = [
  // Großstädte (über 300.000 Einwohner)
  "Berlin",
  "Hamburg",
  "München",
  "Köln",
  "Frankfurt am Main",
  "Frankfurt",
  "Stuttgart",
  "Düsseldorf",
  "Leipzig",
  "Dortmund",
  "Essen",
  "Bremen",
  "Dresden",
  "Hannover",
  "Nürnberg",
  "Duisburg",
  "Bochum",
  "Wuppertal",
  "Bielefeld",
  "Bonn",
  "Münster",

  // Weitere wichtige Städte (100.000-300.000 Einwohner)
  "Karlsruhe",
  "Mannheim",
  "Augsburg",
  "Wiesbaden",
  "Mönchengladbach",
  "Gelsenkirchen",
  "Aachen",
  "Braunschweig",
  "Chemnitz",
  "Kiel",
  "Krefeld",
  "Halle",
  "Halle an der Saale",
  "Magdeburg",
  "Freiburg",
  "Freiburg im Breisgau",
  "Oberhausen",
  "Lübeck",
  "Erfurt",
  "Rostock",
  "Kassel",
  "Hagen",
  "Saarbrücken",
  "Hamm",
  "Potsdam",
  "Ludwigshafen",
  "Ludwigshafen am Rhein",
  "Oldenburg",
  "Leverkusen",
  "Osnabrück",
  "Solingen",
  "Heidelberg",
  "Herne",
  "Neuss",
  "Darmstadt",
  "Paderborn",
  "Regensburg",
  "Ingolstadt",
  "Würzburg",
  "Fürth",
  "Wolfsburg",
  "Offenbach",
  "Offenbach am Main",
  "Ulm",
  "Heilbronn",
  "Pforzheim",
  "Göttingen",
  "Bottrop",
  "Trier",
  "Recklinghausen",

  // Mittelstädte (50.000-100.000 Einwohner)
  "Cottbus",
  "Erlangen",
  "Moers",
  "Siegen",
  "Hildesheim",
  "Salzgitter",
  "Kaiserslautern",
  "Gütersloh",
  "Iserlohn",
  "Schwerin",
  "Düren",
  "Esslingen",
  "Ratingen",
  "Lüdenscheid",
  "Marl",
  "Bamberg",
  "Velbert",
  "Aschaffenburg",
  "Minden",
  "Neumünster",
  "Viersen",
  "Wilhelmshaven",
  "Rheine",
  "Gladbeck",
  "Troisdorf",
  "Dorsten",
  "Castrop-Rauxel",
  "Arnsberg",
  "Detmold",
  "Lüneburg",
  "Brandenburg",
  "Brandenburg an der Havel",
  "Bayreuth",
  "Fulda",
  "Koblenz",
  "Bergisch Gladbach",
  "Reutlingen",
  "Kempten",
  "Landshut",
  "Sindelfingen",
  "Rosenheim",
  "Frankenthal",
  "Stralsund",
  "Friedrichshafen",
  "Mülheim",
  "Mülheim an der Ruhr",
  "Konstanz",
  "Worms",
  "Dormund",
  "Celle",
  "Lippstadt",
  "Kleve",
  "Herzogenrath",
  "Remscheid",
  "Plauen",
  "Neubrandenburg",
  "Kerpen",
  "Rüsselsheim",
  "Greifswald",
  "Gießen",
  "Unna",
  "Weimar",
  "Speyer",
  "Passau",
  "Ibbenbüren",
  "Goslar",
  "Emden",
  "Cuxhaven",
  "Meerbusch",
  "Schweinfurt",
  "Coburg",
  "Warendorf",
  "Neustadt",
  "Neustadt an der Weinstraße",
  "Landau",
  "Landau in der Pfalz",

  // Wichtige kleinere Städte und Kurorte
  "Garmisch-Partenkirchen",
  "Berchtesgaden",
  "Bad Reichenhall",
  "Bad Kissingen",
  "Bad Homburg",
  "Bad Oeynhausen",
  "Baden-Baden",
  "Westerland",
  "Sankt Peter-Ording",
  "Warnemünde",
  "Binz",
  "Oberstdorf",
  "Mittenwald",
  "Rothenburg ob der Tauber",
  "Quedlinburg",
  "Wismar",
  "Straubing",
  "Amberg",
  "Weiden",
  "Hof",
  "Zwickau",
  "Görlitz",
  "Bautzen",
  "Meißen",
  "Pirna",
  "Flensburg",
  "Husum",
  "Rendsburg",
  "Itzehoe",
  "Pinneberg",
  "Norderstedt",
  "Ahrensburg",
  "Stade",
  "Buxtehude",
  "Winsen",
  "Uelzen",
  "Wolfenbüttel",
  "Peine",
  "Hameln",
  "Northeim",
  "Einbeck",
  "Seesen",
  "Osterode",
  "Clausthal-Zellerfeld",

  // Bundesländer
  "Bayern",
  "Baden-Württemberg",
  "Nordrhein-Westfalen",
  "Hessen",
  "Niedersachsen",
  "Rheinland-Pfalz",
  "Schleswig-Holstein",
  "Brandenburg",
  "Sachsen",
  "Thüringen",
  "Sachsen-Anhalt",
  "Mecklenburg-Vorpommern",
  "Saarland",

  // Regionen und Landschaften
  "Ruhrgebiet",
  "Rheinland",
  "Westfalen",
  "Franken",
  "Schwaben",
  "Pfalz",
  "Allgäu",
  "Schwarzwald",
  "Harz",
  "Eifel",
  "Sauerland",
  "Bergisches Land",
  "Münsterland",
  "Emsland",
  "Weserbergland",
  "Teutoburger Wald",
  "Odenwald",
  "Spessart",
  "Rhön",
  "Vogelsberg",
  "Taunus",
  "Hunsrück",
  "Westerwald",
  "Erzgebirge",
  "Vogtland",
  "Lausitz",
  "Uckermark",
  "Prignitz",
  "Altmark",
  "Börde",
  "Kyffhäuser",
  "Thüringer Wald",
  "Fichtelgebirge",
  "Bayerischer Wald",
  "Oberpfalz",
  "Chiemgau",
  "Berchtesgadener Land",
  "Bodensee",
  "Ostsee",
  "Nordsee",
  "Sylt",
  "Föhr",
  "Amrum",
  "Pellworm",
  "Fehmarn",
  "Rügen",
  "Usedom",
  "Hiddensee",
]

function extractKeywords(text: string | null | undefined): string[] {
  if (!text) return []
  const foundKeywords = new Set<string>()
  const lowerText = text.toLowerCase()
  KEYWORDS_TO_DETECT.forEach((keyword) => {
    if (lowerText.includes(keyword.toLowerCase())) {
      foundKeywords.add(keyword)
    }
  })
  return Array.from(foundKeywords)
}

function extractLocation(
  title: string | null | undefined,
  summary: string | null | undefined,
  content: string | null | undefined,
): string | null {
  // Kombiniere alle verfügbaren Texte für die Suche
  const searchText = [title, summary, content].filter(Boolean).join(" ")

  if (!searchText) return "Deutschland" // Fallback

  const searchTextLower = searchText.toLowerCase()

  // Suche nach deutschen Städten (sortiert nach Länge, damit längere Namen zuerst gefunden werden)
  const sortedCities = GERMAN_CITIES.sort((a, b) => b.length - a.length)

  for (const city of sortedCities) {
    const cityLower = city.toLowerCase()

    // Verschiedene Suchmuster:
    const patterns = [
      // "in Stadt", "aus Stadt", "bei Stadt"
      new RegExp(`\\b(in|aus|bei|von|nach)\\s+${cityLower}\\b`, "i"),
      // "Stadt:" am Anfang
      new RegExp(`^${cityLower}\\s*:`, "i"),
      // "Stadt -" oder "Stadt,"
      new RegExp(`\\b${cityLower}\\s*[-,]`, "i"),
      // Stadt in Klammern
      new RegExp(`\$$${cityLower}\$$`, "i"),
      // Einfach nur die Stadt (als letzter Versuch)
      new RegExp(`\\b${cityLower}\\b`, "i"),
    ]

    for (const pattern of patterns) {
      if (pattern.test(searchText)) {
        return city
      }
    }
  }

  // Fallback: Deutschland
  return "Deutschland"
}

export async function parseFeed(feedUrl: string, feedType: string, sourceName: string): Promise<ParsedNewsItem[]> {
  const parser = new Parser({
    customFields: {
      item: ["description", "summary", "content:encoded", "encoded", "pubDate", "dc:date", "dc:creator"],
    },
  })
  const MAX_RETRIES = 3
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(feedUrl, {
        headers: {
          "User-Agent": "RSSDashboard/1.0 (V0-Preview-Agent)", // Guter Stil, einen User-Agent zu setzen
        },
        // Wichtig für Next.js Server Components / Route Handlers, um Caching zu steuern
        // next: { revalidate: 3600 } // z.B. alle Stunde neu laden, oder 0 für keinen Cache
        cache: "no-store", // Für Testzwecke erstmal keinen Cache, um sicherzustellen, dass es immer frisch ist
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Could not read error response body")
        console.error(
          `Failed to fetch feed ${feedUrl}: ${response.status} ${response.statusText}. Body: ${errorText.substring(0, 500)}`,
        )
        throw new Error(`Failed to fetch feed ${feedUrl}: ${response.status} ${response.statusText}`)
      }
      const xmlString = await response.text()
      let feed
      try {
        feed = await parser.parseString(xmlString)
      } catch (e) {
        console.warn("❗XML parse failed, retrying with parser.parseURL", e)
        // fallback – rss-parser does its own fetching
        feed = await parser.parseURL(feedUrl)
      }

      if (!feed.items) continue

      return feed.items
        .map((item: Item) => {
          const title = item.title || null
          const summary = item.summary || item.contentSnippet || (item as any).description || null
          const content = item.content || (item as any)["content:encoded"] || (item as any).encoded || summary
          const publishedAtRaw = item.isoDate || item.pubDate || (item as any)["dc:date"]
          const publishedAt = publishedAtRaw ? new Date(publishedAtRaw).toISOString() : new Date().toISOString()
          const originalLink = item.link || null
          const id = item.guid || originalLink || `${title}-${publishedAt}`
          const combinedTextForKeywords = `${title} ${summary} ${content}`
          const keywords = extractKeywords(combinedTextForKeywords)

          // Neue, verbesserte Orts-Extraktion
          const location = extractLocation(title, summary, content)

          return {
            id,
            title,
            summary,
            content,
            publishedAt,
            source: sourceName,
            location,
            keywords,
            originalLink,
            feedType,
          }
        })
        .filter((item) => item.id && item.originalLink)
    } catch (error) {
      console.error(`Error parsing feed ${feedUrl}:`, error)
      const backoff = 500 * (attempt + 1)
      await new Promise((r) => setTimeout(r, backoff))
      continue
    }
  }
  return []
}

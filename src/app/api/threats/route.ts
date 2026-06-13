import { NextResponse } from "next/server";
import { COUNTRY_COORDS } from "@/lib/countryCoords";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ThreatEntry {
  id: string;
  type: string;
  source: { lat: number; lng: number; city: string; country: string };
  target: { lat: number; lng: number; city: string; country: string };
  timestamp: string;
  severity: "low" | "medium" | "high" | "critical";
}

interface GeoResult {
  status: string;
  query: string;
  country?: string;
  countryCode?: string;
  city?: string;
  lat?: number;
  lon?: number;
  isp?: string;
}

interface URLhausEntry {
  url: string;
  url_status: string;
  threat: string;
  host: string;
  date_added: string;
  tags: string[] | null;
}

// ---------------------------------------------------------------------------
// In-memory cache
// ---------------------------------------------------------------------------

let cachedResponse: { threats: ThreatEntry[]; lastUpdated: string } | null =
  null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60_000; // 60 seconds

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FETCH_TIMEOUT_MS = 10_000;

function fetchWithTimeout(
  url: string,
  opts: RequestInit = {},
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  return fetch(url, { ...opts, signal: controller.signal }).finally(() =>
    clearTimeout(timer),
  );
}

/** Pick a random entry from COUNTRY_COORDS to serve as the "target" */
function randomTarget(): {
  lat: number;
  lng: number;
  city: string;
  country: string;
} {
  const codes = Object.keys(COUNTRY_COORDS);
  const code = codes[Math.floor(Math.random() * codes.length)];
  const entry = COUNTRY_COORDS[code];
  return { lat: entry.lat, lng: entry.lng, city: entry.name, country: code };
}

/** Derive a threat type from URLhaus tags / threat field */
function urlhausThreatType(entry: URLhausEntry): string {
  const tags = (entry.tags ?? []).map((t) => t.toLowerCase());
  const threat = (entry.threat ?? "").toLowerCase();

  if (
    tags.some((t) => t.includes("phish")) ||
    threat.includes("phish")
  ) {
    return "Phishing Campaign";
  }
  if (
    tags.some((t) => t.includes("ransom")) ||
    threat.includes("ransom")
  ) {
    return "Ransomware Hosting";
  }
  return "Malware Distribution";
}

/** Derive a threat type for IPsum entries */
function ipsumThreatType(): string {
  const types = [
    "Brute Force",
    "DDoS Attack",
    "Port Scan",
    "Credential Stuffing",
  ];
  return types[Math.floor(Math.random() * types.length)];
}

/** Severity for IPsum based on hit count */
function ipsumSeverity(count: number): ThreatEntry["severity"] {
  if (count >= 8) return "critical";
  if (count >= 6) return "high";
  return "medium";
}

/** Severity for URLhaus based on status */
function urlhausSeverity(status: string): ThreatEntry["severity"] {
  if (status === "online") return "high";
  return "medium";
}

/** Extract a plausible IP or hostname from a URLhaus host field */
function extractIP(host: string): string {
  return host.trim();
}

// ---------------------------------------------------------------------------
// Data fetchers
// ---------------------------------------------------------------------------

interface RawIP {
  ip: string;
  source: "urlhaus" | "ipsum";
  meta: {
    type: string;
    severity: ThreatEntry["severity"];
    timestamp: string;
  };
}

async function fetchURLhaus(): Promise<RawIP[]> {
  try {
    const res = await fetchWithTimeout(
      "https://urlhaus-api.abuse.ch/v1/urls/recent/limit/50/",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "",
      },
    );
    if (!res.ok) return [];
    const json = await res.json();
    const urls: URLhausEntry[] = json.urls ?? [];

    return urls.map((u) => ({
      ip: extractIP(u.host),
      source: "urlhaus" as const,
      meta: {
        type: urlhausThreatType(u),
        severity: urlhausSeverity(u.url_status),
        timestamp: u.date_added
          ? new Date(u.date_added + " UTC").toISOString()
          : new Date().toISOString(),
      },
    }));
  } catch {
    console.error("[threats] URLhaus fetch failed");
    return [];
  }
}

async function fetchIPsum(): Promise<RawIP[]> {
  try {
    const res = await fetchWithTimeout(
      "https://raw.githubusercontent.com/stamparm/ipsum/master/ipsum.txt",
    );
    if (!res.ok) return [];
    const text = await res.text();
    const lines = text.split("\n");

    const results: RawIP[] = [];
    for (const line of lines) {
      if (line.startsWith("#") || line.trim() === "") continue;
      const [ip, countStr] = line.split("\t");
      const count = parseInt(countStr, 10);
      if (isNaN(count) || count < 5) continue;
      results.push({
        ip: ip.trim(),
        source: "ipsum",
        meta: {
          type: ipsumThreatType(),
          severity: ipsumSeverity(count),
          timestamp: new Date().toISOString(),
        },
      });
      // Collect at most 60 to leave room after mixing
      if (results.length >= 60) break;
    }
    return results;
  } catch {
    console.error("[threats] IPsum fetch failed");
    return [];
  }
}

// ---------------------------------------------------------------------------
// Geolocation (ip-api.com batch, max 100)
// ---------------------------------------------------------------------------

async function geolocateBatch(
  ips: string[],
): Promise<Map<string, GeoResult>> {
  const map = new Map<string, GeoResult>();
  if (ips.length === 0) return map;

  // ip-api batch accepts max 100
  const batch = ips.slice(0, 100).map((ip) => ({ query: ip }));

  try {
    const res = await fetchWithTimeout("http://ip-api.com/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(batch),
    });
    if (!res.ok) return map;
    const results: GeoResult[] = await res.json();

    for (const r of results) {
      if (r.status === "success") {
        map.set(r.query, r);
      }
    }
  } catch {
    console.error("[threats] ip-api batch geolocation failed");
  }

  return map;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

export async function GET() {
  // Return cached data if still fresh
  if (cachedResponse && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
    return NextResponse.json(cachedResponse);
  }

  try {
    // Fetch both sources in parallel
    const [urlhausRaw, ipsumRaw] = await Promise.all([
      fetchURLhaus(),
      fetchIPsum(),
    ]);

    // Mix both sources: take up to 15 from URLhaus, rest from IPsum, cap at 25
    const urlhausSlice = urlhausRaw.slice(0, 15);
    const ipsumSlice = ipsumRaw.slice(0, 25 - urlhausSlice.length);
    const combined = [...urlhausSlice, ...ipsumSlice];

    if (combined.length === 0) {
      const empty = { threats: [], lastUpdated: new Date().toISOString() };
      cachedResponse = empty;
      cacheTimestamp = Date.now();
      return NextResponse.json(empty);
    }

    // Deduplicate IPs for geolocation
    const uniqueIPs = [...new Set(combined.map((c) => c.ip))];

    // Geolocate
    const geoMap = await geolocateBatch(uniqueIPs);

    // Build threat entries
    const threats: ThreatEntry[] = [];
    for (let i = 0; i < combined.length; i++) {
      const raw = combined[i];
      const geo = geoMap.get(raw.ip);

      // Skip entries we couldn't geolocate (domain names, private IPs, etc.)
      if (!geo) continue;

      threats.push({
        id: `${raw.source}-${i}-${Date.now()}`,
        type: raw.meta.type,
        source: {
          lat: geo.lat ?? 0,
          lng: geo.lon ?? 0,
          city: geo.city ?? "Unknown",
          country: geo.countryCode ?? "??",
        },
        target: randomTarget(),
        timestamp: raw.meta.timestamp,
        severity: raw.meta.severity,
      });
    }

    // Cap at 25
    const finalThreats = threats.slice(0, 25);

    const response = {
      threats: finalThreats,
      lastUpdated: new Date().toISOString(),
    };

    // Cache
    cachedResponse = response;
    cacheTimestamp = Date.now();

    return NextResponse.json(response);
  } catch (err) {
    console.error("[threats] Unexpected error:", err);
    return NextResponse.json(
      { threats: [], lastUpdated: new Date().toISOString() },
      { status: 200 },
    );
  }
}

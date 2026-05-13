import { NextRequest, NextResponse } from "next/server";

// Domain mappings for common Indian/global institutions
const KNOWN_DOMAINS: Record<string, string> = {
  "iit bombay": "iitb.ac.in",
  "iitb": "iitb.ac.in",
  "iit delhi": "iitd.ac.in",
  "iitd": "iitd.ac.in",
  "iit madras": "iitm.ac.in",
  "iitm": "iitm.ac.in",
  "iit roorkee": "iitr.ac.in",
  "iitr": "iitr.ac.in",
  "iit kanpur": "iitk.ac.in",
  "iitk": "iitk.ac.in",
  "iit kharagpur": "iitkgp.ac.in",
  "iit guwahati": "iitg.ac.in",
  "iit hyderabad": "iith.ac.in",
  "iit bhubaneswar": "iitbbs.ac.in",
  "iit gandhinagar": "iitgn.ac.in",
  "iit jodhpur": "iitj.ac.in",
  "iit mandi": "iitmandi.ac.in",
  "iit patna": "iitp.ac.in",
  "iit ropar": "iitrpr.ac.in",
  "iit indore": "iiti.ac.in",
  "iit varanasi": "iitbhu.ac.in",
  "iit (bhu) varanasi": "iitbhu.ac.in",
  "aiims": "aiims.edu",
  "aiims delhi": "aiims.edu",
  "aiims new delhi": "aiims.edu",
  "jnu": "jnu.ac.in",
  "jawaharlal nehru university": "jnu.ac.in",
  "du": "du.ac.in",
  "delhi university": "du.ac.in",
  "university of delhi": "du.ac.in",
  "bits pilani": "bits-pilani.ac.in",
  "nit trichy": "nitt.edu",
  "nit warangal": "nitw.ac.in",
  "iisc": "iisc.ac.in",
  "iisc bangalore": "iisc.ac.in",
  "indian institute of science": "iisc.ac.in",
  "tifr": "tifr.res.in",
  "mit": "mit.edu",
  "harvard": "harvard.edu",
  "harvard university": "harvard.edu",
  "stanford": "stanford.edu",
  "stanford university": "stanford.edu",
  "oxford": "ox.ac.uk",
  "university of oxford": "ox.ac.uk",
  "cambridge": "cam.ac.uk",
  "university of cambridge": "cam.ac.uk",
  "johns hopkins": "jhu.edu",
  "johns hopkins university": "jhu.edu",
  "yale": "yale.edu",
  "yale university": "yale.edu",
  "caltech": "caltech.edu",
  "princeton": "princeton.edu",
  "princeton university": "princeton.edu",
  "columbia": "columbia.edu",
  "columbia university": "columbia.edu",
  "mit biology": "mit.edu",
  "johns hopkins medicine": "hopkinsmedicine.org",
  "ucsd": "ucsd.edu",
  "uc berkeley": "berkeley.edu",
  "ucl": "ucl.ac.uk",
  "imperial college": "imperial.ac.uk",
  "imperial college london": "imperial.ac.uk",
  "eth zurich": "ethz.ch",
  "embl": "embl.org",
  "embl heidelberg": "embl.org",
};

// Try to guess a domain from an institution name
function guessDomain(name: string): string | null {
  const lower = name.toLowerCase().trim();
  // Direct map
  if (KNOWN_DOMAINS[lower]) return KNOWN_DOMAINS[lower];
  // Partial match
  for (const [key, domain] of Object.entries(KNOWN_DOMAINS)) {
    if (lower.includes(key) || key.includes(lower)) return domain;
  }
  return null;
}

// Try Clearbit logo (free, no auth)
async function getClearbitLogo(domain: string): Promise<string | null> {
  const url = `https://logo.clearbit.com/${domain}`;
  try {
    const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(3000) });
    if (res.ok) return url;
  } catch {
    // ignore
  }
  return null;
}

// Try Wikipedia page thumbnail
async function getWikipediaLogo(name: string): Promise<string | null> {
  try {
    const encoded = encodeURIComponent(name);
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`,
      { signal: AbortSignal.timeout(4000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.thumbnail?.source ?? data?.originalimage?.source ?? null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name")?.trim();
  if (!name) {
    return NextResponse.json({ logoUrl: null, source: null });
  }

  // 1. Try Clearbit with guessed domain
  const domain = guessDomain(name);
  if (domain) {
    const clearbitUrl = await getClearbitLogo(domain);
    if (clearbitUrl) {
      return NextResponse.json({ logoUrl: clearbitUrl, source: "clearbit", domain });
    }
  }

  // 2. Try Wikipedia thumbnail
  const wikiUrl = await getWikipediaLogo(name);
  if (wikiUrl) {
    return NextResponse.json({ logoUrl: wikiUrl, source: "wikipedia" });
  }

  // 3. Nothing found
  return NextResponse.json({ logoUrl: null, source: null });
}

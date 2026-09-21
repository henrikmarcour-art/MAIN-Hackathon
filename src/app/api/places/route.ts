import { NextRequest, NextResponse } from "next/server";

const PHOTON = "https://photon.komoot.io";
const HEADERS = { "User-Agent": "MaasNow/0.1 (hackathon)" };

export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("mode") ?? "search";
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const lng = req.nextUrl.searchParams.get("lng");
  const lat = req.nextUrl.searchParams.get("lat");

  try {
    if (mode === "reverse") {
      if (!lng || !lat) {
        return NextResponse.json({ features: [] }, { status: 400 });
      }
      const url = `${PHOTON}/reverse?lon=${encodeURIComponent(lng)}&lat=${encodeURIComponent(lat)}`;
      const res = await fetch(url, { headers: HEADERS, next: { revalidate: 0 } });
      const data = await res.json();
      return NextResponse.json(data);
    }

    if (q.trim().length < 2) {
      return NextResponse.json({ features: [] });
    }

    const params = new URLSearchParams({
      q: q.trim(),
      lat: "50.8515",
      lon: "5.6925",
      limit: "8",
      lang: "en",
      bbox: "5.62,50.82,5.76,50.88",
    });

    const res = await fetch(`${PHOTON}/api/?${params.toString()}`, {
      headers: HEADERS,
      next: { revalidate: 0 },
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ features: [] }, { status: 502 });
  }
}

// frontend/src/app/api/ingredients/route.ts
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";

function toTitleCase(s: string) {
  return s
    .toLowerCase()
    .replace(/\b([a-z])/g, (m) => m.toUpperCase())
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();

  if (q.length < 2) {
    return NextResponse.json({ items: [] }, { status: 200 });
  }

  // const apiKey = process.env.FDC_API_KEY;
  const apiKey = "JefFFdNmsHJj4uja6c2MxXRZhSt5EXFCaCmJAzeV";
  if (!apiKey) {
    console.error("FDC_API_KEY missing");
    return NextResponse.json({ items: [], error: "Missing FDC_API_KEY" }, { status: 500 });
  }

  const url =
    "https://api.nal.usda.gov/fdc/v1/foods/search?" +
    new URLSearchParams({
      query: q,
      pageSize: "25",
      dataType: "Branded,Survey (FNDDS),SR Legacy",
    }).toString();

  try {
    const resp = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apiKey,
      },
      next: { revalidate: 60 * 60 * 24 },
    });

    if (!resp.ok) {
      console.error("FDC error", resp.status);
      return NextResponse.json(
        { items: [], error: `FDC error ${resp.status}` },
        { status: 502 }
      );
    }

    const data = (await resp.json()) as any;

    const names = new Set<string>();
    for (const f of data?.foods ?? []) {
      if (f?.description) names.add(toTitleCase(String(f.description)));
      if (f?.additionalDescriptions) {
        String(f.additionalDescriptions)
          .split(/[,;]+/)
          .map((s: string) => toTitleCase(s))
          .forEach((n: string) => n && names.add(n));
      }
      if (f?.brandName && f?.description) {
        names.add(toTitleCase(`${f.brandName} ${f.description}`));
      }
    }

    const items = Array.from(names).slice(0, 30);
    return NextResponse.json({ items });
  } catch (err) {
    console.error("FDC network error", err);
    return NextResponse.json(
      { items: [], error: "Network/parse error" },
      { status: 500 }
    );
  }
}

import fs from "node:fs/promises";
import path from "node:path";
import dotenv from "dotenv";

// load .env.local (NOT committed to git)
dotenv.config({path: path.join(process.cwd(), ".env.local")});

const API_KEY = "JefFFdNmsHJj4uja6c2MxXRZhSt5EXFCaCmJAzeV";
if (!API_KEY) {
  console.error("Missing FDC_API_KEY in .env.local");
  process.exit(1);
}

function toTitleCase(s: string) {
  return s
    .toLowerCase()
    .replace(/\b([a-z])/g, (m) => m.toUpperCase())
    .replace(/\s+/g, " ")
    .trim();
}

const BASE_URL = "https://api.nal.usda.gov/fdc/v1";

// How many pages to fetch – you can tweak this
const PAGE_SIZE = 200;
const MAX_PAGES = 15; // 15 * 200 = 3000 foods approx.

async function fetchPage(pageNumber: number) {
  const url =
    `${BASE_URL}/foods/list?` +
    new URLSearchParams({
      api_key: API_KEY,
      pageSize: PAGE_SIZE.toString(),
      pageNumber: pageNumber.toString(),
      dataType: "SR Legacy,Survey (FNDDS)",
    }).toString();

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`FDC error ${res.status}`);
  }
  const foods = (await res.json()) as any[];
  return foods;
}

async function main() {
  const names = new Set<string>();

  console.log("Fetching ingredient names from FoodData Central...");

  for (let page = 1; page <= MAX_PAGES; page++) {
    console.log(`Page ${page}/${MAX_PAGES}...`);
    const foods = await fetchPage(page);
    if (!foods.length) {
      console.log("No more foods, stopping.");
      break;
    }

    for (const f of foods) {
      if (f?.description) names.add(toTitleCase(String(f.description)));
      if (f?.additionalDescriptions) {
        String(f.additionalDescriptions)
          .split(/[,;]+/)
          .map((s: string) => toTitleCase(s))
          .forEach((n: string) => n && names.add(n));
      }
      if (f?.brandOwner && f?.description) {
        names.add(toTitleCase(`${f.brandOwner} ${f.description}`));
      }
    }
  }

  const list = Array.from(names).sort();
  console.log(`Collected ${list.length} unique ingredient names.`);

  const outPath = path.join(process.cwd(), "data");
  await fs.mkdir(outPath, {recursive: true});

  const file = path.join(outPath, "ingredients.json");
  await fs.writeFile(file, JSON.stringify(list, null, 2), "utf8");
  console.log(`Saved to ${file}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

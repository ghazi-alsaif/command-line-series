// يجهّز أصول الفيديو قبل المعاينة أو الرندر:
//   1) ينسخ الخطوط المطلوبة من ../fonts إلى public/fonts
//   2) ينسخ هوية السلسلة من ../docs/readme-brand إلى public/brand
//   3) يستخرج بيانات الكتب (الأسماء، الموضوعات، الصفحات، المجموع) من ../README.md
//      ويكتبها في src/data/generated.json — README هو مصدر الحقيقة.
//   4) الأغلفة: تُستعمل public/covers/*.jpg (نسخ عالية الدقة من صفحة الغلاف الرسمية).
//      مع --refresh-covers تُعاد صناعتها من مصادر الكتب نفسها عبر Typst.
//      إن غابت، يُرجع إلى docs/readme-covers/*.png (دقة أقل).
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const motion = path.resolve(here, "..");
const repo = path.resolve(motion, "..");
const pub = path.join(motion, "public");

const BOOK_IDS = [
  "1-linux", "2-macos", "3-windows", "4-bsd", "5-workbook",
  "6-unix-story", "7-automation", "8-server", "9-network", "10-projects",
];

const FONTS = [
  "IBMPlexSansArabic-Light.ttf",
  "IBMPlexSansArabic-Regular.ttf",
  "IBMPlexSansArabic-Medium.ttf",
  "IBMPlexSansArabic-SemiBold.ttf",
  "IBMPlexSansArabic-Bold.ttf",
  "NotoKufiArabic-Regular.ttf",
  "NotoKufiArabic-SemiBold.ttf",
  "NotoKufiArabic-Bold.ttf",
  "NotoKufiArabic-ExtraBold.ttf",
  "JetBrainsMono-Regular.ttf",
  "JetBrainsMono-Medium.ttf",
  "JetBrainsMono-Bold.ttf",
];

const copy = (from, to) => {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  if (!fs.existsSync(to) || fs.statSync(from).mtimeMs > fs.statSync(to).mtimeMs) {
    fs.copyFileSync(from, to);
  }
};

// 1) الخطوط
for (const f of FONTS) copy(path.join(repo, "fonts", f), path.join(pub, "fonts", f));

// 2) الهوية
for (const f of ["series-mark.png", "series-identity.png"]) {
  copy(path.join(repo, "docs/readme-brand", f), path.join(pub, "brand", f));
}

// 4) الأغلفة
const refresh = process.argv.includes("--refresh-covers");
if (refresh) {
  const typst = process.env.TYPST || "typst";
  const tmp = fs.mkdtempSync(path.join(motion, ".covers-"));
  for (const id of BOOK_IDS) {
    console.log(`typst → cover ${id}`);
    execFileSync(typst, [
      "compile", "--root", repo, "--font-path", path.join(repo, "fonts"),
      "--ignore-system-fonts", "--pages", "1", "--ppi", "220",
      path.join(repo, "books", id, "ar/main.typ"), path.join(tmp, `${id}-{p}.png`),
    ], { stdio: "inherit" });
    execFileSync("ffmpeg", [
      "-y", "-loglevel", "error", "-i", path.join(tmp, `${id}-1.png`),
      "-vf", "scale=1000:-1:flags=lanczos", "-q:v", "2",
      path.join(pub, "covers", `${id}.jpg`),
    ]);
  }
  fs.rmSync(tmp, { recursive: true, force: true });
}
const covers = {};
for (const id of BOOK_IDS) {
  const hi = path.join(pub, "covers", `${id}.jpg`);
  if (fs.existsSync(hi)) {
    covers[id] = `covers/${id}.jpg`;
  } else {
    copy(path.join(repo, "docs/readme-covers", `${id}.png`), path.join(pub, "covers-readme", `${id}.png`));
    covers[id] = `covers-readme/${id}.png`;
    console.warn(`⚠ ${id}: لا توجد نسخة عالية الدقة؛ استُعمل غلاف README (376×533).`);
  }
}

// 3) البيانات من README
const readme = fs.readFileSync(path.join(repo, "README.md"), "utf8");
const toNum = (s) => Number(String(s).replace(/[,٬\s]/g, ""));

const rowRe = /^\|\s*(\d+)\s*\|\s*\S+\s*\*\*(.+?)\*\*\s*\|\s*(.+?)\s*\|\s*.*?·\s*([\d,]+)\s*ص\s*\|\s*$/gmu;
const rows = [...readme.matchAll(rowRe)].map((m) => ({
  n: Number(m[1]), title: m[2].trim(), topic: m[3].trim(), pages: toNum(m[4]),
}));
if (rows.length !== BOOK_IDS.length) {
  throw new Error(`توقّعتُ ${BOOK_IDS.length} كتب في جدول README، ووجدت ${rows.length}.`);
}

const totalMatch = readme.match(/المجموع\s+([\d,٬]+)\s+صفحة(?:\s+في\s+الإصدار\s+(\d+(?:\.\d+)*))?/u);
const totalFromReadme = totalMatch ? toNum(totalMatch[1]) : null;
const sum = rows.reduce((a, r) => a + r.pages, 0);
if (totalFromReadme !== null && totalFromReadme !== sum) {
  console.warn(`⚠ مجموع README (${totalFromReadme}) يختلف عن مجموع الجدول (${sum}); سيُعرض رقم README.`);
}

const pick = (re) => (readme.match(re) || [])[1]?.trim() ?? null;
const data = {
  source: "README.md",
  version: totalMatch?.[2] ?? null,
  tagline: pick(/^\*\*(من الصفر إلى فهم الآلة)\*\*$/mu) ?? pick(/^\*\*([^*\n]{6,40})\*\*$/mu),
  lede: pick(/^\*\*(سلسلةٌ[^*\n]+)\*\*$/mu),
  craftEn: pick(/^\*(One craft[^*\n]+)\*$/mu),
  requirement: pick(/^(المتطلّب الوحيد[^\n]+)$/mu),
  siteUrl: pick(/\((https:\/\/[a-z0-9-]+\.github\.io\/[^)\s]+)\)/u),
  repoUrl: "github.com/ghazi-alsaif/command-line-series",
  author: pick(/اسم «([^»]+)»/u),
  bookCount: rows.length,
  totalPages: totalFromReadme ?? sum,
  books: rows.map((r, i) => ({ ...r, id: BOOK_IDS[i], cover: covers[BOOK_IDS[i]] })),
};

const out = path.join(motion, "src/data/generated.json");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(data, null, 2) + "\n");
console.log(`✓ ${data.bookCount} كتب · ${data.totalPages} صفحة · الأصول جاهزة`);

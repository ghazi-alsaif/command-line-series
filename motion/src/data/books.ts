// بيانات الكتب: الأسماء والموضوعات والصفحات تُستخرج آليًا من README.md
// (scripts/prepare-assets.mjs → generated.json). هنا فقط ما لا يوجد في README:
// لون عنوان كل غلاف (من books/*/ar/frontmatter/cover.typ) وأمر حقيقي من متن الكتاب.
import generated from "./generated.json";

export type Book = {
  n: number;
  id: string;
  title: string;
  topic: string;
  pages: number;
  cover: string;
  /** لون عنوان الغلاف كما في cover.typ — يُشتق منه لون اللمسة */
  titleColor: string;
  /** أمر يرد فعلًا في متن الكتاب (للكتب 7–10) */
  command?: string;
};

const EXTRA: Record<string, { titleColor: string; command?: string }> = {
  "1-linux": { titleColor: "#6E2C12" },
  "2-macos": { titleColor: "#234A5F" },
  "3-windows": { titleColor: "#5E3E0A" },
  "4-bsd": { titleColor: "#5E1A13" },
  "5-workbook": { titleColor: "#382863" },
  "6-unix-story": { titleColor: "#363B5E" },
  "7-automation": { titleColor: "#145A54", command: "set -euo pipefail" },
  "8-server": { titleColor: "#145A54", command: "systemctl status ssh" },
  "9-network": { titleColor: "#145A54", command: "dig example.com" },
  "10-projects": { titleColor: "#145A54", command: "git init" },
};

export const BOOKS: Book[] = generated.books.map((b) => ({ ...b, ...EXTRA[b.id] }));

export const SERIES = {
  tagline: generated.tagline ?? "من الصفر إلى فهم الآلة",
  lede: generated.lede,
  craftEn: generated.craftEn,
  requirement: generated.requirement,
  siteUrl: generated.siteUrl,
  repoUrl: generated.repoUrl,
  author: generated.author ?? "غازي السيف — أبو هيثم",
  bookCount: generated.bookCount,
  totalPages: generated.totalPages,
  version: generated.version,
};

export const byN = (n: number): Book => {
  const b = BOOKS.find((x) => x.n === n);
  if (!b) throw new Error(`Book ${n} not found`);
  return b;
};

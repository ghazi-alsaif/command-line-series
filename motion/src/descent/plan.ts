// «الهبوط» — خطة الفيديو الثاني: مصدر واحد للتوقيت والتخطيط والصوت.
// يقرؤه React للرسم، ويُصدَّر JSON يقرؤه مولّد الموسيقى (scripts/score.py)
// فتلتصق كل نغمة وكل نَفَس هواء بالحركة نفسها إطارًا بإطار.
//
// الإيقاع: 120 BPM · 30 fps → النبضة = 15 إطارًا، المازورة = 60 إطارًا (ثانيتان).

export const FPS = 30;
export const BPM = 120;
export const BEAT = 15;
export const BAR = 60;
export const TOTAL = 22 * BAR; // 1320 إطارًا = 44 ثانية

// ── الهندسة ─────────────────────────────────────────────────────────
export const W = 1080;
export const H = 1920;
export const COVER_W = 440;
export const COVER_H = Math.round(COVER_W * 1.419);
export const BOOK_ANCHOR = 790; // أين يستقر مركز الغلاف على الشاشة

// العالم: عمود رأسي واحد، الجذر يبدأ من الشعار وينتهي عند «الطرف».
export const WORLD = {
  mark: 900,
  books: [2500, 4000, 5500, 7000, 9600, 11100, 12900, 14200, 15500, 16800],
  junction: 8300, // الضفائر الأربع تلتقي في جذع واحد
  braidStart: 1150,
  fossil: 11100, // طبقة 1969
  circuitStart: 11950, // الجذر يتحول إلى مسار دارة
  tip: 18050,
};

// ── منحنيات الحركة (نفسها في Python) ─────────────────────────────────
export type EaseName = "plunge" | "glide" | "linear";
export const ease = (name: EaseName, t: number): number => {
  const x = Math.min(1, Math.max(0, t));
  if (name === "linear") return x;
  if (name === "glide") return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  // plunge: انطلاق حاد وهبوط ناعم يستقر بلا ارتداد
  return x < 0.5 ? 16 * Math.pow(x, 5) : 1 - Math.pow(-2 * x + 2, 5) / 2;
};

// ── الكاميرا ─────────────────────────────────────────────────────────
export type Seg = { f0: number; f1: number; y0: number; y1: number; ease: EaseName };

const at = (worldY: number, anchor = BOOK_ANCHOR) => worldY - anchor;

// لحظات الهبوط على كل كتاب — كلها على رأس مازورة أو نبضة
export const LAND = [120, 180, 240, 300, 420, 480, 600, 660, 720, 780];
export const JUNCTION_LAND = 360;
export const TIP_LAND = 860;
export const HERO = 900;
export const OUTRO = 1080;
export const LOOP_CLOSE = 1260;

const DRIFT = 34;
const travel = [24, 22, 22, 22, 22, 32, 22, 20, 20, 20];

export const CAMERA: Seg[] = (() => {
  const s: Seg[] = [];
  let y = 0;
  let f = 0;
  const hop = (land: number, dur: number, target: number, e: EaseName = "plunge") => {
    const start = land - dur;
    s.push({ f0: f, f1: start, y0: y, y1: y + (start > f ? DRIFT : 0), ease: "linear" });
    y = y + (start > f ? DRIFT : 0);
    s.push({ f0: start, f1: land, y0: y, y1: target, ease: e });
    y = target;
    f = land;
  };
  // الافتتاح: الكاميرا ثابتة حتى الإطار 96
  s.push({ f0: 0, f1: 96, y0: 0, y1: 0, ease: "linear" });
  f = 96;
  s.push({ f0: 96, f1: LAND[0], y0: 0, y1: at(WORLD.books[0]), ease: "plunge" });
  y = at(WORLD.books[0]);
  f = LAND[0];
  for (let i = 1; i < 4; i++) hop(LAND[i], travel[i], at(WORLD.books[i]));
  hop(JUNCTION_LAND, 22, at(WORLD.junction, 900));
  hop(LAND[4], travel[4], at(WORLD.books[4]));
  hop(LAND[5], travel[5], at(WORLD.books[5]), "glide");
  for (let i = 6; i < 10; i++) hop(LAND[i], travel[i], at(WORLD.books[i]));
  hop(TIP_LAND, 24, at(WORLD.tip, 760));
  s.push({ f0: TIP_LAND, f1: HERO, y0: y, y1: y + 26, ease: "linear" });
  return s;
})();

export const camY = (frame: number): number => {
  if (frame <= 0) return 0;
  for (const g of CAMERA) {
    if (frame >= g.f0 && frame < g.f1) {
      const t = (frame - g.f0) / Math.max(1, g.f1 - g.f0);
      return g.y0 + (g.y1 - g.y0) * ease(g.ease, t);
    }
  }
  const last = CAMERA[CAMERA.length - 1];
  return last.y1;
};

export const camVel = (frame: number) => camY(frame) - camY(frame - 1);

// ── الكتابة على الطرفية (كل حرف = نقرة في الصوت) ───────────────────────
export type Typing = { start: number; text: string; step: number };
export const COMMANDS = ["set -euo pipefail", "systemctl status ssh", "dig example.com", "git init"];
export const TYPING: Typing[] = [
  { start: 8, text: "cd /", step: 3 },
  ...COMMANDS.map((text, i) => ({ start: LAND[6 + i] + 3, text, step: 1.5 })),
];
export const ENTER_AT = 22;
export const typedCount = (t: Typing, frame: number) =>
  Math.max(0, Math.min(t.text.length, Math.floor((frame - t.start) / t.step) + 1));

// اقتباس «رُوحٌ في الآلة» يُكشف بإيقاع آلة كاتبة
export const QUOTE_REVEAL = { start: LAND[5] + 30, dur: 46 };

// ── لحظات العرض البطولي ───────────────────────────────────────────────
export const HERO_LAND = Array.from({ length: 10 }, (_, i) => HERO + 8 + i * 5);
export const HERO_TEXT = { count: HERO + 58, pages: HERO + 68, tagline: HERO + 92 };

// نغمة لكل كتاب: سُلّم ري الصغير صاعدًا — تُعزف عند هبوط الكاميرا عليه،
// ثم تُعزف العشر لحنًا واحدًا حين تجتمع الكتب.
export const BOOK_NOTES = [62, 64, 65, 67, 69, 70, 72, 74, 76, 77]; // MIDI

export const exportPlan = () => ({
  FPS, BPM, BEAT, BAR, TOTAL, W, H, WORLD, LAND, JUNCTION_LAND, TIP_LAND, HERO, OUTRO, LOOP_CLOSE,
  CAMERA, TYPING, ENTER_AT, QUOTE_REVEAL, HERO_LAND, HERO_TEXT, BOOK_NOTES,
  typed: TYPING.map((t) => Array.from({ length: t.text.length }, (_, k) => Math.ceil(t.start + k * t.step))),
  velocity: Array.from({ length: TOTAL }, (_, f) => camVel(f)),
});

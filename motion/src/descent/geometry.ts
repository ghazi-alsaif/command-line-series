// هندسة الجذر: دالة واحدة تحدد مكان الجذر في كل عمق — تستعملها الجذور والنبضات والكتب.
import { WORLD } from "./plan";

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

// شعار الطرفية (الجزء العلوي من series-mark.png): عرض 300، ارتفاع 234
export const MARK_W = 300;
export const MARK_H = 234;
export const MARK_BOTTOM = WORLD.mark + MARK_H / 2 - 6;

const organicBase = (y: number) => 540 + 85 * Math.sin(y / 520 + 0.6) + 34 * Math.sin(y / 190 + 1.7);

/** الجذع العضوي: ينطلق مستقيمًا من الشعار ثم يتلوّى */
export const trunkX = (y: number) => 540 + (organicBase(y) - 540) * smooth(MARK_BOTTOM, MARK_BOTTOM + 700, y);

/** سعة الضفيرة: أربع خيوط (أربع نوافذ) تلتقي في جذع واحد عند الملتقى */
export const braidAmp = (y: number) =>
  46 * smooth(MARK_BOTTOM + 40, MARK_BOTTOM + 520, y) * (1 - smooth(WORLD.junction - 520, WORLD.junction, y));

export const strandX = (i: number, y: number) => trunkX(y) + braidAmp(y) * Math.sin(y / 150 + (i * Math.PI) / 2);

// ── مسار الدارة (من الكتاب السابع): مقاطع رأسية وانعطافات 45° كلوحة إلكترونية ──
export const CIRCUIT: [number, number][] = (() => {
  const pts: [number, number][] = [];
  let y = WORLD.circuitStart;
  let x = trunkX(y);
  pts.push([x, y]);
  const offs = [150, -135, 165, -120, 140, -160, 125, -150, 160, -130];
  let k = 0;
  while (y < WORLD.tip - 900) {
    y += 380;
    pts.push([x, y]);
    const nx = 540 + offs[k % offs.length];
    y += Math.abs(nx - x);
    x = nx;
    pts.push([x, y]);
    k++;
  }
  y += 200;
  pts.push([x, y]);
  y += Math.abs(540 - x);
  x = 540;
  pts.push([x, y]);
  pts.push([540, WORLD.tip]);
  return pts;
})();

export const circuitX = (y: number) => {
  for (let i = 1; i < CIRCUIT.length; i++) {
    const [x0, y0] = CIRCUIT[i - 1];
    const [x1, y1] = CIRCUIT[i];
    if (y <= y1) return y1 === y0 ? x1 : x0 + ((x1 - x0) * (y - y0)) / (y1 - y0);
  }
  return 540;
};

/** موضع الجذر الرئيس في أي عمق */
export const rootX = (y: number) => (y < WORLD.circuitStart ? trunkX(y) : circuitX(y));

// ضوضاء حتمية (لا عشوائية بين الإطارات)
export const hash = (n: number) => {
  const s = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
};

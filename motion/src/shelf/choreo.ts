// تصميم الحركة: موضع كل كتاب واتجاهه، وموضع الكاميرا، كدوال صافية للإطار.
import * as THREE from "three";
import thick from "../data/books3d.json";
import { BOOKS } from "../data/books";
import {
  COUNT, DIVE, DOLLY, DROP, FRONT, FRONT_DUR, HELIX_END, LAND, LIFT, LIFT_DUR, LIGHT_ON, OPEN, TURN, liftStart,
} from "./plan";

// الوحدة = سم. سماكة مضخّمة 1.5× مع الإبقاء على التناسب بين الكتب
export const EXAG = 1.5;
export const COVER_W = 14.8;
export const SPINE_W = 0.3;
export const BOOK_W = COVER_W + SPINE_W;
export const BOOK_H = 21;
export const T = BOOKS.map((b) => ((thick as Record<string, { thicknessMm: number }>)[b.id].thicknessMm / 10) * EXAG);
const STACK_BASE = T.map((_, i) => T.slice(0, i).reduce((a, b) => a + b, 0));
export const TOWER_H = T.reduce((a, b) => a + b, 0);

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const easeInOut = (t: number) => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
export const easeOut = (t: number) => 1 - Math.pow(1 - clamp01(t), 4);
const easeIn = (t: number) => clamp01(t) * clamp01(t);
export const prog = (f: number, a: number, b: number) => clamp01((f - a) / (b - a));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const JITTER = [3, -5, 2, -7, 5, -2, 6, -4, 7, -1];
const OFFX = [0.3, -0.5, 0.6, -0.2, 0.4, -0.6, 0.2, -0.4, 0.5, -0.3];
const OFFZ = [-0.2, 0.4, -0.5, 0.3, -0.4, 0.2, -0.3, 0.5, -0.2, 0.3];

const q = (x: number, y: number, z: number) => new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z, "YXZ"));
const deg = Math.PI / 180;

export type Pose = { pos: THREE.Vector3; quat: THREE.Quaternion; visible: boolean; open: number; turn: number };

// اللولب: الكتاب الأول أسفل، العاشر أعلى — درج يصعد
const HELIX_R = 18;
const HELIX_STEP = 8.6;
const helixAngle = (i: number, f: number) => i * 0.74 - 0.35 + (f - LIFT) * 0.011;
export const helixY = (i: number) => 10 + i * HELIX_STEP;

const stackPose = (i: number) => ({
  pos: new THREE.Vector3(OFFX[i], STACK_BASE[i] + T[i] / 2, OFFZ[i]),
  quat: q(-Math.PI / 2, JITTER[i] * deg, 0),
});

const helixPose = (i: number, f: number) => {
  const a = helixAngle(i, f);
  const bob = Math.sin(f / 22 + i) * 0.5;
  return {
    pos: new THREE.Vector3(HELIX_R * Math.sin(a), helixY(i) + bob, HELIX_R * Math.cos(a)),
    quat: q(Math.sin(f / 30 + i) * 0.04, a, 0),
  };
};

// المشهد الأمامي: الكتاب الأول واقفًا أمام الكاميرا
export const FRONT_POS = new THREE.Vector3(0, 40, 0);

export const bookPose = (i: number, f: number): Pose => {
  const land = LAND[i];
  // قبل السقوط: مخفي
  if (f < land - DROP) return { ...stackPose(i), visible: false, open: 0, turn: 0 };

  // السقوط والارتداد
  if (f < liftStart(i)) {
    const s = stackPose(i);
    if (f < land) {
      const t = easeIn(prog(f, land - DROP, land));
      s.pos.y += lerp(46, 0, t);
      s.quat = q(-Math.PI / 2 + (1 - t) * 0.25, (JITTER[i] + (1 - t) * 30) * deg, (1 - t) * 0.12);
    } else {
      const d = f - land;
      if (d < 8) s.pos.y += Math.sin((d / 8) * Math.PI) * 0.45 * (1 - d / 8);
    }
    return { ...s, visible: true, open: 0, turn: 0 };
  }

  // إلى اللولب
  const ls = liftStart(i);
  const hp = helixPose(i, f);
  if (f < ls + LIFT_DUR || f < FRONT) {
    const t = easeInOut(prog(f, ls, ls + LIFT_DUR));
    const s = stackPose(i);
    const pos = s.pos.clone().lerp(hp.pos, t);
    pos.y += Math.sin(t * Math.PI) * 6;
    const quat = s.quat.clone().slerp(hp.quat, t);
    return { pos, quat, visible: true, open: 0, turn: 0 };
  }

  // بعد اللولب
  const t = easeInOut(prog(f, FRONT, FRONT + FRONT_DUR));
  if (i !== 0) {
    // تتراجع في الظلام
    const pos = hp.pos.clone().multiplyScalar(lerp(1, 2.4, t));
    pos.y = lerp(hp.pos.y, hp.pos.y + 30, t);
    pos.z -= t * 80;
    return { pos, quat: hp.quat, visible: f < HELIX_END + 70, open: 0, turn: 0 };
  }
  // الكتاب الأول يتقدم ويُفتح، وينزاح يسارًا ليتوسط الصفحتان
  const open = easeInOut(prog(f, OPEN[0], OPEN[1]));
  const front = FRONT_POS.clone();
  front.x -= open * (COVER_W / 2 + SPINE_W / 2);
  const pos = hp.pos.clone().lerp(front, t);
  const quat = hp.quat.clone().slerp(q(0, 0, 0), t);
  const turn = easeInOut(prog(f, TURN[0], TURN[1]));
  return { pos, quat, visible: true, open, turn };
};

// ── الكاميرا ─────────────────────────────────────────────────────────
export type Cam = { pos: THREE.Vector3; target: THREE.Vector3; fov: number };

const orbit = (target: THREE.Vector3, yawDeg: number, elevDeg: number, dist: number) =>
  new THREE.Vector3(
    target.x + dist * Math.sin(yawDeg * deg) * Math.cos(elevDeg * deg),
    target.y + dist * Math.sin(elevDeg * deg),
    target.z + dist * Math.cos(yawDeg * deg) * Math.cos(elevDeg * deg),
  );

const stackTop = (f: number) => {
  let h = 0;
  LAND.forEach((l, i) => {
    h += T[i] * easeOut(prog(f, l - 4, l + 18));
  });
  return h;
};

const camStack = (f: number): Cam => {
  const top = stackTop(f);
  const t = prog(f, LIGHT_ON, COUNT);
  const target = new THREE.Vector3(0, Math.max(2, top - 4), 0);
  return { pos: orbit(target, lerp(-24, 38, easeInOut(t)), lerp(40, 30, t), lerp(96, 112, t)), target, fov: 34 };
};

const camCount = (f: number): Cam => {
  const target = new THREE.Vector3(0, TOWER_H * 0.5, 0);
  const yaw = 38 + (f - COUNT) * 0.06;
  return { pos: orbit(target, yaw, 18, 135), target, fov: 34 };
};

const camHelix = (f: number): Cam => {
  const t = easeInOut(prog(f, LIFT + 30, HELIX_END - 10));
  const y = lerp(helixY(0) + 2, helixY(9) - 4, t);
  const target = new THREE.Vector3(0, y, 0);
  return { pos: new THREE.Vector3(0, y + 12, 162), target, fov: 34 };
};

const OPEN_CAM = (): Cam => {
  const target = new THREE.Vector3(0, FRONT_POS.y, 0);
  return { pos: new THREE.Vector3(0, FRONT_POS.y + 2, 96), target, fov: 34 };
};

const camOpen = (f: number): Cam => {
  const base = OPEN_CAM();
  // الصفحة اليمنى (افتتاحية الفصل الأول) بعد قلب الورقة
  const rightPage = new THREE.Vector3(6.85, FRONT_POS.y, 2.5);
  const d = easeInOut(prog(f, DOLLY[0], DOLLY[1]));
  const dive = easeIn(prog(f, DIVE[0], DIVE[1]));
  const target = base.target.clone().lerp(rightPage, d);
  const pos = base.pos.clone().lerp(new THREE.Vector3(rightPage.x, rightPage.y + 0.5, 50), d);
  pos.z = lerp(pos.z, 6, dive);
  return { pos, target, fov: 34 };
};

const mix = (a: Cam, b: Cam, t: number): Cam => ({
  pos: a.pos.clone().lerp(b.pos, t),
  target: a.target.clone().lerp(b.target, t),
  fov: lerp(a.fov, b.fov, t),
});

export const camera = (f: number): Cam => {
  if (f < COUNT - 10) return camStack(f);
  if (f < LIFT) return mix(camStack(f), camCount(f), easeInOut(prog(f, COUNT - 10, COUNT + 34)));
  if (f < FRONT) return mix(camCount(f), camHelix(f), easeInOut(prog(f, LIFT, LIFT + 50)));
  return mix(camHelix(f), camOpen(f), easeInOut(prog(f, FRONT, FRONT + FRONT_DUR)));
};

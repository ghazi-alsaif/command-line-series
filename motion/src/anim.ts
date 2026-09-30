import { interpolate } from "remotion";
import { EASE } from "./theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** تقدّم دخول 0→1 بمنحنى الدخول الموحّد */
export const enter = (frame: number, start: number, dur: number) =>
  interpolate(frame, [start, start + dur], [0, 1], { ...clamp, easing: EASE.in });

/** تقدّم خروج 0→1 بمنحنى الخروج الموحّد */
export const exit = (frame: number, start: number, dur: number) =>
  interpolate(frame, [start, start + dur], [0, 1], { ...clamp, easing: EASE.out });

/** حركة كاميرا بطيئة 0→1 على امتداد مدة */
export const cam = (frame: number, start: number, dur: number) =>
  interpolate(frame, [start, start + dur], [0, 1], { ...clamp, easing: EASE.cam });

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** قيمة تنتقل: من a إلى b عند الدخول، ثم إلى c عند الخروج */
export const inOut = (tIn: number, tOut: number, a: number, b: number, c: number) =>
  tOut > 0 ? lerp(b, c, tOut) : lerp(a, b, tIn);

export const fmtThousands = (n: number) => Math.round(n).toLocaleString("en-US");

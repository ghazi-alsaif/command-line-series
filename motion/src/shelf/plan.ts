// «رف السلسلة» — خطة الفيديو ثلاثي الأبعاد: مصدر واحد للتوقيت (يقرؤه React ومولّد الموسيقى).
// 120 BPM · 30fps → النبضة 15 إطارًا. المدة 1260 إطارًا = 42 ثانية.
export const FPS = 30;
export const BEAT = 15;
export const BAR = 60;
export const TOTAL = 21 * BAR;

export const TYPE = { start: 6, text: "ls ~/books", step: 3 };
export const ENTER = 38;
export const LIGHT_ON = 45;
// كل كتاب يسقط على رأس نبضة، كل ثلاث نبضات
export const LAND = Array.from({ length: 10 }, (_, i) => 60 + i * 45);
export const DROP = 16; // مدة السقوط
export const COUNT = 480; // البرج كاملًا
export const LIFT = 600; // الكتب ترتفع إلى اللولب
export const LIFT_STAGGER = 5;
export const LIFT_DUR = 40;
export const HELIX_END = 840;
export const FRONT = 840; // الكتاب الأول يتقدّم
export const FRONT_DUR = 44;
export const OPEN = [890, 930] as const; // الغلاف يُفتح
export const TURN = [950, 994] as const; // ورقة تُقلب
export const DOLLY = [985, 1070] as const; // الكاميرا تقترب من الصفحة
export const DIVE = [1070, 1100] as const; // الدخول في الورق
export const OUTRO = 1100;
export const FADE = [1232, 1260] as const;

// نغمة كل كتاب (سُلّم ري الصغير صاعدًا)
export const BOOK_NOTES = [62, 64, 65, 67, 69, 70, 72, 74, 76, 77];

export const liftStart = (i: number) => LIFT + (9 - i) * LIFT_STAGGER; // الأعلى أولًا

export const exportPlan = () => ({
  FPS, BEAT, BAR, TOTAL, TYPE, ENTER, LIGHT_ON, LAND, DROP, COUNT, LIFT, LIFT_STAGGER, LIFT_DUR, HELIX_END,
  FRONT, FRONT_DUR, OPEN, TURN, DOLLY, DIVE, OUTRO, FADE, BOOK_NOTES,
  lifts: Array.from({ length: 10 }, (_, i) => liftStart(i)),
  typed: Array.from({ length: TYPE.text.length }, (_, k) => TYPE.start + k * TYPE.step),
});

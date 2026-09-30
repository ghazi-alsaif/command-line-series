// الخط الزمني: غيّر المدد من هنا (بالإطارات، 30 إطارًا = ثانية).
// المشاهد تتداخل بمقدار SCENE_OVERLAP ليتقاطع الخروج مع الدخول.

export const SCENE_OVERLAP = 14;

export const BEATS = {
  hook: 132,
  // البدايات الأربع: كتاب واحد لكل خانة + لقطة جماعية
  windowsSlot: 72,
  windowsGroup: 90,
  // الممارسة والحكاية
  practiceSlot: 78,
  storySlot: 112,
  // من الأوامر إلى العالم الحقيقي (أسرع)
  realLead: 6,
  realSlot: 62,
  hero: 190,
  outro: 150,
} as const;

// تأخير دخول أول كتاب حتى يخلي مشهد الافتتاح الشاشة
export const WINDOWS_LEAD = 8;

// التداخل الداخلي بين كتابين متتاليين في المشهد نفسه
export const BOOK_OVERLAP = 14;

const sceneDurations = {
  hook: BEATS.hook,
  windows: WINDOWS_LEAD + BEATS.windowsSlot * 4 + BEATS.windowsGroup,
  practice: BEATS.practiceSlot + BEATS.storySlot,
  realWorld: BEATS.realLead + BEATS.realSlot * 4 + 10,
  hero: BEATS.hero,
  outro: BEATS.outro,
};

export type SceneId = keyof typeof sceneDurations;

export const SCENES: { id: SceneId; from: number; dur: number }[] = (() => {
  const out: { id: SceneId; from: number; dur: number }[] = [];
  let t = 0;
  (Object.keys(sceneDurations) as SceneId[]).forEach((id, i) => {
    const dur = sceneDurations[id];
    const from = i === 0 ? 0 : t - SCENE_OVERLAP;
    out.push({ id, from, dur });
    t = from + dur;
  });
  return out;
})();

export const TOTAL_FRAMES = SCENES[SCENES.length - 1].from + SCENES[SCENES.length - 1].dur;

export const sceneStart = (id: SceneId) => SCENES.find((s) => s.id === id)!.from;

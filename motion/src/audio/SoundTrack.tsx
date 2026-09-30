import React from "react";
import { Audio, Sequence, interpolate, staticFile } from "remotion";
import { BEATS, BOOK_OVERLAP, TOTAL_FRAMES, WINDOWS_LEAD, sceneStart } from "../timeline";

type Cue = { at: number; sfx: "whoosh" | "click" | "impact"; vol: number };

const cues = (): Cue[] => {
  const c: Cue[] = [];
  // الافتتاح: نقرات كتابة ./build.sh ثم نفَس وارتطام عند الشعار والهوية
  [12, 15, 17, 19, 22, 24, 26, 29, 31, 33].forEach((f) => c.push({ at: f, sfx: "click", vol: 0.22 }));
  c.push({ at: 32, sfx: "whoosh", vol: 0.32 });
  c.push({ at: 76, sfx: "impact", vol: 0.4 });

  // البدايات الأربع
  const w = sceneStart("windows") + WINDOWS_LEAD;
  for (let i = 0; i < 4; i++) {
    c.push({ at: w + i * BEATS.windowsSlot - 4, sfx: "whoosh", vol: 0.3 });
  }
  c.push({ at: w + BEATS.windowsSlot * 4 - BOOK_OVERLAP, sfx: "whoosh", vol: 0.34 });
  c.push({ at: w + BEATS.windowsSlot * 4 - BOOK_OVERLAP + 22, sfx: "impact", vol: 0.38 });

  // الممارسة والحكاية
  const p = sceneStart("practice");
  c.push({ at: p - 2, sfx: "whoosh", vol: 0.3 });
  c.push({ at: p + BEATS.practiceSlot - 4, sfx: "whoosh", vol: 0.22 });

  // العالم الحقيقي: نفَس لكل كتاب + نقرات سطر الأوامر
  const r = sceneStart("realWorld") + BEATS.realLead;
  for (let i = 0; i < 4; i++) {
    const s = r + i * BEATS.realSlot;
    c.push({ at: s - 3, sfx: "whoosh", vol: 0.28 });
    [6, 8, 10, 12].forEach((d) => c.push({ at: s + d, sfx: "click", vol: 0.16 }));
  }

  // الكتب العشرة
  const h = sceneStart("hero");
  c.push({ at: h, sfx: "whoosh", vol: 0.36 });
  c.push({ at: h + 56, sfx: "impact", vol: 0.45 });

  // الخاتمة
  const o = sceneStart("outro");
  c.push({ at: o + 2, sfx: "whoosh", vol: 0.26 });
  c.push({ at: o + 26, sfx: "impact", vol: 0.3 });
  return c;
};

const LEN = { whoosh: 27, click: 2, impact: 42 } as const;

export const SoundTrack: React.FC = () => (
  <>
    <Audio
      src={staticFile("sfx/pad.mp3")}
      volume={(f) =>
        interpolate(f, [0, 45, TOTAL_FRAMES - 60, TOTAL_FRAMES], [0, 0.26, 0.26, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      }
    />
    {cues()
      .filter((q) => q.at >= 0)
      .map((q, i) => (
        <Sequence key={i} from={q.at} durationInFrames={LEN[q.sfx] + 4} layout="none">
          <Audio src={staticFile(`sfx/${q.sfx}.mp3`)} volume={q.vol} />
        </Sequence>
      ))}
  </>
);

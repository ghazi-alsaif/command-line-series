import React from "react";
import { AbsoluteFill, Sequence, interpolate, interpolateColors, useCurrentFrame } from "remotion";
import { SoundTrack } from "./audio/SoundTrack";
import { Background } from "./components/Background";
import { byN } from "./data/books";
import { loadLocalFonts } from "./fonts";
import { FourWindows } from "./scenes/FourWindows";
import { Hero } from "./scenes/Hero";
import { Hook } from "./scenes/Hook";
import { Outro } from "./scenes/Outro";
import { PracticeStory } from "./scenes/PracticeStory";
import { RealWorld } from "./scenes/RealWorld";
import { BEATS, BOOK_OVERLAP, SCENE_OVERLAP, SCENES, SceneId, WINDOWS_LEAD, sceneStart } from "./timeline";
import { COLOR, glowFrom } from "./theme";

loadLocalFonts();

const PINE = glowFrom(COLOR.pine, 0.4);
const acc = (n: number) => glowFrom(byN(n).titleColor, 0.42);

// لون التوهّج في الخلفية يتبع الكتاب المعروض — انتقال لوني متصل بلا قفزات
const accentKeys = (): [number, string][] => {
  const w = sceneStart("windows") + WINDOWS_LEAD;
  const p = sceneStart("practice");
  const r = sceneStart("realWorld");
  const h = sceneStart("hero");
  const o = sceneStart("outro");
  const s = BEATS.windowsSlot;
  return [
    [0, PINE],
    [w, acc(1)],
    [w + s, acc(2)],
    [w + s * 2, acc(3)],
    [w + s * 3, acc(4)],
    [w + s * 4 - BOOK_OVERLAP, PINE],
    [p, acc(5)],
    [p + BEATS.practiceSlot, acc(6)],
    [r, acc(7)],
    [h, PINE],
    [o, PINE],
  ];
};

const KEYS = accentKeys();

const SceneFade: React.FC<{ dur: number; fadeIn: boolean; fadeOut: boolean; children: React.ReactNode }> = ({
  dur,
  fadeIn,
  fadeOut,
  children,
}) => {
  const f = useCurrentFrame();
  const a = fadeIn ? interpolate(f, [0, SCENE_OVERLAP], [0, 1], { extrapolateRight: "clamp" }) : 1;
  const b = fadeOut
    ? interpolate(f, [dur - SCENE_OVERLAP, dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : 1;
  return <AbsoluteFill style={{ opacity: Math.min(a, b) }}>{children}</AbsoluteFill>;
};

const SCENE_VIEW: Record<SceneId, (dur: number) => React.ReactNode> = {
  hook: (d) => <Hook dur={d} />,
  windows: () => <FourWindows />,
  practice: () => <PracticeStory />,
  realWorld: (d) => <RealWorld dur={d} />,
  hero: (d) => <Hero dur={d} />,
  outro: (d) => <Outro dur={d} />,
};

export const Promo: React.FC = () => {
  const frame = useCurrentFrame();
  const accent = interpolateColors(
    frame,
    KEYS.map((k) => k[0]),
    KEYS.map((k) => k[1]),
  );
  // بداية من السواد
  const fromBlack = interpolate(frame, [0, 8], [0.7, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.night }}>
      <Background accent={accent} />
      {SCENES.map((s, i) => (
        <Sequence key={s.id} from={s.from} durationInFrames={s.dur} name={s.id}>
          <SceneFade
            dur={s.dur}
            fadeIn={i > 0 && s.id !== "outro"}
            fadeOut={i < SCENES.length - 1}
          >
            {SCENE_VIEW[s.id](s.dur)}
          </SceneFade>
        </Sequence>
      ))}
      <AbsoluteFill style={{ backgroundColor: "#000", opacity: fromBlack, pointerEvents: "none" }} />
      <SoundTrack />
    </AbsoluteFill>
  );
};

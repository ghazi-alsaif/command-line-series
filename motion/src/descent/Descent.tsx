import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { enter, lerp } from "../anim";
import { loadLocalFonts } from "../fonts";
import { COLOR } from "../theme";
import { HeroTree, LoopPrompt, PaperOutro } from "./Finale";
import { Roots } from "./Roots";
import { Depths, DepthMeter, NearDust, WorldBook, WorldMarks } from "./World";
import { HERO, LAND, LOOP_CLOSE, OUTRO, TOTAL, camVel, camY } from "./plan";

loadLocalFonts();

// «الهبوط»: لقطة واحدة متصلة تنزل في جذر الطرفية من الشعار حتى طرفه،
// ثم تنسحب فترى الشجرة كلها، ثم تنغلق على المؤشر فيعود الفيديو إلى أوله.
export const Descent: React.FC = () => {
  const frame = useCurrentFrame();
  const cam = camY(frame);
  const vel = camVel(frame);

  // ارتجاج خفيف عند كل هبوط
  let shake = 0;
  for (const l of [60, ...LAND]) {
    const d = frame - l;
    if (d >= 0 && d < 14) shake += Math.sin(d * 2.4) * 7 * Math.exp(-d / 4);
  }
  const blur = Math.min(22, Math.abs(vel) * 0.075);
  const grow = frame < 64 ? 0 : interpolate(frame, [64, 110], [1017, 2600], { extrapolateRight: "clamp" }) + Math.max(0, cam);
  const worldOut = enter(frame, HERO, 16);

  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.night }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id="mblur" x="-10%" y="-25%" width="120%" height="150%">
          <feGaussianBlur stdDeviation={`0.01 ${blur.toFixed(2)}`} />
        </filter>
      </svg>
      {frame < HERO + 20 ? (
        <AbsoluteFill
          style={{
            opacity: 1 - worldOut,
            transform: `translateY(${shake}px) scale(${lerp(1, 0.3, worldOut)})`,
            filter: worldOut > 0 ? `blur(${worldOut * 14}px)` : undefined,
          }}
        >
          <Depths cam={cam} />
          <AbsoluteFill style={{ filter: blur > 0.6 ? "url(#mblur)" : undefined }}>
            <Roots cam={cam} grow={grow} />
            <WorldMarks cam={cam} />
            {LAND.map((_, i) => (
              <WorldBook key={i} i={i} cam={cam} vel={vel} />
            ))}
            <NearDust cam={cam} />
          </AbsoluteFill>
          <DepthMeter cam={cam} />
        </AbsoluteFill>
      ) : null}
      {frame >= HERO - 1 && frame < OUTRO + 50 ? <HeroTree /> : null}
      {frame >= LOOP_CLOSE ? <Depths cam={0} /> : null}
      {frame >= OUTRO ? <PaperOutro /> : null}
      <LoopPrompt />
      <Sequence durationInFrames={TOTAL}>
        <Audio src={staticFile("audio/descent-score.wav")} />
      </Sequence>
    </AbsoluteFill>
  );
};

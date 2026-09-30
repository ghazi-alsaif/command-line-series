import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { cam, enter, lerp } from "../anim";
import { FadeText } from "../components/Text";
import { COPY } from "../data/copy";
import { COLOR, FONT } from "../theme";

// المشهد الأخير: الشاشة الداكنة تنفتح على ورق الكتب الدافئ،
// وتظهر هوية السلسلة الرسمية كما هي (أخضر صنوبري على ورق دافئ).
export const Outro: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const open = enter(frame, 6, 46);
  const push = cam(frame, 0, dur);
  const idIn = enter(frame, 24, 36);

  // انفتاح دائري بحافة ناعمة من مركز الإطار
  const r = lerp(0, 1520, open);
  const soft = 220;
  const mask = `radial-gradient(circle at 540px 900px, #000 ${Math.max(0, r - soft)}px, transparent ${r}px)`;

  return (
    <AbsoluteFill style={{ maskImage: mask, WebkitMaskImage: mask }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(90% 70% at 50% 42%, ${COLOR.paper} 0%, ${COLOR.sand} 75%, #E3D6B8 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(rgba(22,74,62,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(22,74,62,0.06) 1px, transparent 1px)",
          backgroundSize: "108px 108px",
          backgroundPosition: `540px ${-frame * 0.2}px`,
          maskImage: "radial-gradient(70% 55% at 50% 45%, #000 10%, transparent 85%)",
          WebkitMaskImage: "radial-gradient(70% 55% at 50% 45%, #000 10%, transparent 85%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 440,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          opacity: idIn,
          transform: `scale(${lerp(1.05, 1, idIn) + push * 0.02}) translateY(${(1 - idIn) * 20}px)`,
          filter: `blur(${((1 - idIn) * 8).toFixed(2)}px)`,
        }}
      >
        <Img src={staticFile("brand/series-identity.png")} style={{ width: 820 }} />
      </div>

      <div
        style={{
          position: "absolute",
          top: 1020,
          left: 90,
          right: 90,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
        }}
      >
        <FadeText
          text={COPY.outro.requirement}
          start={56}
          dur={24}
          size={40}
          weight={500}
          font={FONT.body}
          color={COLOR.ink}
        />
        <FadeText
          text={COPY.outro.author}
          start={76}
          dur={24}
          size={34}
          weight={600}
          font={FONT.body}
          color={COLOR.pineDeep}
          style={{ marginTop: 44 }}
        />
        <FadeText
          dir="ltr"
          text={COPY.outro.repo}
          start={92}
          dur={24}
          size={30}
          weight={500}
          font={FONT.mono}
          color={COLOR.pineDeep}
          style={{ marginTop: 40 }}
        />
        <FadeText
          dir="ltr"
          text={COPY.outro.site}
          start={102}
          dur={24}
          size={26}
          weight={400}
          font={FONT.mono}
          color="#5E5B66"
        />
      </div>
    </AbsoluteFill>
  );
};

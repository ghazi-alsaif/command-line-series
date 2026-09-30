import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { cam, enter, exit, lerp } from "../anim";
import { BOOKS } from "../data/books";
import { COPY } from "../data/copy";
import { Book3D } from "../components/Book3D";
import { RevealText, TypeLine } from "../components/Text";
import { COLOR, FONT, glowFrom } from "../theme";

// مواضع ثابتة للأغلفة في عمق الخلفية (حتمية — لا عشوائية بين الإطارات)
const FIELD = [
  { x: -330, y: -560, d: 0 },
  { x: 350, y: -420, d: 4 },
  { x: -380, y: -80, d: 8 },
  { x: 390, y: 60, d: 2 },
  { x: -300, y: 420, d: 6 },
  { x: 330, y: 540, d: 10 },
  { x: 0, y: -760, d: 12 },
  { x: 20, y: 760, d: 5 },
  { x: -420, y: 800, d: 9 },
  { x: 420, y: -820, d: 3 },
];

export const Hook: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();

  // الشارة تظهر بعد الشعار
  const brandIn = enter(frame, 76, 30) * (1 - exit(frame, dur - 22, 16));
  const camPush = cam(frame, 0, dur);

  return (
    <AbsoluteFill>
      {/* أغلفة تعبر العمق خلف النص */}
      {BOOKS.map((b, i) => {
        const f = FIELD[i];
        const t = enter(frame, f.d, 70);
        const away = exit(frame, 70 + f.d * 0.5, 40);
        const z = lerp(-2600, -900, t) + camPush * 300;
        return (
          <Book3D
            key={b.id}
            src={b.cover}
            width={300}
            x={f.x * 1.9}
            y={f.y * 1.5}
            z={z}
            rotY={f.x > 0 ? -22 : 22}
            rotX={f.y > 0 ? 8 : -8}
            blur={lerp(10, 4, t) + away * 8}
            opacity={Math.min(0.5, t * 0.9) * (1 - away)}
            shadow={0.4}
          />
        );
      })}

      {/* تظليل مركزي يفصل النص عن الأغلفة */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(48% 30% at 50% 50%, ${COLOR.night}ee 0%, transparent 100%)`,
          opacity: enter(frame, 20, 30),
        }}
      />

      {/* سطر الأوامر */}
      <div
        style={{
          position: "absolute",
          top: 640,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          opacity: enter(frame, 0, 10) * (1 - exit(frame, 96, 20) * 0.6),
          transform: `translateY(${lerp(80, 0, enter(frame, 30, 30))}px)`,
        }}
      >
        <TypeLine
          text={COPY.hook.command}
          start={10}
          cps={18}
          size={42}
          color={COLOR.text}
          promptColor={glowFrom("#1F6F5C", 0.62)}
        />
      </div>

      {/* الشعار: من الصفر إلى فهم الآلة */}
      <div style={{ position: "absolute", top: 730, width: "100%", display: "flex", justifyContent: "center" }}>
        <RevealText
          text={COPY.hook.tagline.replace(" إلى ", "\nإلى ")}
          start={34}
          dur={30}
          exitAt={dur - 26}
          exitDur={18}
          size={112}
          weight={800}
          lineHeight={1.38}
          color={COLOR.text}
        />
      </div>

      {/* هوية السلسلة */}
      <div
        style={{
          position: "absolute",
          top: 1110,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 18,
          opacity: brandIn,
          transform: `translateY(${(1 - brandIn) * 24}px)`,
          filter: `blur(${((1 - brandIn) * 6).toFixed(2)}px)`,
        }}
      >
        <div
          style={{
            width: 132,
            height: 132,
            borderRadius: "50%",
            background: COLOR.cream,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 60px ${glowFrom("#1F6F5C", 0.5, 0.45)}`,
          }}
        >
          <Img src={staticFile("brand/series-mark.png")} style={{ height: 96 }} />
        </div>
        <div
          dir="rtl"
          lang="ar"
          style={{
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: 50,
            color: COLOR.text,
            direction: "rtl",
          }}
        >
          {COPY.hook.series}
        </div>
        <div
          style={{
            width: lerp(0, 260, enter(frame, 88, 30)),
            height: 2,
            background: COLOR.brandOrange,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { cam, enter, fmtThousands, lerp } from "../anim";
import { Book3D, COVER_RATIO } from "../components/Book3D";
import { FadeText, RevealText } from "../components/Text";
import { BOOKS, SERIES } from "../data/books";
import { COPY } from "../data/copy";
import { COLOR, FONT, glowFrom } from "../theme";

// المشهد 5 — الكتب العشرة معًا بترتيب السلسلة:
// صف البدايات الأربع ← صف الممارسة والحكاية ← صف العالم الحقيقي.
const ROWS = [
  [1, 2, 3, 4],
  [5, 6],
  [7, 8, 9, 10],
];

export const Hero: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const w = 186;
  const h = w * COVER_RATIO;
  const gx = 22;
  const gy = 26;
  const cy = 722;
  const push = cam(frame, 0, dur);

  const placed: { n: number; x: number; y: number; order: number }[] = [];
  let order = 0;
  ROWS.forEach((row, r) => {
    const rowW = row.length * w + (row.length - 1) * gx;
    row.forEach((n, i) => {
      // الأول في أقصى اليمين
      const x = rowW / 2 - w / 2 - i * (w + gx);
      const y = (r - 1) * (h + gy);
      placed.push({ n, x, y, order: order++ });
    });
  });

  const pagesT = enter(frame, 70, 50);

  return (
    <AbsoluteFill>
      {placed.map((p) => {
        const b = BOOKS.find((x) => x.n === p.n)!;
        const t = enter(frame, 4 + p.order * 3, 36);
        return (
          <Book3D
            key={b.id}
            src={b.cover}
            width={w}
            cy={cy}
            x={p.x * lerp(1.35, 1, t) * lerp(1, 1.03, push)}
            y={p.y * lerp(1.35, 1, t) * lerp(1, 1.03, push)}
            z={lerp(-1600, 0, t) + push * 50}
            rotY={lerp(p.x > 0 ? -30 : 30, p.x * -0.012, t)}
            rotX={lerp(14, 3, t) - push * 2}
            blur={(1 - t) * 14}
            opacity={Math.min(1, t * 1.5)}
            glow={glowFrom(b.titleColor, 0.5, 0.18)}
            shadow={0.6}
            perspective={2200}
          />
        );
      })}

      <div
        style={{
          position: "absolute",
          top: 1206,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <RevealText text={COPY.hero.count} start={56} size={88} weight={800} lineHeight={1.35} />
        <div
          dir="rtl"
          lang="ar"
          style={{
            fontFamily: FONT.body,
            fontWeight: 500,
            fontSize: 40,
            color: glowFrom("#C0592B", 0.66),
            direction: "rtl",
            opacity: enter(frame, 68, 16),
            transform: `translateY(${(1 - enter(frame, 68, 16)) * 12}px)`,
          }}
        >
          <bdi style={{ fontWeight: 600 }}>
            {fmtThousands(SERIES.totalPages * pagesT)}
          </bdi>{" "}
          {COPY.hero.pagesLabel}
        </div>
        <FadeText
          text={COPY.hero.tagline}
          start={100}
          size={44}
          weight={600}
          font={FONT.display}
          color={COLOR.text}
          style={{ marginTop: 20 }}
        />
      </div>
    </AbsoluteFill>
  );
};

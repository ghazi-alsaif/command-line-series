import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { enter, lerp } from "../anim";
import { BookSpotlight } from "../components/BookSpotlight";
import { Book3D, COVER_RATIO } from "../components/Book3D";
import { FadeText, RevealText } from "../components/Text";
import { BOOKS, byN } from "../data/books";
import { COPY } from "../data/copy";
import { BEATS, BOOK_OVERLAP, WINDOWS_LEAD } from "../timeline";
import { COLOR, FONT, glowFrom } from "../theme";

// المشهد 2 — البدايات الأربع: لينكس · ماك · ويندوز · BSD
export const FourWindows: React.FC = () => {
  const slot = BEATS.windowsSlot;
  const groupFrom = WINDOWS_LEAD + slot * 4 - BOOK_OVERLAP;
  return (
    <AbsoluteFill>
      {[1, 2, 3, 4].map((n, i) => (
        <Sequence key={n} from={WINDOWS_LEAD + i * slot} durationInFrames={slot + BOOK_OVERLAP} layout="none">
          <BookSpotlight book={byN(n)} total={BOOKS.length} hold={slot} exitDur={BOOK_OVERLAP} />
        </Sequence>
      ))}
      <Sequence from={groupFrom} layout="none">
        <FourTogether />
      </Sequence>
    </AbsoluteFill>
  );
};

// الأربعة معًا للحظة: شبكة 2×2 بترتيب القراءة العربية (الأول أعلى اليمين)
const FourTogether: React.FC = () => {
  const frame = useCurrentFrame();
  const w = 310;
  const h = w * COVER_RATIO;
  const gapX = 44;
  const gapY = 40;
  const cells = [
    { n: 1, x: (w + gapX) / 2, y: -(h + gapY) / 2 },
    { n: 2, x: -(w + gapX) / 2, y: -(h + gapY) / 2 },
    { n: 3, x: (w + gapX) / 2, y: (h + gapY) / 2 },
    { n: 4, x: -(w + gapX) / 2, y: (h + gapY) / 2 },
  ];
  const cy = 740;

  return (
    <AbsoluteFill>
      {cells.map((c, i) => {
        const t = enter(frame, i * 4, 30);
        const breathe = enter(frame, 20, 90);
        const b = byN(c.n);
        return (
          <Book3D
            key={c.n}
            src={b.cover}
            width={w}
            cy={cy}
            x={c.x * lerp(1.5, 1, t)}
            y={c.y * lerp(1.3, 1, t)}
            z={lerp(-700, 0, t) + breathe * 40}
            rotY={lerp(c.x > 0 ? -26 : 26, c.x > 0 ? -7 : 7, t)}
            rotX={lerp(c.y > 0 ? 10 : -10, c.y > 0 ? 3 : -3, t)}
            blur={(1 - t) * 12}
            opacity={Math.min(1, t * 1.5)}
            glow={glowFrom(b.titleColor, 0.5, 0.22)}
            shadow={0.7}
          />
        );
      })}
      <div
        style={{
          position: "absolute",
          top: 1228,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0,
        }}
      >
        <RevealText text={COPY.fourWindows.line1} start={22} size={66} weight={800} color={COLOR.text} />
        <RevealText
          text={COPY.fourWindows.line2}
          start={36}
          size={66}
          weight={800}
          color={glowFrom("#1F6F5C", 0.64)}
        />
        <FadeText
          dir="ltr"
          text={COPY.fourWindows.en}
          start={52}
          size={26}
          font={FONT.mono}
          letterSpacing={2}
          color={COLOR.textDim}
          style={{ marginTop: 8 }}
        />
      </div>
    </AbsoluteFill>
  );
};
